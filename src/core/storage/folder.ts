import { get as idbGet, set as idbSet } from 'idb-keyval'

const FOLDER_HANDLE_KEY = 'userFolderHandle'

export const hasFileSystemAccess = 'showDirectoryPicker' in window

export async function pickFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (!hasFileSystemAccess) return null
  try {
    const handle = await (window as Window & typeof globalThis & {
      showDirectoryPicker: (opts?: { mode?: string; startIn?: string }) => Promise<FileSystemDirectoryHandle>
    }).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',
    })
    await idbSet(FOLDER_HANDLE_KEY, handle)
    return handle
  } catch {
    return null
  }
}

export async function restoreFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (!hasFileSystemAccess) return null
  try {
    const handle = await idbGet<FileSystemDirectoryHandle>(FOLDER_HANDLE_KEY)
    if (!(handle instanceof FileSystemDirectoryHandle)) return null
    type FSHandleWithPerms = FileSystemDirectoryHandle & {
      queryPermission: (d: { mode: string }) => Promise<string>
      requestPermission: (d: { mode: string }) => Promise<string>
    }
    const h = handle as FSHandleWithPerms
    const perm = await h.queryPermission({ mode: 'readwrite' })
    if (perm === 'granted') return handle
    const req = await h.requestPermission({ mode: 'readwrite' })
    return req === 'granted' ? handle : null
  } catch {
    return null
  }
}

export async function clearFolder(): Promise<void> {
  await idbSet(FOLDER_HANDLE_KEY, undefined)
}

export async function hasSavedFolder(): Promise<boolean> {
  const handle = await idbGet<FileSystemDirectoryHandle | undefined>(FOLDER_HANDLE_KEY)
  return !!handle
}
