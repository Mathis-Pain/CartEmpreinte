import { db, type Category } from '../schema'

export const DEFAULT_CATEGORIES: Omit<Category, 'createdAt'>[] = [
  { id: 'cat-velo', name: 'Vélo', color: '#8B6914', icon: '🚴' },
  { id: 'cat-pied', name: 'À pied', color: '#16a34a', icon: '🚶' },
  { id: 'cat-camping', name: 'Camping', color: '#0369a1', icon: '⛺' },
]

export async function seedDefaultCategories(): Promise<void> {
  const count = await db.categories.count()
  if (count > 0) return
  const now = Date.now()
  await db.categories.bulkAdd(
    DEFAULT_CATEGORIES.map((c) => ({ ...c, createdAt: now }))
  )
}

export async function getAllCategories(): Promise<Category[]> {
  return db.categories.orderBy('createdAt').toArray()
}

export async function getCategoryById(id: string): Promise<Category | undefined> {
  return db.categories.get(id)
}

export async function createCategory(
  data: Omit<Category, 'id' | 'createdAt'>
): Promise<Category> {
  const category: Category = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  }
  try {
    await db.categories.add(category)
  } catch {
    throw new Error('Impossible de créer la catégorie.')
  }
  return category
}

export async function updateCategory(
  id: string,
  data: Partial<Omit<Category, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    await db.categories.update(id, data)
  } catch {
    throw new Error('Impossible de modifier la catégorie.')
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    await db.categories.delete(id)
  } catch {
    throw new Error('Impossible de supprimer la catégorie.')
  }
}
