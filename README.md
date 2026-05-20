# CartEmpreinte

> Journal cartographique personnel — offline-first, mobile-first, zéro backend.

CartEmpreinte est une Progressive Web App qui permet de poser des marqueurs colorés sur une carte interactive, d'y attacher des photos et des descriptions, et d'organiser le tout en itinéraires. Toutes les données restent sur l'appareil : aucun compte, aucun serveur, aucune connexion requise.

---

## Fonctionnalités

- **Carte interactive** — tuiles OpenStreetMap, marqueurs SVG colorés par catégorie
- **Points libres** — un tap sur la carte crée un point, avec description et photos
- **Itinéraires** — regroupement de points par voyage ou activité
- **Catégories personnalisées** — couleur et icône libres (vélo, randonnée, camping…)
- **Photos** — capture directe depuis la caméra ou import galerie
- **Adresse automatique** — résolution Nominatim au premier affichage, sauvegardée localement
- **Filtres** — afficher/masquer les itinéraires sur la carte
- **Export ZIP** — archive complète (données JSON + photos) téléchargeable
- **Export dossier** — écriture directe dans un dossier Android via File System Access API
- **Offline-first** — fonctionne sans réseau après la première visite (Service Worker + Workbox)
- **Installable** — ajout à l'écran d'accueil sur iOS et Android (manifest PWA)

---

## Stack technique

| Rôle | Outil | Version |
|---|---|---|
| Bundler / Dev server | Vite | ^8 |
| UI | React + TypeScript | 19 / ~6 |
| Style | Tailwind CSS | ^4 |
| Carte | MapLibre GL JS | ^5 |
| Base de données locale | Dexie.js (IndexedDB) | ^4 |
| Stockage photos | OPFS (Origin Private File System) | Web API native |
| Handle dossier | idb-keyval | ^6 |
| Export archive | JSZip | ^3 |
| PWA (SW + manifest) | vite-plugin-pwa / Workbox | ^1 |

---

## Choix techniques

### Pourquoi IndexedDB (Dexie) et pas localStorage ?

`localStorage` est synchrone, limité à 5 Mo et ne supporte que les chaînes. Dexie expose IndexedDB avec une API async propre, des transactions, et des quotas bien plus larges (généralement 60 % du disque disponible). Les hooks `useLiveQuery` permettent une réactivité React sans état global ni Redux.

### Pourquoi OPFS pour les photos ?

Stocker des Blobs dans IndexedDB dégrade les performances et atteint rapidement les quotas. L'Origin Private File System est une API de fichiers isolée, rapide, et non exposée au navigateur de fichiers de l'appareil — idéale pour du stockage binaire interne. Les URLs sont générées à la demande via `URL.createObjectURL` et révoquées immédiatement après usage.

### Pourquoi pas de state global (Redux, Zustand) ?

La réactivité est assurée directement par `useLiveQuery` de Dexie-React-Hooks : chaque composant s'abonne aux données dont il a besoin et se re-render automatiquement à chaque mutation. Un store global serait un doublon.

### Pourquoi MapLibre GL JS et pas Leaflet ?

MapLibre est basé sur WebGL : il gère nativement les grands jeux de tuiles, le rendu vectoriel et les animations de caméra. Il est entièrement open-source (fork de Mapbox GL JS v1) et n'impose aucune clé API pour les tuiles raster OSM.

### Stratégie offline

- **Assets statiques** (JS, CSS, images) : CacheFirst via Workbox, précachés au build
- **Tuiles OSM** : NetworkFirst — servi depuis le cache si hors ligne, mis à jour en ligne
- **Photos** : OPFS, toujours disponibles hors ligne
- **Données** : IndexedDB, toujours disponibles hors ligne
- **Nominatim** : uniquement si `navigator.onLine`, résultat sauvegardé définitivement

### Gestion dossier (Android vs iOS)

Sur Android/Chrome, `showDirectoryPicker` permet d'écrire directement dans un dossier choisi par l'utilisateur. Le handle est persisté dans IndexedDB via idb-keyval et les permissions sont re-demandées à chaque session. Sur iOS/Safari, l'API n'est pas supportée : l'export génère un ZIP téléchargé dans l'app Fichiers.

---

## Architecture

```
src/
├── core/                         # Logique métier pure (sans React)
│   ├── db/
│   │   ├── schema.ts             # Interfaces TypeScript + instance Dexie
│   │   └── repositories/
│   │       ├── itinerary.repo.ts
│   │       ├── point.repo.ts
│   │       ├── category.repo.ts
│   │       └── photo.repo.ts
│   ├── storage/
│   │   ├── opfs.ts               # Lecture / écriture photos en OPFS
│   │   ├── folder.ts             # File System Access API (Android)
│   │   └── export.ts             # Export ZIP + export dossier
│   └── map/
│       ├── renderer.ts           # Initialisation MapLibre
│       └── markers.ts            # Génération SVG markers via DOM API
│
├── features/                     # Vues et composants métier
│   ├── onboarding/               # Premier lancement, choix dossier
│   ├── map/                      # Vue carte principale + filtres
│   ├── itinerary/                # Liste et création d'itinéraires
│   ├── point/                    # Création et édition de points
│   ├── legend/                   # Gestion des catégories
│   └── export/                   # Export et sauvegarde
│
├── components/                   # Composants UI génériques
│   ├── BottomNav.tsx
│   ├── Toast.tsx
│   └── Fab.tsx
│
└── App.tsx                       # Routing par onglets, init DB
```

