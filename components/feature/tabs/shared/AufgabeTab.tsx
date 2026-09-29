'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
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
            { val: 'sonnig', icon: '☀️' }, { val: 'bewölkt', icon: '⛅' },
            { val: 'Regen',  icon: '🌧'  }, { val: 'Schnee',  icon: '❄️' },
            { val: 'Wind',   icon: '💨'  },
          ].map(w => (
            <button
              key={w.val}
              onClick={() => setWetter(wetter === w.val ? '' : w.val)}
              title={w.val}
              className={`flex-1 py-2.5 rounded-xl border text-base transition-all ${
                wetter === w.val ? 'border-brand bg-brand-light shadow-sm' : 'border-border bg-white hover:bg-surface-soft'
              }`}
            >
              {w.icon}
            </button>
          ))}
        </div>
        {wetter && <p className="mt-1.5 text-xs text-ink-dim text-center">{wetter}</p>}
      </Field>

      <Field label="Anmerkung">
        <textarea
          value={anmerkung} onChange={e => setAnmerkung(e.target.value)}
          placeholder="Notizen zur Aufgabe…" rows={4}
          className={`${inputCls} resize-none`}
        />
      </Field>

      <div className="flex items-center gap-2 pt-1">
        <Button variant="success" size="sm" className="flex-1 py-2" onClick={save} disabled={saving}>
          {saved ? '✓ Gespeichert' : saving ? 'Speichert…' : '💾 Speichern'}
        </Button>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-xl text-ink-muted hover:bg-surface-soft transition-colors">
          📷 <span>Foto</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-200 rounded-xl text-red-500 hover:bg-red-50 transition-colors">
          🗑
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <span>✓</span><span>Aufgabe gespeichert</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span>⚠</span><span>{error}</span>
        </div>
      )}
    </div>
  )
}
