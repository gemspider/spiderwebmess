'use client'

// What you get for clicking a Schacht or a Haltung.
//
// The panel used to open on the first click, taking the whole screen for an object you
// might have hit by accident — on a phone it hides the map you were reading. Same shape
// as the Wartung pin now: a bubble with the handful of facts that decide whether this is
// the right object, and a way in for when it is.
//
// One instance, positioned from the store, rather than a <Popup> child per feature.
// Wartungen can afford a component per marker at 329; Schächte and Haltungen are 8 810
// between them, and that is the element count the viewport culling exists to avoid.

import { Popup } from 'react-leaflet'
import { ArrowRight, Ruler, Waypoints, Layers } from 'lucide-react'
import { useMapStore } from '@/lib/store/mapStore'
import { useLevelColors } from '@/lib/store/styleStore'
import { levelInk, LEVEL_LABEL, toLevel, objectLabel } from '@/modules/kanal/datenblatt'

/** The condition field differs per type; so does the label above it. */
const KIND = {
  schacht: { label: 'Schacht', field: 'sbz',                  scale: 'SBZ' },
  haltung: { label: 'Haltung', field: 'gesamtschadensklasse', scale: 'GSK' },
} as const

function text(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null
  return String(v)
}

export function NetworkPopup() {
  const popup = useMapStore(s => s.popup)
  const selectFeature = useMapStore(s => s.selectFeature)
  const levels = useLevelColors()

  if (!popup) return null

  const kind = KIND[popup.type as keyof typeof KIND]
  if (!kind) return null

  const p = popup.props
  const level = toLevel(p[kind.field])
  const title = objectLabel(p, popup.id)

  // Three facts, chosen because they are the ones that tell two neighbouring objects
  // apart on a map: what it is, how big, and which run it belongs to.
  const facts = popup.type === 'haltung'
    ? [
        { icon: Ruler,     value: p.laenge != null ? `${Number(p.laenge).toFixed(2)} m` : null },
        { icon: Layers,    value: p.breite != null ? `DN ${p.breite}` : null },
        { icon: Waypoints, value: text(p.material) },
      ]
    : [
        { icon: Layers,    value: text(p.schachtart) },
        { icon: Ruler,     value: p.abstich != null ? `Tiefe ${Number(p.abstich).toFixed(2)} m` : null },
        { icon: Waypoints, value: text(p.material) ?? text(p.querschnitt) },
      ]

  return (
    <Popup
      position={popup.latlng}
      className="wartung-popup"
      closeButton={false}
      autoPanPadding={[24, 24]}
      minWidth={232}
      maxWidth={288}
      // No `remove` handler. Moving to another feature makes Leaflet remove the old
      // popup as it adds the new one, and clearing the store from that event wiped the
      // target that had just been set — after two clicks nothing opened again.
      // Dismissal is already covered: a click on the map background runs MapInner's
      // handler, which clears the selection and the popup together.
    >
      <div className="font-sans">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-dim">
              {kind.label}
            </p>
            <p className="mt-0.5 truncate font-mono text-[15px] font-semibold leading-tight text-ink">
              {title}
            </p>
          </div>
          {/* The class carries its number as well as its colour — two of the five are
              hard to tell apart on a phone in daylight, and roughly 8% of men cannot
              separate the ends of the scale at all. */}
          {level && (
            <span
              className="flex h-7 min-w-7 flex-shrink-0 items-center justify-center rounded-lg px-1.5 font-mono text-[13px] font-semibold tabular-nums"
              style={{ background: levels[level], color: levelInk(level, levels[level]) }}
              title={`${kind.scale} ${level} — ${LEVEL_LABEL[level]}`}
            >
              {level}
            </span>
          )}
        </div>

        <dl className="mt-2.5 space-y-1.5">
          {facts.filter(f => f.value).map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-[12.5px]">
              <f.icon className="h-3.5 w-3.5 flex-shrink-0 text-ink-dim" aria-hidden />
              <dd className="truncate text-ink-muted">{f.value}</dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          onClick={e => {
            // The popup sits inside the map container, and MapInner's background click
            // clears the selection — without this the panel opens and closes in one tick.
            e.stopPropagation()
            selectFeature(popup.id, 'kanal', popup.type)
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
