# CLAUDE.md

## Vue d'ensemble du projet

PWA de journal cartographique personnel. L'utilisateur crée des itinéraires sur une carte interactive, pose des marqueurs colorés librement (sans les relier obligatoirement), attache des photos et descriptions à chaque point. Chaque couleur correspond à une catégorie personnalisée (vélo, à pied, camping, etc.).

**Cible :** mobile-first, grand public, zéro friction technique.
**Offline-first :** toutes les fonctionnalités doivent fonctionner sans connexion.
**Pas de backend pour l'instant.** Tout est local.

---

## Stack technique

| Rôle                   | Outil                             | Version        |
| ---------------------- | --------------------------------- | -------------- |
| Bundler / Dev          | Vite + React + TypeScript         | latest         |
| Carte                  | MapLibre GL JS                    | ^4.x           |
| Base de données locale | Dexie.js (IndexedDB)              | ^4.x           |
| Stockage photos        | OPFS (Origin Private File System) | Web API native |
| Handle dossier         | idb-keyval                        | ^6.x           |
| Export archive         | JSZip                             | ^3.x           |
| PWA (SW + manifest)    | vite-plugin-pwa                   | ^0.x           |
| Style                  | Tailwind CSS                      | ^3.x           |

```bash
pnpm create vite . --template react-ts
pnpm add dexie dexie-react-hooks maplibre-gl jszip idb-keyval vite-plugin-pwa tailwindcss
```

---

## Structure du projet

```
/
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── core/
│   │   ├── db/
│   │   │   ├── schema.ts               # Dexie schema
│   │   │   └── repositories/
│   │   │       ├── itinerary.repo.ts
│   │   │       ├── point.repo.ts
│   │   │       ├── category.repo.ts
│   │   │       └── photo.repo.ts
│   │   ├── storage/
│   │   │   ├── opfs.ts                 # Lecture / écriture photos en OPFS
│   │   │   ├── folder.ts               # File System Access API (Android)
│   │   │   └── export.ts               # Export ZIP itinéraire complet
│   │   └── map/
│   │       ├── renderer.ts             # Init MapLibre
│   │       └── markers.ts              # Génération SVG markers colorés
│   ├── features/
│   │   ├── onboarding/                 # Sélection dossier au premier lancement
│   │   ├── map/                        # Vue carte principale
│   │   ├── itinerary/                  # Création / édition / liste itinéraires
│   │   ├── point/                      # Ajout point, photo, description
│   │   ├── legend/                     # Gestion catégories couleur utilisateur
│   │   └── export/                     # Export / backup
│   ├── hooks/
│   │   ├── useMap.ts
│   │   ├── useItinerary.ts
│   │   ├── usePoint.ts
│   │   └── usePhoto.ts
│   ├── components/
│   └── App.tsx
├── CLAUDE.md
├── vite.config.ts
└── package.json
```

---

## Modèle de données (Dexie / IndexedDB)

```typescript
// Catégorie définie par l'utilisateur
interface Category {
  id: string; // uuid
  name: string; // "Vélo", "À pied", "Camping"
  color: string; // hex "#8B4513"
  icon: string; // emoji ou slug d'icône
  createdAt: number;
}

// Un itinéraire = collection de points
interface Itinerary {
  id: string;
  name: string;
  categoryId: string; // catégorie par défaut pour les points de cet itinéraire
  description?: string;
  createdAt: number;
  updatedAt: number;
}

// Un point posé sur la carte
interface MapPoint {
  id: string;
  itineraryId: string;
  lat: number;
  lng: number;
  categoryId: string; // peut différer de l'itinéraire parent
  description?: string;
  photoIds: string[]; // références vers OPFS
  createdAt: number;
}

// Métadonnées photo (le binaire est dans OPFS)
interface Photo {
  id: string;
  pointId: string;
  filename: string; // nom dans OPFS : `${id}.jpg`
  caption?: string;
  takenAt?: number;
}
```

**Index Dexie :**

```
itineraries : '++id, categoryId, updatedAt'
points      : '++id, itineraryId, categoryId'
photos      : '++id, pointId'
categories  : '++id'
settings    : 'key'
```

---

## Stockage — règles absolues

### Données structurées → IndexedDB (Dexie)

Tout ce qui est texte, coordonnées, métadonnées, références.

### Photos (binaires) → OPFS

Ne jamais stocker de Blob dans IndexedDB — trop lent, quotas atteints rapidement.

