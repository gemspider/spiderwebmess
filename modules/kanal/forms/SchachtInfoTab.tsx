'use client'

// Schacht — the detail list.
//
// The field list and its order follow the original application's "Info : Schächte"
// window exactly, for the same reason the Haltung one does: the crews have used that
// window for years, and a tidier arrangement costs them more than it gains.
//
// Every value comes from the GeoServer view rather than kanal.schaechte. The base table
// holds *_id foreign keys and almost none of these columns — see the first data finding
// in CLAUDE.md. lib/fieldAliases fills the app's own names alongside, never over, so
// both spellings are on the row and this tab reads the view's.

import type { FormProps } from '@/lib/registry'
import type { KanalSchacht } from '../types'
import { InfoCard, Row, SectionHead } from '@/components/feature/tabs/shared/InfoPrimitives'
import { ConditionBadge } from '@/components/ui/ConditionBadge'
import { toLevel } from '@/modules/kanal/datenblatt'

/** A condition cell: the chip where a class was assessed, a dash where it was not. */
function Klasse({ value }: { value: unknown }) {
  const level = toLevel(value)
  return level ? <ConditionBadge level={level} /> : null
}

export function SchachtInfoTab({ feature }: FormProps) {
  const s = feature as KanalSchacht

  return (
    <div>
      <SectionHead>Info : Schächte</SectionHead>
      <InfoCard>
        <Row label="Schacht Nr"         value={s.schacht_nr} />
        <Row label="Strang"             value={s.strang} />
        <Row label="Entwässerungssystem" value={s.entw_system} />
        <Row label="DOK"                value={s.dok} />
        <Row label="Sohle"              value={s.sohle} />
        <Row label="Abstich"            value={s.abstich} />
        <Row label="Letzte Überprüfung" value={s.letzte_ueberpruefung} />
        <Row label="Name"               value={s.name} />
        <Row label="Anmerkung"          value={s.anmerkung} />
        <Row label="Ortsteil"           value={s.ortsteil} />
        <Row label="Zone"               value={s.zone} />
        <Row label="Schachtart"         value={s.schachtart} />
        <Row label="Material"           value={s.material} />
        <Row label="Querschnitt"        value={s.querschnitt} />
        <Row label="Vermesser"          value={s.vermesser} />
        <Row label="Inbetriebnahme"     value={s.inbetriebnahme} />
        <Row label="Inspekteur"         value={s.inspekteur} />
        <Row label="SBZ"                value={<Klasse value={s.sbz} />} />
        <Row label="GBZ"                value={<Klasse value={s.gbz} />} />
        <Row label="FFK"                value={<Klasse value={s.ffk} />} />
        <Row label="Zone NEU"           value={s.zone_neu} />
      </InfoCard>
    </div>
  )
}
