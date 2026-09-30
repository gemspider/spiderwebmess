'use client'

// Beobachtungen — the check items on this task, and whether each was confirmed.
//
// `wert` is a boolean in kanal.wartungsparameterwerte, shown as Ja/Nein exactly as the
// original does. In the snapshot 314 of 329 are Ja and 13 have no value, which lines up
// precisely with the 13 tasks still 'in Bearbeitung' — an unanswered observation is
// what keeps a task open.
//
// The original's toggle is a real control, so this one is too: tapping it writes to the
// demo store and sticks. A task raised in this demo gets the check items that were
// chosen when it was created, all unanswered, which is the state a new task is in.

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Minus } from 'lucide-react'
import { SectionHead } from '@/components/feature/tabs/shared/InfoPrimitives'
import { fetchWartungDetail } from '@/modules/kanal/wartung'
import { setAnswer } from '@/lib/demoTasks'
import { cn } from '@/lib/utils'
import type { FormProps } from '@/lib/registry'

export function WartungBeobachtungenTab({ feature }: FormProps) {
  const id = feature?.id
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['wartung-detail', id],
    queryFn:  () => fetchWartungDetail(id as number),
    enabled:  id != null,
  })

  if (isLoading) return <p className="text-sm text-ink-dim">Wird geladen…</p>

  const rows = data?.beobachtungen ?? []
  if (!rows.length) {
    return <p className="text-sm text-ink-dim">Keine Beobachtungen zu dieser Aufgabe erfasst.</p>
  }

  function answer(name: string, wert: boolean) {
    setAnswer(id as number, name, wert)
    qc.invalidateQueries({ queryKey: ['wartung-detail', id] })
  }

  return (
    <div>
      <SectionHead>Beobachtungen</SectionHead>
      <ul className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        {rows.map((b, i) => {
          const ja = b.wert === true
          const nein = b.wert === false
          return (
            <li key={`${b.name}-${i}`} className="flex items-center gap-3 border-t border-border px-4 py-3 first:border-t-0">
              {/* Two buttons rather than one switch. A switch has an "off" position,
                  and "not answered yet" is a third state that an off switch would
                  quietly report as No — which for an open task is the wrong answer. */}
              <div className="flex flex-shrink-0 overflow-hidden rounded-full border border-border" role="group" aria-label={b.name}>
                <button
                  type="button"
                  aria-pressed={ja}
                  onClick={() => answer(b.name, true)}
                  className={cn(
                    'flex h-7 items-center gap-1 px-2.5 text-[11px] font-semibold transition-colors',
                    ja ? 'bg-emerald-600 text-white' : 'bg-white text-ink-dim hover:bg-surface-muted',
                  )}
                >
                  <Check className="h-3 w-3" aria-hidden />
                  Ja
                </button>
                <button
                  type="button"
                  aria-pressed={nein}
                  onClick={() => answer(b.name, false)}
                  className={cn(
                    'flex h-7 items-center gap-1 border-l border-border px-2.5 text-[11px] font-semibold transition-colors',
                    nein ? 'bg-red-600 text-white' : 'bg-white text-ink-dim hover:bg-surface-muted',
                  )}
                >
                  <Minus className="h-3 w-3" aria-hidden />
                  Nein
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words text-[13px] text-ink">{b.name}</p>
                {b.folge && <p className="mt-0.5 text-[12px] text-ink-dim">{b.folge}</p>}
                {b.wert === undefined && (
                  <p className="mt-0.5 text-[11.5px] text-amber-700">noch offen</p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
