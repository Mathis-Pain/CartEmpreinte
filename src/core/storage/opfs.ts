async function getPhotosDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory()
  return root.getDirectoryHandle('photos', { create: true })
}

export async function savePhoto(photoId: string, file: File | Blob): Promise<void> {
  try {
    const dir = await getPhotosDir()
    const fileHandle = await dir.getFileHandle(`${photoId}.jpg`, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(file)
    await writable.close()
  } catch {
    throw new Error('Impossible de sauvegarder la photo sur l\'appareil.')
  }
}

export async function getPhotoBlob(photoId: string): Promise<Blob> {
  try {
    const dir = await getPhotosDir()
    const fileHandle = await dir.getFileHandle(`${photoId}.jpg`)
    return fileHandle.getFile()
  } catch {
    throw new Error('Photo introuvable.')
  }
}

export async function getPhotoUrl(photoId: string): Promise<string> {
  const blob = await getPhotoBlob(photoId)
  return URL.createObjectURL(blob)
}

export async function deletePhoto(photoId: string): Promise<void> {
  try {
    const dir = await getPhotosDir()
    await dir.removeEntry(`${photoId}.jpg`)
  } catch (err) {
    if ((err as DOMException)?.name !== 'NotFoundError') throw err
  }
}
