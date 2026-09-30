'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { SectionHead, inputCls } from './InfoPrimitives'
import { useLevelColors } from '@/lib/store/styleStore'
import { LEVEL_LABEL, levelInk } from '@/modules/kanal/datenblatt'
import { cn } from '@/lib/utils'
import { Check, Save } from 'lucide-react'
import type { FormProps } from '@/lib/registry'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-dim uppercase tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export function BeobachtungenTab(_: FormProps) {
  const LEVEL_COLORS = useLevelColors()
  const [obsOn,       setObsOn]       = useState(true)
  const [selectedSbz, setSelectedSbz] = useState<number | null>(null)
  const [anmerkung,   setAnmerkung]   = useState('')
  const [saved,       setSaved]       = useState(false)

  return (
    <div className="space-y-5">
      <SectionHead>Aktive Beobachtungen</SectionHead>

      <div className={`rounded-xl border p-4 transition-colors ${obsOn ? 'border-emerald-200 bg-emerald-50/40' : 'border-border bg-white'}`}>
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink truncate">Schachtüberprüfung extern 2023</p>
            <p className="text-xs text-ink-dim mt-0.5">Letzte Aktualisierung: 15.04.2023</p>
          </div>
          <Toggle checked={obsOn} onChange={setObsOn} />
        </div>
        {obsOn && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
            <Check className="h-3 w-3" aria-hidden />
            Aktiv
          </span>
        )}
      </div>

      <div>
        <SectionHead>Schadensklasse (SBZ)</SectionHead>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => {
            const col    = LEVEL_COLORS[n]
            const active = selectedSbz === n
            return (
              <button
                key={n}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedSbz(active ? null : n)}
                title={`SBZ ${n} — ${LEVEL_LABEL[n]}`}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-2.5 transition-all',
                  active
                    ? 'border-ink bg-surface-muted shadow-sm'
                    : 'border-border bg-white hover:border-border-strong',
                )}
              >
                {/* The swatch is a solid fill, and the number sits on it in ink chosen
                    for that fill — never coloured text on a near-white wash. */}
                <span
                  className="flex h-7 w-9 items-center justify-center rounded-md font-mono text-[13px] font-semibold tabular-nums"
                  style={{ background: col, color: levelInk(n) }}
                >
                  {n}
                </span>
                <span className="text-[10px] font-medium leading-none text-ink-dim">
                  {LEVEL_LABEL[n]}
                </span>
              </button>
            )
          })}
        </div>
        {selectedSbz && (
          <p className="mt-2 text-center text-xs text-ink-dim">
            SBZ {selectedSbz} — {LEVEL_LABEL[selectedSbz]} ausgewählt
          </p>
        )}
      </div>

      <Field label="Anmerkung">
        <textarea
          value={anmerkung} onChange={e => setAnmerkung(e.target.value)}
          placeholder="Beobachtungen beschreiben…" rows={4}
          className={`${inputCls} resize-none`}
        />
      </Field>

      <Button variant="primary" size="sm" fullWidth className="flex items-center justify-center gap-2 py-2.5"
        onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}
      >
        {saved
          ? <><Check className="h-4 w-4" aria-hidden /> Gespeichert</>
          : <><Save  className="h-4 w-4" aria-hidden /> Beobachtung speichern</>}
      </Button>
    </div>
  )
}
