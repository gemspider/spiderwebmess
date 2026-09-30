'use client'

// Längsschnitt — the section along the run, from start manhole to end manhole.
//
// Drawn horizontally rather than down the page as the printed report does. That layout
// is a paper artefact: a Haltung is 20–100 m long and 2–3 m deep, so on a phone held
// upright the run has to lie across the screen or it is a column of nothing. Station
// increases left to right, which is also the direction the inspection camera travelled.
//
// Two scales, and they are not the same. Station is metric along x. Elevation is
// exaggerated on y, because a 3 m fall over 42 m drawn true is a flat line — the drop
// that matters would be invisible. The exaggeration factor is printed under the drawing
// rather than hidden, so nobody reads a slope off it.
//
// When the end manholes carry no invert level — and 1 423 of 2 892 runs do not — there
// is no profile to draw. The component then draws the run flat and says so, instead of
// inventing a gradient. The defects are still placed at their real stations, which is
// most of what the drawing is for.

import { levelInk } from '@/modules/kanal/datenblatt'
import { useLevelColors } from '@/lib/store/styleStore'
import type { Knoten, HaltungSchaden } from '@/modules/kanal/haltungDatenblatt'

const W = 640
const H_REAL = 260
// The schematic has no elevations to spread over, so the same box would be half empty.
const H_FLAT = 196
const PAD_L = 54      // room for the elevation axis
const PAD_R = 34
const TOP = 34          // room for the cover line and its label
const BOTTOM_PAD = 46   // room for the station axis
// The lowest invert would otherwise sit on the axis, and its SOH label on top of the
// station ticks. Reserving a band keeps every elevation label inside the drawing.
const LABEL_BAND = 34

interface Props {
  von?:      Knoten
  bis?:      Knoten
  laenge?:   number | null
  /** Nominal width in mm, drawn to scale where the profile is real. */
  dn?:       number | null
  schaeden?: HaltungSchaden[]
}

const fmt = (v: number, d = 2) => v.toFixed(d)

