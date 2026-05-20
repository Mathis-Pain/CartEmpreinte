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
      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5">
        <h1 className="text-base font-semibold tracking-tight text-[var(--color-text)]">Catégories</h1>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3.5 py-1.5 text-xs font-semibold text-white active:scale-95 transition-transform"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle
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
          <div className="flex flex-col items-center gap-4 py-20 text-center px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <circle cx="7" cy="7" r="1.5" fill="var(--color-text-muted)" stroke="none"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">Aucune catégorie</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
                Créez-en une pour organiser et colorier vos itinéraires.
              </p>
            </div>
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
              <div className="flex items-center gap-3 px-4 py-3.5 active:bg-[var(--color-surface-2)] transition-colors">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.icon}
                </div>
                <span className="flex-1 text-sm font-semibold text-[var(--color-text)]">
                  {cat.name}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(cat)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] active:bg-[var(--color-surface-2)] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 active:bg-red-50 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14H6L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
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
    <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 animate-fade-in">
      <input
        autoFocus
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSave()}
        placeholder="Nom de la catégorie"
        className="mb-3.5 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm"
      />

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Couleur</p>
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            className="relative h-8 w-8 rounded-full transition-transform active:scale-95"
            style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2.5px white, 0 0 0 4px ${c}` : 'none' }}
          />
        ))}
        <input
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0 opacity-0 absolute"
          title="Couleur personnalisée"
          id="custom-color"
        />
        <label
          htmlFor="custom-color"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] text-xs"
          title="Couleur personnalisée"
        >
          +
        </label>
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Icône</p>
      <div className="mb-4 flex gap-2 flex-wrap">
        {PRESET_ICONS.map((i) => (
          <button
            key={i}
            onClick={() => onIconChange(i)}
            className={[
              'h-10 w-10 rounded-xl text-lg transition-all active:scale-95',
              icon === i
                ? 'text-white'
                : 'bg-white border border-[var(--color-border)]',
            ].join(' ')}
            style={icon === i ? { backgroundColor: color } : {}}
          >
            {i}
          </button>
        ))}
      </div>

      {error && <p className="mb-2.5 text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="flex-1 rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white active:scale-[0.98] transition-transform"
          style={{ boxShadow: '0 2px 10px rgba(22,163,74,0.3)' }}
        >
          Sauvegarder
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-muted)] active:bg-[var(--color-border)] transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
