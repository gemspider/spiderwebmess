'use client'

// The pieces both datasheets are built from.
//
// The Schacht sheet and the Haltung sheet are the same document in two shapes, and they
// get printed onto the same file. Sharing the section, the row and the shell is what
// keeps them reading as one form rather than two designs — a label that sits at 12.5px
// on one sheet and 13px on the other is noticed immediately in a stack of paper.

import Link from 'next/link'
import { ArrowLeft, Printer, MapPin } from 'lucide-react'

export function Section({ title, count, children }: {
  title: string; count?: number; children: React.ReactNode
}) {
  return (
    // min-w-0 because a grid item defaults to min-width:auto, so a section holding the
    // longitudinal drawing — which has a 420px floor so its stations stay legible —
    // stretches its whole column past a 390px screen instead of letting the drawing
    // scroll inside its own overflow-x container.
    <section className="min-w-0 break-inside-avoid overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <h2 className="flex items-baseline gap-2 border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-dim">
        {title}
        {count !== undefined && (
          <span className="font-mono text-[11px] font-medium tabular-nums text-ink-faint">{count}</span>
        )}
      </h2>
      {children}
    </section>
  )
}

/** One label/value row. `mono` for anything measured, so columns of figures align. */
export function Row({ label, value, mono = false }: {
  label: string; value?: React.ReactNode; mono?: boolean
}) {
  const empty = value === null || value === undefined || value === ''
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-border px-4 py-2.5 first:border-t-0">
      <dt className="shrink-0 text-[12.5px] text-ink-dim">{label}</dt>
      <dd className={`min-w-0 text-right text-[13px] font-medium ${mono ? 'font-mono tabular-nums' : ''} ${empty ? 'text-ink-faint' : 'text-ink'}`}>
        {empty ? '—' : value}
      </dd>
    </div>
  )
}

export const num = (v: unknown, unit = '', digits = 2) =>
  typeof v === 'number' && Number.isFinite(v) ? `${v.toFixed(digits)}${unit}` : undefined

/**
 * Chrome around a sheet: back to the map, the object's name, show-on-map, print.
 *
 * `mapHref` differs per type because the map takes a different query parameter for a
 * Schacht than for a Haltung, and 'Auf Karte zeigen' that lands on the wrong object is
 * worse than no link.
 */
export function Shell({ id, title, mapHref, children }: {
  id: string; title?: string; mapHref: string; children: React.ReactNode
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface-soft">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2 print:hidden">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-brand hover:bg-brand-light"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Karte
        </Link>
        <span className="truncate font-mono text-[12.5px] text-ink-dim">{title ?? id}</span>
        <div className="ml-auto flex items-center gap-1">
          <Link
            href={mapHref}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12.5px] font-medium text-ink-muted hover:bg-surface-muted"
            title="Dieses Objekt auf der Karte zeigen"
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">Auf Karte zeigen</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-2.5 py-1.5 text-[12.5px] font-medium text-white hover:bg-brand-hover"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">Drucken</span>
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
