'use client'

// Folgetätigkeiten — what the observation triggered, and whether it has been done.
//
// The follow-up text lives on kanal.wartungsparameterwerte and is empty throughout
// this snapshot; the completion is on the task itself and is not (erfuellt_am is set
// on 314 of 329). Both are shown, because "nothing was required" and "we have not
// recorded what was required" are different statements and the sheet should not blur
// them.

import { useQuery } from '@tanstack/react-query'
import { CalendarCheck } from 'lucide-react'
import { InfoCard, Row, SectionHead } from '@/components/feature/tabs/shared/InfoPrimitives'
import { fetchWartungDetail } from '@/modules/kanal/wartung'
import { formatDate } from '@/lib/utils'
import type { FormProps } from '@/lib/registry'

export function WartungFolgeTab({ feature }: FormProps) {
  const w = feature as Record<string, unknown>
  const id = feature?.id

  const { data } = useQuery({
    queryKey: ['wartung-detail', id],
    queryFn:  () => fetchWartungDetail(id as number),
    enabled:  id != null,
  })

  const folgen = (data?.beobachtungen ?? []).filter(b => b.folge)

  return (
    <div>
      <SectionHead>Folgetätigkeiten</SectionHead>
      {folgen.length > 0 ? (
        <ul className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
          {folgen.map((b, i) => (
            <li key={i} className="border-t border-border px-4 py-3 first:border-t-0">
              <p className="font-mono text-[12px] text-ink-dim">{b.name}</p>
              <p className="mt-0.5 text-[13px] font-medium text-ink">{b.folge}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-[13px] text-ink-dim">
          Keine Folgetätigkeit erfasst.
        </p>
      )}

      <SectionHead>Erledigung</SectionHead>
      <InfoCard>
        <Row label="Erfüllt am"  value={formatDate(w.erfuellt_am as string)} />
        <Row label="Erfüllt von" value={w.erfuellt_von as string} />
      </InfoCard>

      {Boolean(w.erfuellt_am) && (
        <p className="mt-3 flex items-center gap-2 text-[12.5px] text-emerald-800">
          <CalendarCheck className="h-4 w-4 flex-shrink-0" aria-hidden />
          Aufgabe abgeschlossen
        </p>
      )}
    </div>
  )
}
