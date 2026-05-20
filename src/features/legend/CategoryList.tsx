import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../core/db/schema'
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../core/db/repositories/category.repo'

const PRESET_COLORS = [
  '#16a34a', '#0369a1', '#8B6914', '#dc2626',
  '#7c3aed', '#db2777', '#ea580c', '#64748b',
]

const PRESET_ICONS = ['🚴', '🚶', '⛺', '🏔️', '🚗', '🏍️', '🚐', '🚤', '✈️', '🏕️', '📍', '🌟']

export default function CategoryList() {
  const categories = useLiveQuery(() => db.categories.orderBy('createdAt').toArray(), [])

  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [icon, setIcon] = useState(PRESET_ICONS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ name: '', color: '', icon: '' })
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    const n = name.trim()
    if (!n) { setError('Nom requis.'); return }
    setError(null)
    try {
      await createCategory({ name: n, color, icon })
      setName('')
      setColor(PRESET_COLORS[0])
      setIcon(PRESET_ICONS[0])
      setCreating(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.')
    }
  }

  async function handleUpdate() {
    if (!editingId) return
    const n = editData.name.trim()
    if (!n) { setError('Nom requis.'); return }
    setError(null)
    try {
      await updateCategory(editingId, { name: n, color: editData.color, icon: editData.icon })
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette catégorie ?')) return
    try {
      await deleteCategory(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.')
    }
  }

  function startEdit(cat: { id: string; name: string; color: string; icon: string }) {
    setEditingId(cat.id)
    setEditData({ name: cat.name, color: cat.color, icon: cat.icon })
    setError(null)
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-[var(--color-bg)]">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <h1 className="font-semibold text-[var(--color-text)]">Catégories</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white"
        >
          + Nouvelle
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {creating && (
          <CategoryForm
            name={name}
            color={color}
            icon={icon}
            onNameChange={setName}
            onColorChange={setColor}
            onIconChange={setIcon}
            onSave={handleCreate}
            onCancel={() => { setCreating(false); setError(null) }}
            error={error}
          />
        )}

        {categories?.length === 0 && !creating && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-5xl">🏷️</span>
            <p className="text-sm text-[var(--color-text-muted)]">
              Aucune catégorie.
              <br />Créez-en une pour organiser vos itinéraires.
            </p>
          </div>
        )}

        {categories?.map((cat) => (
          <div key={cat.id} className="border-b border-[var(--color-border)]">
            {editingId === cat.id ? (
              <div className="p-4">
                <CategoryForm
                  name={editData.name}
                  color={editData.color}
                  icon={editData.icon}
                  onNameChange={(v) => setEditData((d) => ({ ...d, name: v }))}
                  onColorChange={(v) => setEditData((d) => ({ ...d, color: v }))}
                  onIconChange={(v) => setEditData((d) => ({ ...d, icon: v }))}
                  onSave={handleUpdate}
                  onCancel={() => setEditingId(null)}
                  error={error}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.icon}
                </div>
                <span className="flex-1 text-sm font-medium text-[var(--color-text)]">
                  {cat.name}
                </span>
                <button onClick={() => startEdit(cat)} className="text-sm text-[var(--color-text-muted)]">✏️</button>
                <button onClick={() => handleDelete(cat.id)} className="text-sm text-red-400">🗑️</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface FormProps {
  name: string
  color: string
  icon: string
  onNameChange: (v: string) => void
  onColorChange: (v: string) => void
  onIconChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  error: string | null
}

function CategoryForm({
  name, color, icon,
  onNameChange, onColorChange, onIconChange,
  onSave, onCancel, error,
}: FormProps) {
  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
      <input
        autoFocus
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSave()}
        placeholder="Nom de la catégorie"
        className="mb-3 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
      />

      <p className="mb-1.5 text-xs font-medium text-[var(--color-text-muted)]">Couleur</p>
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            className={[
              'h-7 w-7 rounded-full border-2 transition-transform',
              color === c ? 'border-stone-900 scale-110' : 'border-transparent',
            ].join(' ')}
            style={{ backgroundColor: c }}
          />
        ))}
        <input
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
          title="Couleur personnalisée"
        />
      </div>

      <p className="mb-1.5 text-xs font-medium text-[var(--color-text-muted)]">Icône</p>
      <div className="mb-3 flex gap-2 flex-wrap">
        {PRESET_ICONS.map((i) => (
          <button
            key={i}
            onClick={() => onIconChange(i)}
            className={[
              'h-9 w-9 rounded-lg text-lg transition-all',
              icon === i ? 'bg-[var(--color-accent)] ring-2 ring-[var(--color-accent)]' : 'bg-white border border-[var(--color-border)]',
            ].join(' ')}
          >
            {i}
          </button>
        ))}
      </div>

      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onSave} className="flex-1 rounded-xl bg-[var(--color-accent)] py-2 text-sm font-semibold text-white">
          Sauvegarder
        </button>
        <button onClick={onCancel} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)]">
          Annuler
        </button>
      </div>
    </div>
  )
}
