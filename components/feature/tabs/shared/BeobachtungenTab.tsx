'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { SectionHead, inputCls } from './InfoPrimitives'
import { LEVEL_COLORS } from '@/lib/registry'
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
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-2">
            ✓ Aktiv
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
                onClick={() => setSelectedSbz(active ? null : n)}
                className="flex-1 py-3 rounded-xl text-sm font-bold border transition-all"
                style={{
                  background:  active ? col : `${col}15`,
                  color:       active ? '#fff' : col,
                  borderColor: active ? col : `${col}40`,
                  boxShadow:   active ? `0 0 0 3px ${col}30` : 'none',
                }}
              >
                {n}
              </button>
            )
          })}
        </div>
        {selectedSbz && <p className="mt-2 text-xs text-center text-ink-dim">SBZ {selectedSbz} ausgewählt</p>}
      </div>

      <Field label="Anmerkung">
        <textarea
          value={anmerkung} onChange={e => setAnmerkung(e.target.value)}
          placeholder="Beobachtungen beschreiben…" rows={4}
          className={`${inputCls} resize-none`}
        />
      </Field>

      <Button variant="success" size="sm" fullWidth className="py-2"
        onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}
      >
        {saved ? '✓ Gespeichert' : '💾 Beobachtung speichern'}
      </Button>
    </div>
  )
}
