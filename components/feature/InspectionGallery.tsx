'use client'

// The pictures attached to an object or a task.
//
// A grid rather than a slider here, because the question a datasheet answers is "what
// was photographed on this survey" — you want all of them at once. Tapping one opens
// the lightbox, which is the slider: arrows, keyboard, swipe and Vollbild, the same
// viewer the task gallery uses so there is one full-size experience and not two.
//
// Every frame is an inspection photograph shipped with the demo, mapped from the
// reference by filename. The database has the filenames; the files live on the
// contractor's media. That is stated once under the grid rather than on every tile.

import { useState } from 'react'
import { Images } from 'lucide-react'
import { PhotoLightbox, type GalleryItem } from './PhotoLightbox'
import { imagesFor, ILLUSTRATIVE } from '@/lib/demoImages'

interface Props {
  references: { id: number; name: string }[]
  /** Biases which sort of frame is shown — a pipe interior on a Schacht sheet reads wrong. */
  prefer?: 'kanal' | 'schacht'
  /** Columns at the widest breakpoint. Two inside a half-width datasheet column. */
  columns?: 2 | 3 | 4
}

export function InspectionGallery({ references, prefer, columns = 4 }: Props) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const shots = imagesFor(references, prefer)
  if (!shots.length) return null

  const items: GalleryItem[] = shots.map(s => ({
    kind: 'demo', image: s.image, name: s.name,
  }))

  const cols = columns === 2
    ? 'grid-cols-2'
    : columns === 3
      ? 'grid-cols-2 sm:grid-cols-3'
      : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'

  return (
    <>
      <div className={`grid gap-2 ${cols}`}>
        {shots.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => { setIndex(i); setOpen(true) }}
            title={`${s.name} — groß anzeigen`}
            className="group relative overflow-hidden rounded-lg border border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.image.src}
              alt={s.image.caption}
              loading="lazy"
              className="aspect-[4/3] w-full bg-surface-sunken object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            />
            <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-ink/80 to-transparent px-2 pb-1 pt-4 text-left font-mono text-[10px] text-white/90">
              {s.name}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-ink-dim">
        <Images className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden />
        {ILLUSTRATIVE}
      </p>

      <PhotoLightbox
        items={items}
        index={index}
        onIndexChange={setIndex}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
