/**
 * Photos captured against a maintenance task.
 *
 * IndexedDB rather than the localStorage overlay the rest of the demo writes to: a
 * single phone photo is 2–4 MB, and localStorage's ~5 MB budget is both shared with
 * every other draft and synchronous, so writing one would jank the main thread.
 *
 * Images are downscaled before they are stored. A 4032×3024 capture is 3 MB of detail
 * nobody looks at in a 4:3 thumbnail; 1280px on the long edge at JPEG 0.72 lands around
 * 150 kB and still reads clearly when opened.
 *
 * Everything here stays on the device. There is no backend to upload to, and the demo
 * should not imply otherwise.
 */

const DB_NAME = 'spiderweb-photos'
const STORE = 'photos'
const VERSION = 1

export interface TaskPhoto {
  id:       string
  taskId:   string
  dataUrl:  string
  takenAt:  number
  /** 'kamera' or 'galerie' — shown so it is clear where an image came from. */
  source:   'kamera' | 'galerie'
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('taskId', 'taskId', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function listPhotos(taskId: string): Promise<TaskPhoto[]> {
  try {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).index('taskId').getAll(taskId)
      req.onsuccess = () => resolve((req.result as TaskPhoto[]).sort((a, b) => b.takenAt - a.takenAt))
      req.onerror = () => reject(req.error)
    })
  } catch {
    // Private windows and blocked site data both throw here; an empty gallery is the
    // right degradation, not a crash.
    return []
  }
}

export async function addPhoto(photo: TaskPhoto): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(photo)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Longest edge, in pixels, that a stored photo is scaled down to. */
const MAX_EDGE = 1280
const QUALITY = 0.72

/** Downscales to a JPEG data URL. Accepts a File or an already-drawn canvas. */
export function downscale(source: HTMLCanvasElement | HTMLImageElement): string {
  const w = source instanceof HTMLCanvasElement ? source.width : source.naturalWidth
  const h = source instanceof HTMLCanvasElement ? source.height : source.naturalHeight
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h))

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  canvas.getContext('2d')?.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', QUALITY)
}

/** Reads a picked file and returns a downscaled data URL. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(downscale(img))
      img.onerror = () => reject(new Error('Bild konnte nicht gelesen werden'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function newPhotoId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
