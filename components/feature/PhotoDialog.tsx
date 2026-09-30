'use client'

// Photos for a maintenance task: capture one, pick one, or look at what is already there.
//
// The original application splits this across two buttons — a live-camera modal and a
// separate gallery. One entry point is better on a phone, because "add a photo" is a
// single intent and the user decides *how* on the next tap rather than having to know
// which of two similar icons they wanted.
//
// Live preview via getUserMedia rather than <input capture>, so the flow matches the
// original and works on desktop too. `capture` is the fallback when a camera cannot be
// opened — locked down by permissions policy, no device, or a browser that refuses.

import { useCallback, useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Camera, FolderOpen, X, Trash2, AlertTriangle, ImageOff, Check, Maximize2 } from 'lucide-react'
import {
  listPhotos, addPhoto, deletePhoto, downscale, fileToDataUrl, newPhotoId,
  type TaskPhoto,
} from '@/lib/photoStore'
import type { WartungBild } from '@/modules/kanal/wartung'
import { PhotoLightbox, type GalleryItem } from './PhotoLightbox'
import { ImageSlider } from './ImageSlider'

type Mode = 'gallery' | 'camera'

interface Props {
  taskId: string
  /** Snapshot references — filenames without image data. */
  existing?: WartungBild[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PhotoDialog({ taskId, existing = [], open, onOpenChange }: Props) {
  const [mode, setMode] = useState<Mode>('gallery')
  const [photos, setPhotos] = useState<TaskPhoto[]>([])
  const [error, setError] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const [viewerAt, setViewerAt] = useState<number | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async () => setPhotos(await listPhotos(taskId)), [taskId])

  useEffect(() => { if (open) refresh() }, [open, refresh])

  // Release the camera whenever we leave camera mode or close — a live stream left
  // running keeps the recording indicator on and drains the battery.
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    if (!open || mode !== 'camera') { stopCamera(); return }

    let cancelled = false
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch {
        if (!cancelled) {
          setError('Kamera nicht verfügbar — bitte ein Bild auswählen.')
          setMode('gallery')
          // The OS picker can still reach the camera even when getUserMedia cannot.
          fileRef.current?.setAttribute('capture', 'environment')
        }
      }
    })()

    return () => { cancelled = true; stopCamera() }
  }, [open, mode, stopCamera])

  useEffect(() => () => stopCamera(), [stopCamera])

  async function store(dataUrl: string, source: TaskPhoto['source']) {
    try {
      await addPhoto({ id: newPhotoId(), taskId, dataUrl, takenAt: Date.now(), source })
      await refresh()
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 1800)
      setError(null)
      setMode('gallery')
    } catch {
      setError('Bild konnte nicht gespeichert werden — Speicher voll?')
    }
  }

  function shoot() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    store(downscale(canvas), 'kamera')
  }

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      store(await fileToDataUrl(file), 'galerie')
    } catch {
      setError('Datei konnte nicht gelesen werden.')
    }
  }

  const galleryItems: GalleryItem[] = [
    ...photos.map<GalleryItem>(photo => ({ kind: 'photo', photo })),
    ...existing.map<GalleryItem>(ref => ({ kind: 'reference', ref })),
  ]

  return (
    <Dialog.Root open={open} onOpenChange={o => { if (!o) stopCamera(); onOpenChange(o) }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[2000] bg-ink/50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-[2001] flex max-h-[88vh] flex-col rounded-t-2xl bg-surface shadow-sheet data-[state=open]:animate-slide-up
                     sm:inset-0 sm:m-auto sm:h-fit sm:max-w-lg sm:rounded-2xl sm:data-[state=open]:animate-fade-in"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Dialog.Title className="flex-1 text-[15px] font-semibold text-ink">Bilder</Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-ink-dim transition-colors hover:bg-surface-muted">
              <X className="h-4 w-4" aria-hidden />
              <span className="sr-only">Schließen</span>
            </Dialog.Close>
          </div>

          {/* Mode picker — the user decides camera or gallery, which is the whole point */}
          <div className="flex gap-2 px-4 pt-3">
            <button
              type="button"
              onClick={() => setMode('camera')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                mode === 'camera'
                  ? 'border-brand bg-brand text-white'
                  : 'border-border bg-white text-ink-muted hover:bg-surface-muted'
              }`}
            >
              <Camera className="h-4 w-4" aria-hidden />
              Kamera
            </button>
            <button
              type="button"
              onClick={() => { setMode('gallery'); fileRef.current?.click() }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-[13px] font-semibold text-ink-muted transition-colors hover:bg-surface-muted"
            >
              <FolderOpen className="h-4 w-4" aria-hidden />
              Auswählen
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={pick}
              className="hidden"
              aria-hidden
            />
          </div>

          {error && (
            <p className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-900">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden />
              {error}
            </p>
          )}
          {justSaved && (
            <p className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-800">
              <Check className="h-4 w-4 flex-shrink-0" aria-hidden />
              Bild gespeichert
            </p>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
            {mode === 'camera' ? (
              <div>
                <div className="overflow-hidden rounded-xl border border-border bg-ink">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="block aspect-[4/3] w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={shoot}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                  <Camera className="h-4 w-4" aria-hidden />
                  Bild aufnehmen
                </button>
              </div>
            ) : (
              <ImageSlider
                items={galleryItems}
                onOpen={setViewerAt}
                emptyLabel="Noch keine Bilder zu dieser Aufgabe."
              />
            )}
          </div>

          <p className="border-t border-border px-4 py-2 text-[11px] text-ink-dim">
            Aufnahmen bleiben auf diesem Gerät.
          </p>

          <PhotoLightbox
            items={galleryItems}
            index={viewerAt ?? 0}
            onIndexChange={setViewerAt}
            onDelete={async id => { await deletePhoto(id); setViewerAt(null); refresh() }}
            open={viewerAt !== null}
            onOpenChange={o => { if (!o) setViewerAt(null) }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
