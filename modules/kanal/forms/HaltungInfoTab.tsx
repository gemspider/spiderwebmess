'use client'

// Haltung — Info tab.
//
// The field list and its order follow the original application's "Info : Haltungen"
// window exactly. That window is what the field crews read, and a rearranged list costs
// them more than a tidier one gains: the eye goes to the fourth row for Material whether
// or not the row above it was moved.
//
// Every value here comes from the GeoServer view, not the base table. kanal.haltungen
// holds the *_id foreign keys; the labels live in haltungen_app — see lib/fieldAliases.

import type { FormProps } from '@/lib/registry'
import type { KanalHaltung } from '../types'
import { InfoCard, Row, SectionHead } from '@/components/feature/tabs/shared/InfoPrimitives'
import { ConditionBadge } from '@/components/ui/ConditionBadge'
import { toLevel } from '@/modules/kanal/datenblatt'

/** Numbers arrive from the view as strings often enough to be worth one guard. */
const n = (v: unknown): number | null => {
  const x = Number(v)
  return Number.isFinite(x) ? x : null
}

export function HaltungInfoTab({ feature }: FormProps) {
  const h = feature as KanalHaltung
  const gsk = toLevel(h.gesamtschadensklasse)

  const laenge = n(h.laenge)
  // haltungen_app does COALESCE(ha.gefaelle, -1), so -1 means "never recorded", not a
  // pipe running uphill. It is that for all 2 892 rows here — kanal.haltungen.gefaelle
  // is empty throughout this dump. The Datenblatt derives the real gradient from the two
  // manholes' invert levels; the panel has only this row, so it says nothing rather than
  // printing a sentinel.
  const gefaelle = n(h.gefaelle)
  const hatGefaelle = gefaelle != null && gefaelle > 0

  return (
    <div>
      <SectionHead>Info : Haltungen</SectionHead>
      <InfoCard>
        <Row label="Bezeichnung"         value={h.bezeichnung} />
        <Row label="Strang"              value={h.strang} />
        <Row label="Entwässerungssystem" value={h.entwasserungssystem} />
        <Row label="Material"            value={h.material} />
        <Row label="DN/Breite"           value={h.nennweite} />
        <Row label="DN/Höhe"             value={h.hoehe} />
        <Row label="Länge"               value={laenge != null ? laenge.toFixed(2) : null} />
        <Row label="Gefälle [%]"         value={hatGefaelle ? gefaelle.toFixed(2) : null} />
        <Row label="Letzte Überprüfung"  value={h.letzte_ueberpruefung} />
        <Row label="Abwasserart"         value={h.abwasserart} />
        <Row label="Name"                value={h.name} />
        <Row label="Anmerkung"           value={h.anmerkung} />
        <Row label="Ortsteil"            value={h.ortsteil} />
        <Row label="Zone"                value={h.zone} />
        <Row label="Inbetriebnahme"      value={h.inbetriebnahme} />
        <Row label="Inspekteur"          value={h.inspekteur} />
        <Row label="WR-Bewil"            value={h.wr_bewill} />
        <Row label="WR-Datum"            value={h.wr_datum} />
        <Row
          label="GSK"
          value={gsk ? <ConditionBadge level={gsk} /> : null}
        />
      </InfoCard>
    </div>
  )
}
