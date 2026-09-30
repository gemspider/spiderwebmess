'use client'

// What you get for clicking a Wartung or Kontrolle pin.
//
// A map marker should answer "what is this?" without taking over the screen — the
// original application opens a full modal over the map, which on a phone hides the
// thing you were just looking at. This shows the four facts that decide whether you
// care, and a way into the full record for when you do.
//
// Two links out, because a task is always about an object: the task detail, and the
// Schacht it was raised on (objektname), which leads to its Datenblatt.

import { Popup } from 'react-leaflet'
import { CalendarDays, CircleDot, ArrowRight, MapPin } from 'lucide-react'
import { useMapStore } from '@/lib/store/mapStore'

export interface WartungProps {
  id?:          number | string
  wartungsart?: string
  aufgabe?:     string
  typ?:         string
  status?:      number | string
  datum?:       string
  objektname?:  string
  erfuellt_am?: string
  anmerkung?:   string
}

const STATUS = {
  0: { label: 'in Bearbeitung', dot: '#e60000' },
  1: { label: 'fertig',         dot: '#16a34a' },
} as const

function formatDate(value?: string): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

export function WartungPopup({ props: p }: { props: WartungProps }) {
  const selectFeature = useMapStore(s => s.selectFeature)

  const kind = p.typ === 'Wartung' ? 'Wartung' : 'Kontrolle'
  const title = p.wartungsart || p.aufgabe || kind
  const status = STATUS[Number(p.status) as 0 | 1]
  const datum = formatDate(p.datum) ?? formatDate(p.erfuellt_am)

  return (
    <Popup
      className="wartung-popup"
      closeButton={false}
      autoPanPadding={[24, 24]}
      minWidth={232}
      maxWidth={288}
    >
      <div className="font-sans">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-dim">
          {kind}
        </p>
        <p className="mt-0.5 text-[15px] font-semibold leading-tight text-ink">{title}</p>

        <dl className="mt-2.5 space-y-1.5">
          {status && (
            <div className="flex items-center gap-2 text-[12.5px]">
              <CircleDot className="h-3.5 w-3.5 flex-shrink-0" style={{ color: status.dot }} aria-hidden />
              <dt className="sr-only">Status</dt>
              <dd className="font-medium text-ink">{status.label}</dd>
            </div>
          )}
          {datum && (
            <div className="flex items-center gap-2 text-[12.5px]">
              <CalendarDays className="h-3.5 w-3.5 flex-shrink-0 text-ink-dim" aria-hidden />
              <dt className="sr-only">Datum</dt>
              <dd className="font-mono tabular-nums text-ink-muted">{datum}</dd>
            </div>
          )}
          {p.objektname && (
            <div className="flex items-center gap-2 text-[12.5px]">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-ink-dim" aria-hidden />
              <dt className="sr-only">Objekt</dt>
              <dd className="font-mono text-ink-muted">{p.objektname}</dd>
            </div>
          )}
        </dl>

        {p.anmerkung && (
          <p className="mt-2 line-clamp-2 text-[12px] leading-snug text-ink-dim">{p.anmerkung}</p>
        )}

        <button
          type="button"
          onClick={e => {
            // The popup lives inside the map container, and MapInner's background
            // click clears the selection — without this the panel opens and closes
            // in the same tick.
            e.stopPropagation()
            selectFeature(String(p.id), 'kanal', 'wartung')
          }}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          Details öffnen
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </Popup>
  )
}
