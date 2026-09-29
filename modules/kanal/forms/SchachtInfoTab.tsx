'use client'
import type { FormProps } from '@/lib/registry'
import type { KanalSchacht } from '../types'
import { InfoCard, Row, SectionHead } from '@/components/feature/tabs/shared/InfoPrimitives'
import { LEVEL_COLORS } from '@/lib/registry'

export function SchachtInfoTab({ feature }: FormProps) {
  const s = feature as KanalSchacht
  const sbz = s.sbz
  const sbzColor = sbz ? LEVEL_COLORS[sbz] : undefined

  return (
    <div>
      <SectionHead>Stammdaten</SectionHead>
      <InfoCard>
        <Row label="Bezeichnung"       value={s.bezeichnung} />
        <Row label="Deckel Nr."        value={s.deckel_nr} />
        <Row label="Material"          value={s.material} />
        <Row label="DN"                value={s.nennweite} />
        <Row label="Tiefe"             value={s.tiefe != null ? `${Number(s.tiefe).toFixed(2)} m` : null} />
        <Row label="SOH"               value={s.soh} />
        {s.dok && <Row label="DOK"     value={s.dok} />}
        <Row label="Abdecktyp"         value={s.abdecktyp} />
        <Row label="Schachtform"       value={s.schachtform} />
        <Row label="Bauzustand"        value={s.schachtbauzustand ? `${s.schachtbauzustand} / 5` : null} />
        <Row label="Letzte Überprüfung" value={s.letzte_ueberpruefung} />
        <Row label="Überprüfer"        value={s.ueberprufer} />
        <Row label="Art der Überprüfung" value={s.art_der_ueberpruefung} />
      </InfoCard>

      {sbz && (
        <>
          <SectionHead>Schadensklasse (SBZ)</SectionHead>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold"
            style={{ borderColor: `${sbzColor}40`, background: `${sbzColor}10`, color: sbzColor }}
          >
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-base flex-shrink-0"
              style={{ background: sbzColor }}
            >
              {sbz}
            </span>
            SBZ {sbz} — {['Sehr gut', 'Gut', 'Mittel', 'Schlecht', 'Sehr schlecht'][sbz - 1]}
          </div>
        </>
      )}
    </div>
  )
}
