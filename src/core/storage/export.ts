import JSZip from 'jszip'
import { getAllItineraries, getItineraryById } from '../db/repositories/itinerary.repo'
import { getAllPoints, getPointsByItinerary } from '../db/repositories/point.repo'
import { getAllCategories } from '../db/repositories/category.repo'
import { getPhotosByPoint } from '../db/repositories/photo.repo'
import { getPhotoBlob } from './opfs'

async function buildZipForItinerary(
  zip: JSZip,
  itineraryId: string
): Promise<void> {
  const itinerary = await getItineraryById(itineraryId)
  if (!itinerary) throw new Error('Itinéraire introuvable.')
  const points = await getPointsByItinerary(itineraryId)

  zip.file('itinerary.json', JSON.stringify({ itinerary, points }, null, 2))

  const photosFolder = zip.folder('photos')!
  for (const point of points) {
    for (const photoId of point.photoIds) {
      try {
        const blob = await getPhotoBlob(photoId)
        photosFolder.file(`${photoId}.jpg`, blob)
      } catch {
        // Photo manquante, on continue
      }
    }
  }
}

export async function exportItineraryAsZip(itineraryId: string): Promise<void> {
  const itinerary = await getItineraryById(itineraryId)
  if (!itinerary) throw new Error('Itinéraire introuvable.')

  const zip = new JSZip()
  await buildZipForItinerary(zip, itineraryId)

  const content = await zip.generateAsync({ type: 'blob' })
  const cleaned = itinerary.name.replace(/[^a-zA-Z0-9\-_ ]/g, '_').trim().slice(0, 80)
  const safeName = !cleaned || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(cleaned) ? 'itineraire' : cleaned
  triggerDownload(content, `${safeName}.zip`)
}

export async function exportAllAsZip(): Promise<void> {
  const zip = new JSZip()
  const itineraries = await getAllItineraries()
  const categories = await getAllCategories()
  const allPoints = await getAllPoints()

  zip.file(
    'data.json',
    JSON.stringify({ itineraries, categories, points: allPoints }, null, 2)
  )

  const photosFolder = zip.folder('photos')!
  for (const point of allPoints) {
    for (const photoId of point.photoIds) {
      try {
        const blob = await getPhotoBlob(photoId)
        photosFolder.file(`${photoId}.jpg`, blob)
      } catch {
        // Photo manquante, on continue
      }
    }
  }

  const content = await zip.generateAsync({ type: 'blob' })
  triggerDownload(content, 'CartEmpreinte-export.zip')
}

export async function exportToFolder(
  folderHandle: FileSystemDirectoryHandle
): Promise<void> {
  const itineraries = await getAllItineraries()
  const categories = await getAllCategories()
  const allPoints = await getAllPoints()

  const dataFile = await folderHandle.getFileHandle('itineraires.json', {
    create: true,
  })
  const dataWritable = await dataFile.createWritable()
  await dataWritable.write(
    JSON.stringify({ itineraries, categories, points: allPoints }, null, 2)
  )
  await dataWritable.close()

  const photosDir = await folderHandle.getDirectoryHandle('photos', {
    create: true,
  })
  for (const point of allPoints) {
    for (const photoId of point.photoIds) {
      try {
        const blob = await getPhotoBlob(photoId)
        const photoFile = await photosDir.getFileHandle(`${photoId}.jpg`, {
          create: true,
        })
        const photoWritable = await photoFile.createWritable()
        await photoWritable.write(blob)
        await photoWritable.close()
      } catch {
        // Photo manquante, on continue
      }
    }
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function getPhotosByItinerary(itineraryId: string) {
  const points = await getPointsByItinerary(itineraryId)
  const photos = []
  for (const point of points) {
    const pointPhotos = await getPhotosByPoint(point.id)
    photos.push(...pointPhotos)
  }
  return photos
}
