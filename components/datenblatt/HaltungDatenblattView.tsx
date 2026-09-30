'use client'

// The Haltung datasheet.
//
// Same document as the Schacht sheet — label/value grids, hairline rules, mono for every
// measurement — but about a run rather than a point, so the drawing is a longitudinal
// section and the defects carry a station instead of a clock position.
//
// What the sheet can show varies a lot across the network, and it has to read as
// complete either way: 881 of 2 892 runs have been inspected at all, 1 469 have invert
// levels at both ends, and only a tenth of the defects carry a Schadensklasse. Sections
// render only when they hold something, and the drawing states when it is schematic.

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowDownRight, Ruler } from 'lucide-react'

import { fetchHaltung } from '@/modules/kanal/api'
import {
  fetchHaltungDatenblatt, gradient, splitByStation, worstClass, groupByCode, fileKind,
} from '@/modules/kanal/haltungDatenblatt'
import { toLevel, objectLabel } from '@/modules/kanal/datenblatt'
import { ConditionBadge } from '@/components/ui/ConditionBadge'
import { InspectionGallery } from '@/components/feature/InspectionGallery'
import { PipeSection } from './PipeSection'
import { Section, Row, num, Shell } from './primitives'

export function HaltungDatenblattView({ id }: { id: string }) {
  const haltungQ = useQuery({
    queryKey: ['haltung', id],
    queryFn:  () => fetchHaltung(Number(id)),
    enabled:  !!id,
  })
  const blattQ = useQuery({
    queryKey: ['haltung-datenblatt', id],
    queryFn:  () => fetchHaltungDatenblatt(id),
    enabled:  !!id,
  })

  const h = haltungQ.data
  const b = blattQ.data
  const mapHref = `/?haltung=${id}`

  if (haltungQ.isLoading || blattQ.isLoading) {
    return (
      <Shell id={id} mapHref={mapHref}>
        <p className="p-6 text-sm text-ink-dim">Datenblatt wird geladen…</p>
      </Shell>
    )
  }
  if (!h) {
    return (
      <Shell id={id} mapHref={mapHref}>
        <div className="p-6">
          <p className="text-sm text-ink">
            Keine Haltung mit der Nummer <span className="font-mono">{id}</span>.
          </p>
          <Link href="/" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
            Zurück zur Karte
          </Link>
        </div>
      </Shell>
    )
  }

  const lk = b?.lookups ?? {}
  const laenge = typeof h.laenge === 'number' ? h.laenge : null
  const dn = typeof h.nennweite === 'number' ? h.nennweite : null

  const gsk = toLevel(h.gesamtschadensklasse)
  const { placed, unplaced } = splitByStation(b?.schaeden)
  const alleSchaeden = b?.schaeden ?? []
  const worst = worstClass(alleSchaeden)
  const grouped = groupByCode(alleSchaeden)

  // Computed, because haltungen.gefaelle is NULL throughout this dump and the map view
  // reports -1 as a sentinel. See gradient() for why it is reported in ‰.
  const faelle = gradient(b?.von, b?.bis, laenge)
  // A negative gradient is not an error: a Druckleitung out of a Pumpwerk climbs, and
  // several in this network do. Labelling it "Gefälle -32.6 ‰" reads as a fault in a
  // gravity sewer, so a rising run says so.
  const steigt = faelle != null && faelle < 0
  // The row label already says which way it goes, so the value is just the magnitude.
  const faelleText = faelle == null ? undefined : `${Math.abs(faelle).toFixed(1)} ‰`

  const fotos = b?.fotos ?? []
  const bilder = fotos.filter(f => fileKind(f.name) === 'bild')
  const andere = fotos.filter(f => fileKind(f.name) !== 'bild')

  const title = objectLabel(h as Record<string, unknown>, id)

  return (
    <Shell id={id} title={title} mapHref={mapHref}>
      <header className="border-b border-border bg-surface px-4 py-4">
        <h1 className="font-mono text-[22px] font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-0.5 text-[13px] text-ink-dim">
          {Array.from(new Set([
            lk.entw_system ?? (h.entwasserungssystem as string),
            lk.material ?? (h.material as string),
            dn ? `DN ${dn}` : null,
            h.strang ? `Strang ${h.strang}` : null,
          ].filter(Boolean) as string[])).join(' · ') || 'Haltung'}
        </p>

        {gsk && (
          <div className="mt-3">
            <ConditionBadge level={gsk} variant="band" label="Gesamtschadensklasse" />
          </div>
        )}
      </header>

      <div className="grid gap-3 p-3 pb-10 md:grid-cols-2 md:items-start">

        {/* The drawing spans both columns — it is the point of the sheet, and squeezing a
            40 m run into a half-width column makes the stations unreadable. */}
        <div className="min-w-0 md:col-span-2">
          <Section title="Längsschnitt">
            <div className="px-3 py-4">
              <PipeSection
                von={b?.von} bis={b?.bis} laenge={laenge} dn={dn} schaeden={placed}
              />
            </div>
            <dl className="border-t border-border sm:grid sm:grid-cols-3">
              <Row label="Anfangsschacht" value={b?.von?.nummer ?? b?.von?.name} mono />
              <Row label="Endschacht"     value={b?.bis?.nummer ?? b?.bis?.name} mono />
              <Row label={steigt ? 'Steigung' : 'Gefälle'} value={faelleText} mono />
            </dl>
          </Section>
        </div>

        <Section title="Stammdaten">
          <dl>
            <Row label="Bezeichnung"        value={h.bezeichnung as string} mono />
            <Row label="Name"               value={h.name as string} mono />
            <Row label="Objekt ID"          value={id} mono />
            <Row label="Strang"             value={h.strang as string} />
            <Row label="Entwässerungssystem" value={lk.entw_system ?? (h.entwasserungssystem as string)} />
            <Row label="Material"           value={lk.material ?? (h.material as string)} />
            <Row label="Profilform"         value={lk.profilform} />
            <Row label="Haltungsart"        value={lk.haltungsart} />
            <Row label="Leitungsart"        value={lk.leitungsart ?? (h.leitungsart as string)} />
            <Row label="Abwasserart"        value={lk.abwasserart ?? (h.abwasserart as string)} />
            <Row label="Ortsteil"           value={h.ortsteil as string} />
            <Row label="Zone"               value={h.zone as string} />
          </dl>
        </Section>

        <Section title="Maße & Höhen">
          <dl>
            <Row label="DN / Breite" value={num(dn, ' mm', 0)} mono />
            <Row label="DN / Höhe"   value={num(h.hoehe as number, ' mm', 0)} mono />
            <Row label="Länge"       value={num(laenge, ' m')} mono />
            <Row label={steigt ? 'Steigung' : 'Gefälle'} value={faelleText} mono />
            <Row label="Sohle Anfang" value={num(b?.von?.sohle, ' m')} mono />
            <Row label="Sohle Ende"   value={num(b?.bis?.sohle, ' m')} mono />
            <Row label="DOK Anfang"   value={num(b?.von?.dok, ' m')} mono />
            <Row label="DOK Ende"     value={num(b?.bis?.dok, ' m')} mono />
          </dl>
          {faelle != null && laenge != null && (
            <p className="flex items-start gap-2 border-t border-border px-4 py-2.5 text-[12px] leading-relaxed text-ink-dim">
              <ArrowDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {/* Stated because it is derived, not recorded — hoehe_start, hoehe_ende and
                  gefaelle are empty on every Haltung in this dataset. */}
              {steigt ? 'Steigung' : 'Gefälle'} aus den Sohlhöhen der beiden Schächte über{' '}
              {laenge.toFixed(2)} m berechnet, nicht aus dem Datenbestand übernommen.
              {steigt && ' Die Leitung steigt — bei einer Druckleitung ist das der Normalfall.'}
            </p>
          )}
        </Section>

        {b?.inspektion && (
          <Section title="Inspektion">
            <dl>
              <Row label="Datum"       value={b.inspektion.datum} mono />
              <Row label="Zustandsbewerter" value={b.inspektion.bewerter} />
              <Row label="Firma"       value={b.inspektion.firma} />
              <Row label="Richtung"    value={b.inspektion.richtung} />
              <Row label="Letzte Überprüfung" value={h.letzte_ueberpruefung as string} mono />
              <Row label="WR-Bewilligung" value={h.wr_bewill as string} mono />
            </dl>
            {b.inspektion.anmerkung && (
              <p className="border-t border-border px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
                {b.inspektion.anmerkung}
              </p>
            )}
          </Section>
        )}

        {alleSchaeden.length > 0 && (
          <Section title="Schäden" count={alleSchaeden.length}>
            <p className="border-b border-border px-4 py-2.5 text-[12.5px] text-ink-muted">
              {worst ? (
                <>
                  Schlechteste Schadensklasse
                  <ConditionBadge level={worst} className="mx-1 align-middle" />
                  über {grouped.length} {grouped.length === 1 ? 'Schadensart' : 'Schadensarten'}.
                </>
              ) : (
                // The common case: coded and located, but never assessed. Saying so is
                // the honest reading; an empty class column looks like lost data.
                <>Keiner dieser Schäden wurde klassifiziert — die Aufnahme kodiert und verortet nur.</>
              )}
            </p>
            <ul>
              {grouped.map(g => (
                <li key={g.code} className="flex items-start gap-3 border-t border-border px-4 py-2.5 first:border-t-0">
                  {g.worst ? (
                    <ConditionBadge level={g.worst} className="mt-0.5 shrink-0" />
                  ) : (
                    <span className="mt-0.5 h-[22px] w-[26px] shrink-0 rounded border border-border bg-surface-sunken" />
                  )}
                  <div className="min-w-0 flex-1">
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
                    {g.stations.length > 0 && (
                      <p className="mt-0.5 flex items-center gap-1 font-mono text-[11.5px] text-ink-faint">
                        <Ruler className="h-3 w-3" aria-hidden />
                        {g.stations.map(s => `${s.toFixed(1)} m`).join(' · ')}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {unplaced.length > 0 && (
              <p className="border-t border-border px-4 py-2 text-[11.5px] text-ink-dim">
                {unplaced.length} {unplaced.length === 1 ? 'Schaden ohne' : 'Schäden ohne'} Stationierung —
                nicht im Längsschnitt dargestellt.
              </p>
            )}
          </Section>
        )}

        {fotos.length > 0 && (
          <div className="min-w-0 md:col-span-2">
            <Section title="Aufnahmen" count={fotos.length}>
              <div className="p-3">
                <InspectionGallery references={bilder} prefer="kanal" />
              </div>
              {andere.length > 0 && (
                <ul className="divide-y divide-border border-t border-border">
                  {/* The inspection video and its report share the table with the
                      stills. They are listed rather than shown, because they are not
                      pictures — hiding them would under-report what the survey produced. */}
                  {andere.map(f => (
                    <li key={f.id} className="flex items-baseline gap-3 px-4 py-2">
                      <span className="w-16 shrink-0 text-[10.5px] font-medium uppercase tracking-[0.07em] text-ink-faint">
                        {fileKind(f.name)}
                      </span>
                      <span className="min-w-0 break-all font-mono text-[12px] text-ink-muted">
                        {f.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        )}

        {h.anmerkung ? (
          <Section title="Bemerkung">
            <p className="px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
              {h.anmerkung as string}
            </p>
          </Section>
        ) : null}
      </div>
    </Shell>
  )
}
