'use client'

// The Schacht datasheet.
//
// Direction A (Kataster) inside the Feldbuch shell: the sheet itself is a technical
// document — label/value grids, hairline rules, mono for every measurement — because it
// gets printed and filed, while the chrome around it stays phone-friendly.
//
// Sections render only when they hold something. The survey covers roughly 15% of the
// network, so an empty Schäden section is the common case, not an error, and the sheet
// has to read as complete either way rather than as a page of dashes.

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

import { fetchSchacht } from '@/modules/kanal/api'
import {
  fetchDatenblatt, anschlussLabel, toLevel, worstSkl, groupSchaeden,
} from '@/modules/kanal/datenblatt'
import { ConditionBadge } from '@/components/ui/ConditionBadge'
import { InspectionGallery } from '@/components/feature/InspectionGallery'
import { ConnectionDial } from './ConnectionDial'
import { ShaftSection } from './ShaftSection'
import { Section, Row, num, Shell } from './primitives'

// ─── View ────────────────────────────────────────────────────────────────────

export function DatenblattView({ id }: { id: string }) {
  const schachtQ = useQuery({
    queryKey: ['schacht', id],
    queryFn:  () => fetchSchacht(Number(id)),
    enabled:  !!id,
  })
  const blattQ = useQuery({
    queryKey: ['datenblatt', id],
    queryFn:  () => fetchDatenblatt(id),
    enabled:  !!id,
  })

  const s = schachtQ.data
  const b = blattQ.data
  const loading = schachtQ.isLoading || blattQ.isLoading
  const mapHref = `/?schacht=${id}`

  if (loading) {
    return <Shell id={id} mapHref={mapHref}><p className="p-6 text-sm text-ink-dim">Datenblatt wird geladen…</p></Shell>
  }
  if (!s) {
    return (
      <Shell id={id} mapHref={mapHref}>
        <div className="p-6">
          <p className="text-sm text-ink">Kein Schacht mit der Nummer <span className="font-mono">{id}</span>.</p>
          <Link href="/" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">Zurück zur Karte</Link>
        </div>
      </Shell>
    )
  }

  const lk = b?.lookups ?? {}
  const sbz = toLevel(s.sbz)
  const gbz = toLevel((s as Record<string, unknown>).gbz)
  const ffk = toLevel((s as Record<string, unknown>).ffk)

  const anschluesse = b?.anschluesse ?? []
  const schaeden    = b?.schaeden ?? []
  const fotos       = b?.fotos ?? []
  const grouped     = groupSchaeden(schaeden)
  const worst       = worstSkl(schaeden)

  const dok   = typeof s.dok === 'number' ? s.dok : null
  const sohle = typeof s.soh === 'number' ? s.soh : null

  return (
    <Shell id={id} title={String(s.bezeichnung ?? id)} mapHref={mapHref}>
      {/* Identity + headline condition */}
      <header className="border-b border-border bg-surface px-4 py-4">
        <h1 className="font-mono text-[22px] font-semibold tracking-tight text-ink">
          {String(s.bezeichnung ?? id)}
        </h1>
        <p className="mt-0.5 text-[13px] text-ink-dim">
          {Array.from(new Set([
            lk.schachtart,
            s.strang ? `Strang ${s.strang}` : null,
            // Strang is often the street name, in which case printing both reads as a bug.
            s.strasse && s.strasse !== s.strang ? String(s.strasse) : null,
          ].filter(Boolean) as string[])).join(' · ') || 'Schacht'}
        </p>

        {sbz && (
          <div className="mt-3">
            <ConditionBadge level={sbz} variant="band" label="Schachtbauzustand" />
          </div>
        )}
      </header>

      <div className="grid gap-3 p-3 pb-10 md:grid-cols-2 md:items-start">

        <Section title="Stammdaten">
          <dl>
            <Row label="Schacht ID"   value={s.bezeichnung as string} mono />
            <Row label="Deckel Nr."   value={s.deckel_nr as string} mono />
            <Row label="Objekt ID"    value={id} mono />
            <Row label="Schachtart"   value={lk.schachtart} />
            <Row label="Material"     value={lk.material ?? (s.material as string)} />
            <Row label="Abdecktyp"    value={lk.abdecktyp} />
            <Row label="Abdeckklasse" value={lk.abdeckklasse} mono />
            <Row label="Deckelform"   value={lk.deckelform} />
            <Row label="Oberfläche"   value={lk.oberflaeche} />
            <Row label="Gerinneform"  value={lk.gerinneform} />
            <Row label="Steighilfen"  value={lk.steighilfeart} />
            <Row label="Steighilfen-Werkstoff" value={lk.steighilfenwerkstoff} />
          </dl>
        </Section>

        <Section title="Höhen & Maße">
          <dl>
            <Row label="DOK"       value={num(dok, ' m')} mono />
            <Row label="Sohle"     value={num(sohle, ' m')} mono />
            <Row label="Tiefe"     value={num(s.tiefe as number, ' m')} mono />
            <Row label="Durchmesser" value={num(s.nennweite as number, ' mm', 0)} mono />
            <Row label="Schachtform" value={s.schachtform as string} />
          </dl>
          <div className="border-t border-border px-4 py-4">
            <ShaftSection dok={dok} sohle={sohle} anschluesse={anschluesse} />
          </div>
        </Section>

        <Section title="Zustand">
          <dl>
            <Row label="Schachtbauzustand"  value={sbz ? <ConditionBadge level={sbz} /> : undefined} />
            <Row label="Gerinnebauzustand"  value={gbz ? <ConditionBadge level={gbz} /> : undefined} />
            <Row label="Funktionsfähigkeit" value={ffk ? <ConditionBadge level={ffk} /> : undefined} />
            <Row label="Letzte Überprüfung" value={s.letzte_ueberpruefung as string} mono />
            <Row label="Überprüfer"         value={s.ueberprufer as string} />
            <Row label="Art der Überprüfung" value={s.art_der_ueberpruefung as string} />
          </dl>
        </Section>

        {anschluesse.length > 0 && (
          <Section title="Anschlüsse" count={anschluesse.length}>
            <div className="border-b border-border px-4 py-4">
              <ConnectionDial anschluesse={anschluesse} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.08em] text-ink-dim">
                    <th className="px-4 py-2 font-medium">Typ</th>
                    <th className="px-2 py-2 font-medium">Lage</th>
                    <th className="px-2 py-2 font-medium">Abstich</th>
                    <th className="px-4 py-2 font-medium">Werkstoff</th>
                  </tr>
                </thead>
                <tbody>
                  {anschluesse.map((a, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-4 py-2">
                        <span className={a.typ === 'A' ? 'font-medium text-brand' : ''}>
                          {anschlussLabel(a.typ)}
                        </span>
                      </td>
                      <td className="px-2 py-2 font-mono tabular-nums">
                        {a.uhrzeit != null ? <>{a.uhrzeit}<sup>h</sup></> : '—'}
                      </td>
                      <td className="px-2 py-2 font-mono tabular-nums">{num(a.abstich) ?? '—'}</td>
                      <td className="px-4 py-2 font-mono">{a.material ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {schaeden.length > 0 && (
          <Section title="Schäden" count={schaeden.length}>
            {worst && (
              <p className="border-b border-border px-4 py-2.5 text-[12.5px] text-ink-muted">
                Schlechteste Schadensklasse <ConditionBadge level={worst} className="mx-1 align-middle" />
                über {grouped.length} {grouped.length === 1 ? 'Schadensart' : 'Schadensarten'}.
              </p>
            )}
            <ul>
              {grouped.map(g => (
                <li key={g.code} className="flex items-start gap-3 border-t border-border px-4 py-2.5 first:border-t-0">
                  {g.worst ? <ConditionBadge level={g.worst} className="mt-0.5 shrink-0" />
                           : <span className="mt-0.5 h-[22px] w-[26px] shrink-0 rounded bg-surface-sunken" />}
                  <div className="min-w-0">
                    <p className="font-mono text-[13px] font-medium text-ink">
                      {g.code}
                      {g.count > 1 && (
                        <span className="ml-2 font-sans text-[11.5px] font-normal text-ink-dim">
                          {g.count}×
                        </span>
                      )}
                    </p>
                    {g.texts.length > 0 && (
                      <p className="mt-0.5 text-[12.5px] text-ink-dim">{g.texts.join(' · ')}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {fotos.length > 0 && (
          <div className="md:col-span-2">
            <Section title="Fotos" count={fotos.length}>
              <div className="p-3">
                {/* externedateien stores the reference only, so these are inspection
                    frames shipped with the demo, mapped from the filename. The gallery
                    says so under the grid. */}
                <InspectionGallery references={fotos} prefer="schacht" />
              </div>
            </Section>
          </div>
        )}

        {(s.anmerkung || b?.inspektion?.anmerkung) && (
          <Section title="Bemerkung">
            <p className="px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
              {[s.anmerkung, b?.inspektion?.anmerkung].filter(Boolean).join(' · ')}
            </p>
          </Section>
        )}
      </div>
    </Shell>
  )
}
