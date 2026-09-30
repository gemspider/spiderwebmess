'use client'

// Galerie — every picture on this task, in one place.
//
// The original has a Galerie window beside the camera button, and the two are not the
// same thing: the camera adds, the gallery looks. Shooting a photo and then hunting for
// where it went is the complaint that shape of UI avoids.
//
// A slider rather than a grid, because these are a sequence from one visit and you step
// through them. Tapping opens the lightbox, which has Vollbild, arrows, keyboard and
// swipe — the same viewer the datasheets use.
//
// Two sources in one list: what the user photographed this session, and the inspection
// frames that come with the demo standing in for the task's own references. Captures
// come first — they are the ones that are actually this task's.

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Camera } from 'lucide-react'
import { SectionHead } from '@/components/feature/tabs/shared/InfoPrimitives'
import { ImageSlider, type SlideItem } from '@/components/feature/ImageSlider'
import { PhotoLightbox, type GalleryItem } from '@/components/feature/PhotoLightbox'
import { fetchWartungDetail, fetchObjektBilder } from '@/modules/kanal/wartung'
import { listPhotos, deletePhoto } from '@/lib/photoStore'
import { imagesFor, ILLUSTRATIVE } from '@/lib/demoImages'
import { useQueryClient } from '@tanstack/react-query'
import type { FormProps } from '@/lib/registry'

export function WartungGalerieTab({ feature }: FormProps) {
  const id = feature?.id
  const taskId = String(id ?? '')
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const { data: detail } = useQuery({
    queryKey: ['wartung-detail', id],
    queryFn:  () => fetchWartungDetail(id as number),
    enabled:  id != null,
  })
  const { data: captured = [] } = useQuery({
    queryKey: ['task-photos', taskId],
    queryFn:  () => listPhotos(taskId),
    enabled:  !!taskId,
  })

  // The task's own references are almost always empty — 1 of 329 — but the Schacht it
  // was raised on usually has them, and those are the pictures an operator opening the
  // task is looking for. See fetchObjektBilder.
  const objektname = feature?.objektname as string | undefined
  const { data: objektBilder = [] } = useQuery({
    queryKey: ['objekt-bilder', objektname],
    queryFn:  () => fetchObjektBilder(objektname),
    enabled:  !!objektname,
  })

  const eigene = detail?.bilder ?? []
  const references = imagesFor(
    eigene.length ? eigene : objektBilder,
    eigene.length ? 'kanal' : 'schacht',
  )
  const vomObjekt = eigene.length === 0 && objektBilder.length > 0

  const items: GalleryItem[] = [
    ...captured.map(p => ({ kind: 'photo' as const, photo: p })),
    ...references.map(r => ({ kind: 'demo' as const, image: r.image, name: r.name })),
  ]
  const slides: SlideItem[] = items as SlideItem[]

  async function remove(photoId: string) {
    await deletePhoto(photoId)
    qc.invalidateQueries({ queryKey: ['task-photos', taskId] })
    setOpen(false)
  }

  return (
    <div>
      <SectionHead>Galerie</SectionHead>

      <ImageSlider
        items={slides}
        onOpen={i => { setIndex(i); setOpen(true) }}
        emptyLabel="Noch keine Bilder — mit „Foto“ unten eine Aufnahme hinzufügen."
      />

      {items.length > 0 && (
        <p className="mt-3 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-ink-dim">
          <Camera className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden />
          {captured.length > 0 && (
            <span>
              {captured.length} {captured.length === 1 ? 'eigene Aufnahme' : 'eigene Aufnahmen'}
              {references.length > 0 && ', '}
            </span>
          )}
          {references.length > 0 && (
            <span>
              {vomObjekt && <>Aufnahmen zum Objekt <span className="font-mono">{objektname}</span>. </>}
              {ILLUSTRATIVE}
            </span>
          )}
        </p>
      )}

      <PhotoLightbox
        items={items}
        index={index}
        onIndexChange={setIndex}
        onDelete={remove}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  )
}
