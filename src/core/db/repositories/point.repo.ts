import { db, type MapPoint } from '../schema'
import { deletePhotosByPoint } from './photo.repo'

export async function getAllPoints(): Promise<MapPoint[]> {
  return db.points.toArray()
}

export async function getPointsByItinerary(itineraryId: string): Promise<MapPoint[]> {
  return db.points.where('itineraryId').equals(itineraryId).toArray()
}

export async function getPointById(id: string): Promise<MapPoint | undefined> {
  return db.points.get(id)
}

export async function createPoint(
  data: Omit<MapPoint, 'id' | 'createdAt'>
): Promise<MapPoint> {
  const point: MapPoint = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  }
  try {
    await db.points.add(point)
  } catch {
    throw new Error('Impossible d\'ajouter le point.')
  }
  return point
}

export async function updatePoint(
  id: string,
  data: Partial<Omit<MapPoint, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    await db.points.update(id, data)
  } catch {
    throw new Error('Impossible de modifier le point.')
  }
}

export async function deletePoint(id: string): Promise<void> {
  try {
    await deletePhotosByPoint(id)
    await db.points.delete(id)
  } catch (err) {
    if (err instanceof Error) throw err
    throw new Error('Impossible de supprimer le point.')
  }
}
