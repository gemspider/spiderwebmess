'use client'

// Allgemein — the editable half of a maintenance task.
//
// Matches the original's first tab: Datum, Status, Wetter, Anmerkung, with the object
// the task was raised on shown above them for context. The Speichern / Foto / Löschen
// buttons are not here — they sit in the panel footer so they are reachable from all
// three tabs, which is where the original puts them. This writes to taskFormStore and
// the footer saves from it.

import { useEffect } from 'react'
import { Sun, CloudSun, CloudRain, Snowflake, Wind, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { SectionHead, inputCls } from '@/components/feature/tabs/shared/InfoPrimitives'
import { useTaskFormStore } from '@/lib/store/taskFormStore'
import { cn } from '@/lib/utils'
import type { FormProps } from '@/lib/registry'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-ink-dim">
        {label}
      </label>
      {children}
    </div>
  )
}

const WETTER = [
  { val: 'sonnig',  Icon: Sun },
  { val: 'bewölkt', Icon: CloudSun },
  { val: 'Regen',   Icon: CloudRain },
  { val: 'Schnee',  Icon: Snowflake },
  { val: 'Wind',    Icon: Wind },
]

/** GeoServer dates arrive as 2026-01-27Z; <input type="date"> needs YYYY-MM-DD. */
const toDateInput = (v: unknown) =>
  typeof v === 'string' ? (v.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? '') : ''

export function WartungAllgemeinTab({ feature }: FormProps) {
  const w = feature as Record<string, unknown>
  const id = String(w.id ?? '')

  const { draft, load, patch } = useTaskFormStore()

  useEffect(() => {
    load(id, {
      datum:     toDateInput(w.datum),
      status:    Number(w.status) === 1 ? 1 : 0,
      wetter:    (w.wetter as string) ?? '',
      anmerkung: (w.anmerkung as string) ?? '',
    })
    // Only when the task changes — see load()'s guard for why re-runs are safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const objekt = w.objektname as string | undefined
  const art = (w.wartungsart as string) || (w.aufgabe as string) || 'Aufgabe'

  return (
    <div className="space-y-5">
      <SectionHead>Aufgabendetails</SectionHead>

      <div className="rounded-xl border border-border bg-surface-muted px-4 py-3">
        <p className="text-[13px] font-semibold text-ink">{art}</p>
        {objekt && (
          <Link
            href={`/?suche=${encodeURIComponent(objekt)}`}
            className="mt-1 flex items-center gap-1.5 font-mono text-[12px] text-brand hover:underline"
          >
            {objekt}
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Datum">
          <input
            type="date"
            value={draft.datum}
            onChange={e => patch({ datum: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Status">
          <select
            value={draft.status}
            onChange={e => patch({ status: Number(e.target.value) })}
            className={inputCls}
          >
            <option value={0}>in Bearbeitung</option>
            <option value={1}>fertig</option>
          </select>
        </Field>
      </div>

      <Field label="Wetter">
        <div className="flex gap-2">
          {WETTER.map(({ val, Icon }) => {
            const active = draft.wetter === val
            return (
              <button
                key={val}
                type="button"
                aria-pressed={active}
                title={val}
                onClick={() => patch({ wetter: active ? '' : val })}
                className={cn(
                  'flex flex-1 items-center justify-center rounded-xl border py-2.5 transition-all',
                  active
                    ? 'border-brand bg-brand-light text-brand shadow-sm'
                    : 'border-border bg-white text-ink-dim hover:border-border-strong hover:text-ink-muted',
                )}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden />
                <span className="sr-only">{val}</span>
              </button>
            )
          })}
        </div>
        {draft.wetter && <p className="mt-1.5 text-center text-xs text-ink-dim">{draft.wetter}</p>}
      </Field>

      <Field label="Anmerkung">
        <textarea
          value={draft.anmerkung}
          onChange={e => patch({ anmerkung: e.target.value })}
          placeholder="Notizen zur Aufgabe…"
          rows={4}
          className={`${inputCls} resize-none`}
        />
      </Field>
    </div>
  )
}
