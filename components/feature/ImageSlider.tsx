'use client'

// Horizontal image slider.
//
// A grid makes you scan; a slider makes you step. For inspection photos the second is
// right — they are a sequence taken on one visit, and you look at them one at a time.
// It is also the shape the original's Galerie window uses.
//
// Built on CSS scroll-snap rather than a carousel library: native momentum and swipe on
// a phone, no dependency, and it keeps working with JavaScript busy. Arrows and dots
// drive the same scroll position the finger does, so the two can never disagree.

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ImageOff, Maximize2 } from 'lucide-react'
import type { TaskPhoto } from '@/lib/photoStore'
import type { WartungBild } from '@/modules/kanal/wartung'
import type { DemoImage } from '@/lib/demoImages'

export type SlideItem =
  | { kind: 'photo'; photo: TaskPhoto }
  | { kind: 'demo'; image: DemoImage; name: string }
  | { kind: 'reference'; ref: WartungBild }

interface Props {
  items: SlideItem[]
  onOpen?: (index: number) => void
  /** Falls back to a plain message when there is nothing to show. */
  emptyLabel?: string
}

export function ImageSlider({ items, onOpen, emptyLabel = 'Keine Bilder vorhanden.' }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const scrollTo = useCallback((i: number) => {
    const track = trackRef.current
    if (!track) return
    const clamped = Math.max(0, Math.min(items.length - 1, i))
    track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' })
  }, [items.length])

  // Derive the active slide from scroll position rather than tracking it separately,
  // so a swipe, an arrow and a dot all end up reporting the same thing.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        setActive(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)))
      })
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => { cancelAnimationFrame(frame); track.removeEventListener('scroll', onScroll) }
  }, [])

  if (!items.length) {
    return (
      <div className="rounded-xl border border-border bg-surface-muted px-4 py-8 text-center">
        <ImageOff className="mx-auto h-5 w-5 text-ink-faint" aria-hidden />
        <p className="mt-2 text-[13px] text-ink-dim">{emptyLabel}</p>
      </div>
    )
  }

  const many = items.length > 1

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="scroll-thin flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-xl"
        role="group"
        aria-roledescription="Bildergalerie"
        aria-label={`${items.length} Bilder`}
      >
        {items.map((item, i) => (
          <div key={i} className="w-full flex-none snap-center px-0.5">
            {item.kind === 'photo' || item.kind === 'demo' ? (
              <button
                type="button"
                onClick={() => onOpen?.(i)}
                className="group relative block w-full overflow-hidden rounded-lg border border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                title="Groß anzeigen"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.kind === 'photo' ? item.photo.dataUrl : item.image.src}
                  alt={item.kind === 'photo'
                    ? `Aufnahme vom ${new Date(item.photo.takenAt).toLocaleString('de-AT')}`
                    : item.image.caption}
                  className="aspect-[4/3] w-full bg-surface-sunken object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-all group-hover:bg-ink/20 group-hover:opacity-100">
                  <Maximize2 className="h-5 w-5 text-white" aria-hidden />
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpen?.(i)}
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-muted px-4 text-center transition-colors hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <ImageOff className="h-5 w-5 text-ink-faint" aria-hidden />
                <span className="break-all font-mono text-[10px] leading-tight text-ink-faint">
                  {item.ref.name}
                </span>
                <span className="text-[11px] text-ink-dim">nur Dateireferenz</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {many && (
        <>
          <button
            type="button"
            onClick={() => scrollTo(active - 1)}
            disabled={active === 0}
            aria-label="Vorheriges Bild"
            className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-surface/90 p-1.5 text-ink-muted shadow-card transition-opacity hover:bg-surface disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollTo(active + 1)}
            disabled={active === items.length - 1}
            aria-label="Nächstes Bild"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-surface/90 p-1.5 text-ink-muted shadow-card transition-opacity hover:bg-surface disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>

          <div className="mt-2 flex items-center justify-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Bild ${i + 1}`}
                aria-current={i === active}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? 'w-4 bg-brand' : 'w-1.5 bg-border-strong hover:bg-ink-faint'
                }`}
              />
            ))}
          </div>
        </>
      )}

      <p className="mt-1.5 text-center text-[11.5px] text-ink-dim">
        {items[active]?.kind === 'photo'
          ? `${new Date((items[active] as { photo: TaskPhoto }).photo.takenAt).toLocaleString('de-AT')} · ${(items[active] as { photo: TaskPhoto }).photo.source}`
          : items[active]?.kind === 'demo'
            ? (items[active] as { image: DemoImage }).image.caption
            : 'im Datenbestand'}
        {many && <span className="ml-2 font-mono tabular-nums">{active + 1}/{items.length}</span>}
      </p>
    </div>
  )
}
