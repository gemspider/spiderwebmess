'use client'

// Vertical section through the shaft, drawn to the recorded elevations.
//
// DOK (Deckeloberkante) and SOH (Sohlhöhe) are metres above Adria; the difference is the
// shaft depth, and each connection's `abstich` is its depth below the cover. Those three
// numbers place everything in the drawing, so the proportions are real rather than
// illustrative — a shallow manhole draws short.
//
// When DOK or SOH is missing — and it often is, the survey covers about a third of the
// network — the drawing falls back to nominal proportions and says so, instead of
// silently implying a depth nobody measured.
//
// Ink is the Fachschale's brand colour, same as the Haltung section, so the two drawings
// read as one family of document rather than two.

import { anschlussLabel, type Anschluss } from '@/modules/kanal/datenblatt'

const W = 200
const H = 230
const TOP = 26          // headroom for the DOK label
const BOTTOM = H - 30   // baseline for SOH

interface Props {
  dok?:   number | null
  sohle?: number | null
  anschluesse?: Anschluss[]
}

export function ShaftSection({ dok, sohle, anschluesse = [] }: Props) {
  const haveElevations =
    typeof dok === 'number' && typeof sohle === 'number' && dok > sohle
  const depth = haveElevations ? dok! - sohle! : null

  const shaftTop = TOP
  const shaftBottom = BOTTOM
  const shaftPx = shaftBottom - shaftTop

  /** Depth below cover, in metres, → a y coordinate in the drawing. */
  const yFor = (abstich: number) =>
    depth ? shaftTop + Math.min(1, Math.max(0, abstich / depth)) * shaftPx : null

  const placed = anschluesse
    .filter(a => typeof a.abstich === 'number')
    .map(a => ({ ...a, y: yFor(a.abstich!) }))
    .filter(a => a.y !== null)

  const fmt = (v: number) => v.toFixed(2)

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto block h-auto w-full max-w-[230px]"
        role="img"
        aria-label={
          haveElevations
            ? `Schachtschnitt, Tiefe ${fmt(depth!)} Meter, DOK ${fmt(dok!)}, Sohle ${fmt(sohle!)}`
            : 'Schachtschnitt, Höhen nicht erfasst'
        }
      >
        {/* Cover */}
        <rect x="62" y={shaftTop - 12} width="76" height="12" fill="none" stroke="var(--brand, #0f4c81)" strokeWidth="1.6" />

        {/* Shaft body: neck, cone, barrel */}
        <path
          d={`M62 ${shaftTop} L62 ${shaftTop + 18} L48 ${shaftTop + 40} L48 ${shaftBottom}
              M138 ${shaftTop} L138 ${shaftTop + 18} L152 ${shaftTop + 40} L152 ${shaftBottom}`}
          fill="none" stroke="var(--brand, #0f4c81)" strokeWidth="1.6" strokeLinejoin="round"
        />
        {/* Base and channel */}
        <path d={`M48 ${shaftBottom} Q100 ${shaftBottom + 16} 152 ${shaftBottom}`} fill="none" stroke="var(--brand, #0f4c81)" strokeWidth="1.6" />
        <circle cx="100" cy={shaftBottom} r="6" fill="none" stroke="var(--brand, #0f4c81)" strokeWidth="1.4" />

        {/* Connections at their measured depth */}
        {placed.map((a, i) => {
          const outlet = a.typ === 'A'
          const left = (a.uhrzeit ?? 12) > 6
          const x1 = left ? 48 : 152
          const x2 = left ? 24 : 176
          return (
            <g key={i}>
              <line
                x1={x1} y1={a.y!} x2={x2} y2={a.y!}
                stroke={outlet ? 'var(--brand, #0f4c81)' : '#78716c'}
                strokeWidth={outlet ? 3.2 : 2.4}
                strokeLinecap="round"
              />
              <text
                x={left ? x2 - 2 : x2 + 2}
                y={a.y! - 4}
                textAnchor={left ? 'end' : 'start'}
                className="font-mono" fontSize="8.5" fill="#78716c"
              >
                {fmt(a.abstich!)}
              </text>
            </g>
          )
        })}

        {/* Elevations */}
        <text x="4" y="12" className="font-mono" fontSize="9" fill="#78716c">
          {haveElevations ? `DOK ${fmt(dok!)}` : 'DOK —'}
        </text>
        <text x="4" y={H - 8} className="font-mono" fontSize="9" fill="#78716c">
          {haveElevations ? `SOH ${fmt(sohle!)}` : 'SOH —'}
        </text>

        {/* Depth dimension */}
        {haveElevations && (
          <g>
            <line x1="184" y1={shaftTop} x2="184" y2={shaftBottom} stroke="#a8a29e" strokeWidth="1" />
            <line x1="180" y1={shaftTop} x2="188" y2={shaftTop} stroke="#a8a29e" strokeWidth="1" />
            <line x1="180" y1={shaftBottom} x2="188" y2={shaftBottom} stroke="#a8a29e" strokeWidth="1" />
            <text
              x="182" y={(shaftTop + shaftBottom) / 2}
              textAnchor="middle" className="font-mono" fontSize="9" fill="#78716c"
              transform={`rotate(-90 182 ${(shaftTop + shaftBottom) / 2})`}
            >
              {fmt(depth!)} m
            </text>
          </g>
        )}
      </svg>

      <figcaption className="mt-2 text-center text-[11.5px] text-ink-dim">
        {haveElevations
          ? `Schnitt · Tiefe ${fmt(depth!)} m`
          : 'Schnitt · Höhen nicht erfasst, Darstellung schematisch'}
      </figcaption>
    </figure>
  )
}
