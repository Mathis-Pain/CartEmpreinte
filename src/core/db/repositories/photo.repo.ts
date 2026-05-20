import { db, type Photo } from '../schema'
import { deletePhoto as deletePhotoFromOPFS } from '../../storage/opfs'

export async function getPhotosByPoint(pointId: string): Promise<Photo[]> {
  return db.photos.where('pointId').equals(pointId).toArray()
}

export async function createPhoto(
  data: Omit<Photo, 'id'> & { id?: string }
): Promise<Photo> {
  const photo: Photo = {
    ...data,
    id: data.id ?? crypto.randomUUID(),
  }
  try {
    await db.photos.add(photo)
  } catch {
    throw new Error('Impossible d\'enregistrer les métadonnées de la photo.')
  }
  return photo
}

export async function updatePhoto(
  id: string,
  data: Partial<Omit<Photo, 'id' | 'pointId'>>
): Promise<void> {
  try {
    await db.photos.update(id, data)
  } catch {
    throw new Error('Impossible de modifier la photo.')
  }
}

export async function deletePhotoById(id: string): Promise<void> {
  try {
    await deletePhotoFromOPFS(id)
    await db.photos.delete(id)
  } catch {
    throw new Error('Impossible de supprimer la photo.')
  }
}

export async function deletePhotosByPoint(pointId: string): Promise<void> {
  const photos = await getPhotosByPoint(pointId)
  for (const photo of photos) {
    await deletePhotoById(photo.id)
  }
}
