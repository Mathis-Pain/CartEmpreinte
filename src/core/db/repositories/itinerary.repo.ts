import { db, type Itinerary } from '../schema'
import { deletePoint, getPointsByItinerary } from './point.repo'

export async function getAllItineraries(): Promise<Itinerary[]> {
  return db.itineraries.orderBy('updatedAt').reverse().toArray()
}

export async function getItineraryById(id: string): Promise<Itinerary | undefined> {
  return db.itineraries.get(id)
}

export async function createItinerary(
  data: Omit<Itinerary, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Itinerary> {
  const now = Date.now()
  const itinerary: Itinerary = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  try {
    await db.itineraries.add(itinerary)
  } catch {
    throw new Error('Impossible de créer l\'itinéraire.')
  }
  return itinerary
}

export async function updateItinerary(
  id: string,
  data: Partial<Omit<Itinerary, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    await db.itineraries.update(id, { ...data, updatedAt: Date.now() })
  } catch {
    throw new Error('Impossible de modifier l\'itinéraire.')
  }
}

export async function deleteItinerary(id: string): Promise<void> {
  try {
    const points = await getPointsByItinerary(id)
    for (const point of points) {
      await deletePoint(point.id)
    }
    await db.itineraries.delete(id)
  } catch (err) {
    if (err instanceof Error) throw err
    throw new Error('Impossible de supprimer l\'itinéraire.')
  }
}
