'use client'

// The connection dial — inlets and outlets placed by clock position.
//
// This is how the trade records manhole connections: looking down the shaft, 12 o'clock
// is one fixed bearing and every pipe is logged at the hour it enters. kanal.zuablaeufe
// stores exactly that in `uhrzeit`, so the drawing is the data, not a decoration.
//
// Drawn rather than illustrated: each connection's depth below the cover (`abstich`) and
// its material come straight from the record, and outlets are weighted more heavily than
// inlets because that is the distinction an operator is looking for.

import { clockPoint, anschlussLabel, type Anschluss } from '@/modules/kanal/datenblatt'

const SIZE = 200
const C = SIZE / 2
const R_OUTER = 68
const R_SHAFT = 20

interface Props {
  anschluesse: Anschluss[]
}

export function ConnectionDial({ anschluesse }: Props) {
  const placed = anschluesse.filter(a => typeof a.uhrzeit === 'number')

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto block h-auto w-full max-w-[230px]"
        role="img"
        aria-label={
          placed.length
            ? `Anschlusslagen: ${placed.map(a => `${anschlussLabel(a.typ)} bei ${a.uhrzeit} Uhr`).join(', ')}`
            : 'Keine Anschlusslagen erfasst'
        }
      >
        {/* Shaft wall */}
        <circle cx={C} cy={C} r={R_OUTER} fill="none" stroke="#d6d3d1" strokeWidth="1.5" />
        <circle cx={C} cy={C} r={R_OUTER - 6} fill="none" stroke="#e7e5e4" strokeWidth="1" />

        {/* Hour ticks — every hour, with 12/3/6/9 labelled and lengthened */}
        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => {
          const cardinal = h % 3 === 0
          const outer = clockPoint(h, R_OUTER, C, C)
          const inner = clockPoint(h, R_OUTER - (cardinal ? 9 : 5), C, C)
          const label = clockPoint(h, R_OUTER + 13, C, C)
          return (
            <g key={h}>
              <line
                x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
                stroke={cardinal ? '#a8a29e' : '#d6d3d1'}
                strokeWidth={cardinal ? 1.4 : 1}
              />
              {cardinal && (
                <text
                  x={label.x} y={label.y + 3.5}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize="10"
                  fill="#78716c"
                >
                  {h}
                </text>
              )}
            </g>
          )
        })}

        {/* Gerinne — the channel through the base */}
        <circle cx={C} cy={C} r={R_SHAFT} fill="none" stroke="#e7e5e4" strokeWidth="1.2" />

        {/* Connections */}
        {placed.map((a, i) => {
          const isOutlet = a.typ === 'A'
          const at = clockPoint(a.uhrzeit!, R_OUTER, C, C)
          const out = clockPoint(a.uhrzeit!, R_OUTER + 6, C, C)
          const stroke = isOutlet ? '#653cad' : '#78716c'
          return (
            <g key={`${a.uhrzeit}-${i}`}>
              <line
                x1={C + (at.x - C) * (R_SHAFT / R_OUTER)}
                y1={C + (at.y - C) * (R_SHAFT / R_OUTER)}
                x2={out.x} y2={out.y}
                stroke={stroke}
                strokeWidth={isOutlet ? 3.4 : 2.4}
                strokeLinecap="round"
              />
              <circle cx={at.x} cy={at.y} r={isOutlet ? 5 : 4} fill={stroke} />
            </g>
          )
        })}
      </svg>

      <figcaption className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11.5px] text-ink-dim">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand" aria-hidden />
          Ablauf
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-ink-dim" aria-hidden />
          Zulauf
        </span>
        <span>Lage nach Uhrzeit</span>
      </figcaption>
    </figure>
  )
}
