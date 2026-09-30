'use client'
import { useState } from 'react'
import { Sun, CloudSun, CloudRain, Snowflake, Wind, Save, Camera, Trash2, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { SectionHead, inputCls } from './InfoPrimitives'
import type { FormProps } from '@/lib/registry'
import { saveWartung } from '@/modules/kanal/api'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-dim uppercase tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const STATUS_MAP: Record<string, number> = { fertig: 1, in_bearbeitung: 0, gesperrt: 2 }
const STATUS_FROM_NUM: Record<number, string> = { 1: 'fertig', 0: 'in_bearbeitung', 2: 'gesperrt' }

export function AufgabeTab({ feature }: FormProps) {
  const [datum,     setDatum]     = useState<string>((feature.eingabedatum as string) ?? '')
  const [status,    setStatus]    = useState<string>(STATUS_FROM_NUM[feature.status as number] ?? 'fertig')
  const [wetter,    setWetter]    = useState<string>((feature.wetter as string) ?? '')
  const [anmerkung, setAnmerkung] = useState<string>((feature.beschreibung as string) ?? '')
  const [saved,     setSaved]     = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const save = async () => {
    if (!feature.id) return
    setSaving(true)
    setError(null)
    try {
      await saveWartung({
        id:           feature.id as number,
        eingabedatum: datum || undefined,
        status:       STATUS_MAP[status] ?? 1,
        beschreibung: anmerkung || undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionHead>Aufgabendetails</SectionHead>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Datum">
          <input type="date" value={datum} onChange={e => setDatum(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Status">
          <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
            <option value="fertig">Fertig</option>
            <option value="in_bearbeitung">In Bearbeitung</option>
            <option value="gesperrt">Gesperrt</option>
          </select>
        </Field>
      </div>

      <Field label="Wetter">
        <div className="flex gap-2">
          {[
            { val: 'sonnig',  Icon: Sun },
            { val: 'bewölkt', Icon: CloudSun },
            { val: 'Regen',   Icon: CloudRain },
            { val: 'Schnee',  Icon: Snowflake },
            { val: 'Wind',    Icon: Wind },
          ].map(({ val, Icon }) => {
            const active = wetter === val
            return (
              <button
                key={val}
                type="button"
                aria-pressed={active}
                onClick={() => setWetter(active ? '' : val)}
                title={val}
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
        {wetter && <p className="mt-1.5 text-center text-xs text-ink-dim">{wetter}</p>}
      </Field>

      <Field label="Anmerkung">
        <textarea
          value={anmerkung} onChange={e => setAnmerkung(e.target.value)}
          placeholder="Notizen zur Aufgabe…" rows={4}
          className={`${inputCls} resize-none`}
        />
      </Field>

      <div className="flex items-center gap-2 pt-1">
        <Button variant="primary" size="sm" className="flex flex-1 items-center justify-center gap-2 py-2.5" onClick={save} disabled={saving}>
          {saved
            ? <><Check className="h-4 w-4" aria-hidden /> Gespeichert</>
            : saving
              ? 'Speichert…'
              : <><Save className="h-4 w-4" aria-hidden /> Speichern</>}
        </Button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm text-ink-muted transition-colors hover:bg-surface-muted"
        >
          <Camera className="h-4 w-4" aria-hidden />
          <span>Foto</span>
        </button>
        <button
          type="button"
          aria-label="Aufgabe löschen"
          className="flex items-center rounded-xl border border-red-200 px-3 py-2.5 text-red-600 transition-colors hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <Check className="h-4 w-4 flex-shrink-0" aria-hidden />
          <span>Aufgabe gespeichert</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