```typescript
// Sauvegarder une photo
const root = await navigator.storage.getDirectory();
const photosDir = await root.getDirectoryHandle('photos', {create: true});
const fileHandle = await photosDir.getFileHandle(`${photoId}.jpg`, {
  create: true
});
const writable = await fileHandle.createWritable();
await writable.write(file);
await writable.close();

// Lire une photo → URL objet temporaire
const file = await fileHandle.getFile();
const url = URL.createObjectURL(file);
// Toujours libérer après usage : URL.revokeObjectURL(url)
```

---

## Stratégie dossier utilisateur

### Android (Chrome) — File System Access API

L'utilisateur choisit **une seule fois** un dossier sur son téléphone au premier lancement.
Le handle est persisté dans IndexedDB via `idb-keyval`. Aux sessions suivantes, on vérifie/re-demande la permission sans re-picker.

```typescript
// Demande initiale
const handle = await window.showDirectoryPicker({
  mode: 'readwrite',
  startIn: 'documents'
});
await idbSet('userFolderHandle', handle);

// Sessions suivantes
const handle = await idbGet('userFolderHandle');
const perm = await handle.queryPermission({mode: 'readwrite'});
if (perm !== 'granted') await handle.requestPermission({mode: 'readwrite'});
```

L'export écrit directement dans ce dossier :

```
/DossierChoisi/
├── itineraires.json
├── categories.json
└── photos/
    ├── uuid-1.jpg
    └── uuid-2.jpg
```

### iOS (Safari) — fallback obligatoire

`showDirectoryPicker` n'est pas supporté. Stratégie :

- Stockage interne OPFS (invisible pour l'user)
- Bouton "Exporter" dans l'UI → génère un ZIP → déclenche un téléchargement → atterrit dans "Fichiers" / iCloud Drive

```typescript
export async function exportAsZip(itineraryId: string): Promise<void> {
  const zip = new JSZip();
  const itinerary = await db.itineraries.get(itineraryId);
  const points = await db.points
    .where('itineraryId')
    .equals(itineraryId)
    .toArray();

  zip.file('itinerary.json', JSON.stringify({itinerary, points}, null, 2));

  const photosFolder = zip.folder('photos')!;
  for (const point of points) {
    for (const photoId of point.photoIds) {
      const blob = await getPhotoBlob(photoId);
      photosFolder.file(`${photoId}.jpg`, blob);
    }
  }

  const content = await zip.generateAsync({type: 'blob'});
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${itinerary.name}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## Onboarding — premier lancement

Détecter Android vs iOS, adapter le flow :

```typescript
const isAndroid = /android/i.test(navigator.userAgent);
const hasFileSystemAccess = 'showDirectoryPicker' in window;

// Android → proposer de choisir un dossier
// iOS     → expliquer que l'export se fera via "Fichiers"
// Les deux → l'app fonctionne offline immédiatement, le dossier n'est pas bloquant
```

L'onboarding ne doit pas bloquer l'accès à l'app. Le choix du dossier est recommandé, pas obligatoire.

---

## Carte — MapLibre GL JS

- Tiles OSM par défaut (gratuites)
- Possibilité de cacher des tuiles pour le mode offline via Service Worker
- Les marqueurs sont des SVG générés dynamiquement selon la couleur de la catégorie
- Un clic sur la carte en mode "ajout" → ouvre le drawer de création de point
- Pas de tracé de ligne entre les points (marqueurs libres uniquement, sauf si l'user le demande)

```typescript
// Marqueur coloré SVG
function createMarkerSvg(color: string): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="3"/>
    </svg>`;
  return el;
}
```

---

## Service Worker — règles

- Géré par `vite-plugin-pwa` + Workbox
- Cache strategy : **CacheFirst** pour les assets statiques, **NetworkFirst** pour les tuiles carte
- L'app doit démarrer et être utilisable sans réseau après la première visite

---

## Conventions de code

- **TypeScript strict** — pas de `any`, pas de `!` non justifié
- **Repositories** — toute interaction avec Dexie passe par un repo, jamais directement depuis les composants
- **Pas d'état global** — React Query ou Dexie hooks suffisent
- **Nommage fichiers** — `kebab-case.ts`, `PascalCase.tsx` pour les composants
- **Erreurs storage** — toujours wrapper en try/catch, afficher un feedback utilisateur lisible (pas de console.error nu)
- **URL.createObjectURL** — toujours révoquer après usage pour éviter les fuites mémoire

---

## Ce qui n'est pas dans ce projet (pour l'instant)

- Authentification / comptes utilisateur
- Synchronisation cloud / backend
- Partage d'itinéraire entre utilisateurs
- Import GPX
- Tracé GPS automatique (l'utilisateur pose les points à la main)
