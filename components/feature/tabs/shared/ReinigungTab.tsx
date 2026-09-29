'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { RatingButtons } from '@/components/ui/RatingButtons'
import { SectionHead, inputCls } from './InfoPrimitives'
import type { FormProps } from '@/lib/registry'
import { saveReinigung } from '@/modules/kanal/api'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-dim uppercase tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export function ReinigungTab({ feature }: FormProps) {
  const [rv,        setRv]        = useState<number>((feature.rv as number) ?? 0)
  const [zf,        setZf]        = useState<number>((feature.zf as number) ?? 0)
  const [vs,        setVs]        = useState<number>((feature.vs as number) ?? 0)
  const [fahrer,    setFahrer]    = useState<string>((feature.fahrer as string) ?? '')
  const [datum,     setDatum]     = useState<string>((feature.letzte_reinigung as string) ?? '')
  const [anmerkung, setAnmerkung] = useState<string>((feature.anmerkung as string) ?? '')
  const [saved,     setSaved]     = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const save = async () => {
    if (!feature.id) return
    setSaving(true)
    setError(null)
    try {
      await saveReinigung({
        id:               feature.id as number,
        letzte_reinigung: datum || undefined,
        fahrer:           fahrer || undefined,
        anmerkung:        anmerkung || undefined,
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
      <SectionHead>Bewertung</SectionHead>

      <div className="rounded-xl border border-border bg-white p-4 space-y-4 shadow-sm">
        <RatingButtons label="Reinigungsvorgang"   value={rv} onChange={setRv} />
        <RatingButtons label="Zufahrt zum Schacht" value={zf} onChange={setZf} />
        <RatingButtons label="Verschmutzungsgrad"  value={vs} onChange={setVs} />
      </div>

      <SectionHead>Einsatzdaten</SectionHead>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fahrer">
          <input value={fahrer} onChange={e => setFahrer(e.target.value)} placeholder="Name…" className={inputCls} />
        </Field>
        <Field label="Datum">
          <input type="date" value={datum} onChange={e => setDatum(e.target.value)} className={inputCls} />
        </Field>
      </div>

      <Field label="Anmerkung">
        <textarea
          value={anmerkung} onChange={e => setAnmerkung(e.target.value)}
          placeholder="Notizen zur Reinigung…" rows={3}
          className={`${inputCls} resize-none`}
        />
      </Field>

      <Button variant="success" size="sm" fullWidth className="py-2"
        onClick={save} disabled={saving}
      >
        {saved ? '✓ Gespeichert' : saving ? 'Speichert…' : '💾 Reinigung speichern'}
      </Button>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span>⚠</span><span>{error}</span>
        </div>
      )}
    </div>
  )
}
