'use client'
import type { FormProps } from '@/lib/registry'
import type { KanalHaltung } from '../types'
import { InfoCard, Row, SectionHead } from '@/components/feature/tabs/shared/InfoPrimitives'
import { LEVEL_COLORS } from '@/lib/registry'

export function HaltungInfoTab({ feature }: FormProps) {
  const h = feature as KanalHaltung
  const gsk = h.gesamtschadensklasse
  const gskColor = gsk ? LEVEL_COLORS[gsk] : undefined

  return (
    <div>
      <SectionHead>Stammdaten</SectionHead>
      <InfoCard>
        <Row label="Bezeichnung"       value={h.bezeichnung} />
        <Row label="Name"              value={h.name} />
        <Row label="Strang"            value={h.strang} />
        <Row label="Entwässerungssystem" value={h.entwasserungssystem} />
        <Row label="Material"          value={h.material} />
        <Row label="DN / Breite"       value={h.nennweite} />
        <Row label="Länge"             value={h.laenge != null ? `${Number(h.laenge).toFixed(2)} m` : null} />
        <Row label="Gefälle [%]"       value={h.gefaelle} />
        <Row label="Abwasserart"       value={h.abwasserart} />
        <Row label="Letzte Überprüfung" value={h.letzte_ueberpruefung} />
        {h.anmerkung && <Row label="Anmerkung" value={h.anmerkung} />}
      </InfoCard>

      {gsk && (
        <>
          <SectionHead>Gesamtschadensklasse</SectionHead>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold"
            style={{ borderColor: `${gskColor}40`, background: `${gskColor}10`, color: gskColor }}
          >
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-base flex-shrink-0"
              style={{ background: gskColor }}
            >
              {gsk}
            </span>
            GSK {gsk} — {['Sehr gut', 'Gut', 'Mittel', 'Schlecht', 'Sehr schlecht'][gsk - 1]}
          </div>
        </>
      )}
    </div>
  )
}