### Modèle de données

```typescript
interface Category {
  id: string        // uuid
  name: string      // "Vélo", "Randonnée"
  color: string     // hex "#16a34a"
  icon: string      // emoji "🚴"
  createdAt: number
}

interface Itinerary {
  id: string
  name: string
  categoryId: string
  createdAt: number
  updatedAt: number
}

interface MapPoint {
  id: string
  itineraryId?: string
  lat: number
  lng: number
  categoryId: string
  description?: string
  address?: string    // résolu par Nominatim, sauvegardé localement
  photoIds: string[]  // références vers OPFS
  createdAt: number
}

interface Photo {
  id: string
  pointId: string
  filename: string  // `${id}.jpg` dans OPFS
  caption?: string
  takenAt?: number
}
```

---

## Installation

### Prérequis

- [Node.js](https://nodejs.org) ≥ 18
- [pnpm](https://pnpm.io) ≥ 8

```bash
# Cloner le dépôt
git clone https://github.com/votre-utilisateur/cartempreinte.git
cd cartempreinte

# Installer les dépendances
pnpm install

# Lancer en développement
pnpm dev
```

L'app est accessible sur `http://localhost:5173`.

### Build de production

```bash
pnpm build       # compile TypeScript + bundle Vite + génère le Service Worker
pnpm preview     # prévisualise le build sur http://localhost:4173
```

### Déploiement

Le dossier `dist/` produit est un site statique autonome. Il peut être servi par n'importe quel hébergeur statique :

- **Vercel** : `vercel --prod`
- **Netlify** : glisser-déposer le dossier `dist/`
- **GitHub Pages** : déployer la branche `gh-pages` avec le contenu de `dist/`
- **Nginx** : pointer le `root` vers `dist/`, activer `try_files $uri /index.html`

> Le Service Worker requiert HTTPS en production (ou `localhost` en développement).

---

## Utilisation

### Premier lancement

1. Ouvrir l'app dans Chrome (Android) ou Safari (iOS)
2. Sur Android : choisir un dossier de sauvegarde pour l'export direct — optionnel, configurable plus tard dans l'onglet Export
3. Sur iOS : les données sont stockées localement, l'export se fait via ZIP

### Créer des catégories

Onglet **Catégories** → `+ Nouvelle` → choisir un nom, une couleur et une icône.  
Les catégories sont nécessaires avant de créer des itinéraires ou des points.

### Créer un itinéraire

Onglet **Itinéraires** → `+ Nouveau` → nommer l'itinéraire.

### Ajouter des points

Onglet **Carte** → taper sur la carte → remplir la description, choisir l'itinéraire et la catégorie, ajouter des photos → **Enregistrer**.

### Modifier un point

Taper sur un marqueur → **Modifier** → éditer la description ou ajouter / supprimer des photos.

### Exporter ses données

Onglet **Export** :
- **Sauvegarder dans un dossier** (Android) : écrit `itineraires.json` + `photos/` dans le dossier choisi
- **Télécharger en ZIP** : archive complète, compatible iOS et Android
- **Par itinéraire** : ZIP limité à un seul itinéraire

> Conseil : enregistrez le ZIP dans Google Drive, iCloud ou Dropbox pour accéder à votre sauvegarde sur tous vos appareils.

### Installer comme application

- **Android (Chrome)** : menu ⋮ → *Ajouter à l'écran d'accueil*
- **iOS (Safari)** : bouton Partager → *Sur l'écran d'accueil*

---

## Sécurité et vie privée

- Aucune donnée n'est transmise à un serveur
- Les coordonnées GPS sont envoyées à [Nominatim](https://nominatim.openstreetmap.org) uniquement pour résoudre l'adresse, uniquement si l'appareil est en ligne, et le résultat est sauvegardé localement pour ne plus être renvoyé
- Les marqueurs SVG sont construits via DOM API (`createElementNS` / `textContent`) — pas d'`innerHTML`
- Les fichiers photo sont validés par MIME type avant stockage
- Une Content-Security-Policy est définie dans `index.html`

---

## Genèse du projet

CartEmpreinte est né d'un besoin concret : un proche cherchait un moyen simple de garder une trace de ses balades et voyages directement depuis son téléphone, sans créer de compte, sans dépendre d'un service tiers, et avec ses photos attachées à chaque endroit visité. Aucune app existante ne cochait toutes ces cases sans friction — alors j'ai décidé de la construire.

Ce projet a également été l'occasion d'expérimenter **[Claude Code](https://claude.ai/code)**, le CLI d'Anthropic, tout au long du développement. L'intégralité du code a été écrit en collaboration avec Claude Code, ce qui m'a permis de tester concrètement :

- Le **mode plan** — pour cadrer l'implémentation avant de toucher au code sur les fonctionnalités complexes
- Les **sous-agents spécialisés** — notamment l'agent `code-reviewer` pour réaliser un audit de sécurité complet de la PWA et corriger les vulnérabilités identifiées
- Le **système de mémoire persistante** — qui conserve le contexte du projet entre les sessions pour une continuité naturelle du travail
- Les **skills** — des prompts spécialisés chargeables à la demande, utilisés ici pour le mode plan et la revue de code

---

## Auteur

**Mathis Pain**

---

## Licence

MIT