export function PipeSection({ von, bis, laenge, dn, schaeden = [] }: Props) {
  const levels = useLevelColors()

  const sohleVon = typeof von?.sohle === 'number' ? von.sohle : null
  const sohleBis = typeof bis?.sohle === 'number' ? bis.sohle : null
  const dokVon   = typeof von?.dok === 'number' ? von.dok : null
  const dokBis   = typeof bis?.dok === 'number' ? bis.dok : null
  const real     = sohleVon != null && sohleBis != null

  // Length only sets the x scale; a run with no recorded length still draws, with the
  // stations spread over whatever the furthest defect reaches.
  const maxStation = schaeden.reduce(
    (m, s) => (typeof s.lage === 'number' && s.lage > m ? s.lage : m), 0,
  )
  const span = Math.max(laenge ?? 0, maxStation, 1)

  const H = real ? H_REAL : H_FLAT
  const BOTTOM = H - BOTTOM_PAD
  const plotW = W - PAD_L - PAD_R
  // The label band only has to exist where elevation labels do.
  const plotH = BOTTOM - TOP - (real ? LABEL_BAND : 0)
  const xFor = (station: number) => PAD_L + (Math.min(station, span) / span) * plotW

  // Elevation window: the full depth of both manholes, padded so nothing touches an edge.
  const highs = [dokVon, dokBis, sohleVon, sohleBis].filter((v): v is number => v != null)
  const hi = highs.length ? Math.max(...highs) : 1
  const lo = highs.length ? Math.min(...highs) : 0
  const range = Math.max(hi - lo, 0.5)
  const yFor = (level: number) => TOP + ((hi - level) / range) * plotH

  // Vertical exaggeration, stated rather than hidden. Metres per pixel on each axis.
  const exaggeration = real && laenge
    ? (plotH / range) / (plotW / span)
    : null

  // Flat fallback: the pipe sits two thirds down, the manholes get a nominal depth.
  const yPipeVon = real ? yFor(sohleVon!) : TOP + plotH * 0.68
  const yPipeBis = real ? yFor(sohleBis!) : TOP + plotH * 0.68
  const yDokVon  = real && dokVon != null ? yFor(dokVon) : TOP + plotH * 0.06
  const yDokBis  = real && dokBis != null ? yFor(dokBis) : TOP + plotH * 0.06

  const xVon = xFor(0)
  const xBis = xFor(span)

  // Pipe wall thickness. Drawn to the y scale where the scale is real, so a DN 600 in a
  // shallow run reads as the large pipe it is; clamped so it never swallows the drawing.
  const dnPx = real && dn
    ? Math.max(5, Math.min(26, (dn / 1000 / range) * plotH))
    : 9

  const levelAt = (skl?: string) => {
    const n = Number(skl)
    return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null
  }

  const placed = schaeden.filter(s => typeof s.lage === 'number')

  // Two defects a metre apart would overprint their labels, so only every other one
  // gets a label once they crowd; the marker itself always stays.
  const MIN_LABEL_GAP = 46
  let lastLabelX = -Infinity

  const shaftW = 17

  // Labels point inward — anchored outward they run off the ends, and padding wide
  // enough to hold them would leave the run squeezed into the middle.
  const nodes = [
    { x: xVon, yTop: yDokVon, yBot: yPipeVon, k: von, anchor: 'start' as const, dx: 14 },
    { x: xBis, yTop: yDokBis, yBot: yPipeBis, k: bis, anchor: 'end' as const, dx: -14 },
  ]

  return (
    <figure className="m-0">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full min-w-[420px]"
          role="img"
          aria-label={
            real
              ? `Längsschnitt über ${fmt(span, 1)} Meter, Sohle ${fmt(sohleVon!)} bis ${fmt(sohleBis!)} Meter, ${placed.length} Schäden`
              : `Schematischer Längsschnitt über ${fmt(span, 1)} Meter, ${placed.length} Schäden, Höhen nicht erfasst`
          }
        >
          {/* Ground surface, tying the two cover levels together. */}
          <path
            d={`M${PAD_L} ${yDokVon} L${xBis} ${yDokBis}`}
            fill="none" stroke="#a8a29e" strokeWidth="1.4" strokeDasharray="1 3"
          />

          {/* The two manholes, each from its cover down to its invert. Labels come
              later, after the pipe, or the pipe paints straight through them. */}
          {nodes.map((m, i) => (
            <g key={i}>
              <rect
                x={m.x - shaftW / 2} y={m.yTop} width={shaftW} height={Math.max(4, m.yBot - m.yTop)}
                fill="var(--brand-light, #eaf2fb)" stroke="var(--brand, #0f4c81)" strokeWidth="1.5"
              />
              <line
                x1={m.x - shaftW / 2 - 4} y1={m.yTop} x2={m.x + shaftW / 2 + 4} y2={m.yTop}
                stroke="var(--brand, #0f4c81)" strokeWidth="3" strokeLinecap="round"
              />
            </g>
          ))}

          {/* The pipe: a band of the nominal bore, falling from start invert to end. */}
          <path
            d={`M${xVon} ${yPipeVon - dnPx} L${xBis} ${yPipeBis - dnPx}
                L${xBis} ${yPipeBis} L${xVon} ${yPipeVon} Z`}
            fill="var(--brand-light, #eaf2fb)" stroke="var(--brand, #0f4c81)" strokeWidth="1.4"
          />
          {/* Invert, drawn heavier — it is the line the levels refer to. */}
          <line
            x1={xVon} y1={yPipeVon} x2={xBis} y2={yPipeBis}
            stroke="var(--brand, #0f4c81)" strokeWidth="2"
          />

          {/* Flow direction, along the pipe. */}
          <g>
            <line
              x1={xVon + plotW * 0.42} y1={(yPipeVon + yPipeBis) / 2 - dnPx / 2}
              x2={xVon + plotW * 0.58} y2={(yPipeVon + yPipeBis) / 2 - dnPx / 2}
              stroke="var(--brand, #0f4c81)" strokeWidth="1.2" opacity="0.7"
            />
            <path
              d={`M${xVon + plotW * 0.58} ${(yPipeVon + yPipeBis) / 2 - dnPx / 2}
                  l-6 -3 l0 6 z`}
              fill="var(--brand, #0f4c81)" opacity="0.7"
            />
          </g>

          {/* Defects at their stations. */}
          {placed.map((s, i) => {
            const x = xFor(s.lage as number)
            const t = span > 0 ? Math.min(1, (s.lage as number) / span) : 0
            const yPipe = yPipeVon + (yPipeBis - yPipeVon) * t
            const level = levelAt(s.skl)
            const colour = level ? levels[level] : '#a8a29e'
            const label = x - lastLabelX >= MIN_LABEL_GAP
            if (label) lastLabelX = x

            return (
              <g key={i}>
                <line
                  x1={x} y1={yPipe - dnPx - 4} x2={x} y2={yPipe + 4}
                  stroke={colour} strokeWidth="2"
                />
                {/* Class number inside the marker where there is one — colour alone
                    cannot carry it, and most defects here have no class at all. */}
                {level ? (
                  <>
                    <circle cx={x} cy={yPipe - dnPx - 12} r="8" fill={colour} stroke="#fff" strokeWidth="1.5" />
                    <text
                      x={x} y={yPipe - dnPx - 8.6} textAnchor="middle"
                      className="font-mono" fontSize="10" fontWeight="700" fill={levelInk(level, colour)}
                    >
                      {level}
                    </text>
                  </>
                ) : (
                  <circle cx={x} cy={yPipe - dnPx - 12} r="4.5" fill="#fff" stroke={colour} strokeWidth="2" />
                )}
                {label && (
                  <text
                    x={Math.min(W - PAD_R, Math.max(PAD_L, x))} y={yPipe - dnPx - 24}
                    textAnchor="middle" className="font-mono" fontSize="9.5" fill="#57534e"
                    stroke="#fff" strokeWidth="3" paintOrder="stroke"
                  >
                    {s.code ?? '?'}
                  </text>
                )}
              </g>
            )
          })}

          {/* Manhole labels, last so nothing is painted over them. */}
          {nodes.map((m, i) => (
            <g key={i}>
              <text
                x={m.x + m.dx} y={m.yTop - 9}
                textAnchor={m.anchor} className="font-mono" fontSize="10.5" fill="#44403c"
                stroke="#fff" strokeWidth="3.5" paintOrder="stroke"
              >
                {m.k?.nummer || m.k?.name || '—'}
              </text>
              {/* Only against a real profile. On the schematic fallback the pipe is drawn
                  at an arbitrary height, and an elevation printed beside it would read as
                  the level of that line. The figure is still in the table below. */}
              {real && m.k?.sohle != null && (
                <text
                  x={m.x + m.dx} y={m.yBot + dnPx + 13}
                  textAnchor={m.anchor} className="font-mono" fontSize="9.5" fill="#78716c"
                  stroke="#fff" strokeWidth="3.5" paintOrder="stroke"
                >
                  SOH {fmt(m.k.sohle)}
                </text>
              )}
              {/* An abstich of 0.00 is the absence of a measurement, not a manhole flush
                  with its own invert, so it is left off rather than printed as a depth. */}
              {real && m.k?.abstich != null && m.k.abstich > 0 && (
                <text
                  x={m.x + m.dx} y={m.yBot + dnPx + 25}
                  textAnchor={m.anchor} className="font-mono" fontSize="9.5" fill="#a8a29e"
                  stroke="#fff" strokeWidth="3.5" paintOrder="stroke"
                >
                  T {fmt(m.k.abstich)}
                </text>
              )}
            </g>
          ))}

          {/* Station axis. */}
          <line x1={xVon} y1={BOTTOM + 14} x2={xBis} y2={BOTTOM + 14} stroke="#d6d3d1" strokeWidth="1" />
          {[0, 0.25, 0.5, 0.75, 1].map(f => (
            <g key={f}>
              <line
                x1={PAD_L + f * plotW} y1={BOTTOM + 11} x2={PAD_L + f * plotW} y2={BOTTOM + 17}
                stroke="#d6d3d1" strokeWidth="1"
              />
              <text
                x={PAD_L + f * plotW} y={BOTTOM + 29} textAnchor="middle"
                className="font-mono" fontSize="9.5" fill="#a8a29e"
              >
                {fmt(f * span, f === 0 || f === 1 ? 1 : 0)}
              </text>
            </g>
          ))}
          <text x={W - 4} y={BOTTOM + 29} textAnchor="end" className="font-mono" fontSize="9.5" fill="#a8a29e">
            m
          </text>

          {/* Elevation axis, only where the numbers are real. */}
          {real && (
            <>
              <text x="4" y={yFor(hi) + 3} className="font-mono" fontSize="9.5" fill="#a8a29e">
                {fmt(hi)}
              </text>
              <text x="4" y={yFor(lo) + 3} className="font-mono" fontSize="9.5" fill="#a8a29e">
                {fmt(lo)}
              </text>
              <text x="4" y="14" className="font-mono" fontSize="9" fill="#a8a29e">
                m ü.A.
              </text>
            </>
          )}
        </svg>
      </div>

      <figcaption className="mt-2 text-center text-[11.5px] text-ink-dim">
        {real ? (
          <>
            Längsschnitt · {fmt(span, 1)} m
            {exaggeration && exaggeration > 1.2 && (
              <> · Höhen {exaggeration.toFixed(0)}-fach überhöht</>
            )}
          </>
        ) : (
          <>Längsschnitt schematisch · {fmt(span, 1)} m · Sohlhöhen nicht erfasst</>
        )}
      </figcaption>
    </figure>
  )
}
