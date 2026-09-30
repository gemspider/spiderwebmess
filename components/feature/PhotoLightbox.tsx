'use client'

// Full-size viewer for the images attached to a task.
//
// The original opens a Galerie window with prev/next arrows and a VOLLBILD button, and
// that is the right shape: a thumbnail grid tells you an image exists, but a manhole
// cover half-buried in snow is only readable large.
//
// Arrows, keyboard and swipe all navigate, because this is used on a phone in gloves as
// often as on a desktop.

import { useCallback, useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, ChevronLeft, ChevronRight, Maximize2, Trash2, ImageOff } from 'lucide-react'
import type { TaskPhoto } from '@/lib/photoStore'
import type { WartungBild } from '@/modules/kanal/wartung'
import { ILLUSTRATIVE, type DemoImage } from '@/lib/demoImages'

/**
 * A capture the user took, an inspection frame shipped with the demo, or a reference
 * with nothing behind it.
 *
 * 'demo' exists because the database stores filenames and not files: every reference
 * would otherwise be an empty tile. It is always labelled as illustrative.
 */
export type GalleryItem =
  | { kind: 'photo'; photo: TaskPhoto }
  | { kind: 'demo'; image: DemoImage; name: string }
  | { kind: 'reference'; ref: WartungBild }

interface Props {
  items: GalleryItem[]
  index: number
  onIndexChange: (i: number) => void
  onDelete?: (id: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PhotoLightbox({ items, index, onIndexChange, onDelete, open, onOpenChange }: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const touchX = useRef<number | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const count = items.length
  const item = items[index]

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return
      onIndexChange((index + delta + count) % count)
    },
    [count, index, onIndexChange],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, go])

  // The browser can leave fullscreen without us (Esc, gesture), so track the event
  // rather than assuming our own button is the only way out.
  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await frameRef.current?.requestFullscreen()
    } catch {
      // iOS Safari refuses requestFullscreen on non-video elements. The viewer is
      // already near-fullscreen on a phone, so there is nothing to recover from.
    }
  }

  if (!item) return null

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[2100] bg-ink/85 data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed inset-0 z-[2101] flex flex-col data-[state=open]:animate-fade-in">
          <div className="flex items-center gap-3 px-4 py-3">
            <Dialog.Title className="flex-1 truncate text-[15px] font-semibold text-white">
              Galerie
              {count > 1 && (
                <span className="ml-2 font-mono text-[12px] font-normal tabular-nums text-white/60">
                  {index + 1} / {count}
                </span>
              )}
            </Dialog.Title>

            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Vollbild beenden' : 'Vollbild'}
              className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Maximize2 className="h-4 w-4" aria-hidden />
              <span className="sr-only">Vollbild</span>
            </button>

            {item.kind === 'photo' && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(item.photo.id)}
                title="Bild entfernen"
                className="rounded-lg p-2 text-white/80 transition-colors hover:bg-red-500/20 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                <span className="sr-only">Entfernen</span>
              </button>
            )}

            <Dialog.Close className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" aria-hidden />
              <span className="sr-only">Schließen</span>
            </Dialog.Close>
          </div>

          <div
            ref={frameRef}
            className="relative flex min-h-0 flex-1 items-center justify-center bg-ink px-2 pb-4"
            onTouchStart={e => { touchX.current = e.touches[0].clientX }}
            onTouchEnd={e => {
              if (touchX.current === null) return
              const dx = e.changedTouches[0].clientX - touchX.current
              if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1)
              touchX.current = null
            }}
          >
            {item.kind === 'photo' ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={item.photo.dataUrl}
                alt={`Aufnahme vom ${new Date(item.photo.takenAt).toLocaleString('de-AT')}`}
                className="max-h-full max-w-full object-contain"
              />
            ) : item.kind === 'demo' ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={item.image.src}
                alt={item.image.caption}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="max-w-sm rounded-xl border border-dashed border-white/25 px-6 py-10 text-center">
                <ImageOff className="mx-auto h-6 w-6 text-white/40" aria-hidden />
                <p className="mt-3 break-all font-mono text-[12px] text-white/70">{item.ref.name}</p>
                <p className="mt-2 text-[12.5px] text-white/50">
                  Nur die Dateireferenz ist im Datenbestand — die Bilddatei selbst liegt nicht vor.
                </p>
              </div>
            )}

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Vorheriges Bild"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-ink/60 p-3 text-white/90 transition-colors hover:bg-ink/90"
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Nächstes Bild"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-ink/60 p-3 text-white/90 transition-colors hover:bg-ink/90"
                >
                  <ChevronRight className="h-6 w-6" aria-hidden />
                </button>
              </>
            )}
          </div>

          <p className="px-4 pb-4 text-center text-[12px] text-white/55">
            {item.kind === 'photo'
              ? `${new Date(item.photo.takenAt).toLocaleString('de-AT')} · ${item.photo.source}`
              : item.kind === 'demo'
                ? <>{item.image.caption} · <span className="font-mono">{item.name}</span> — {ILLUSTRATIVE}</>
                : 'im Datenbestand'}
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
