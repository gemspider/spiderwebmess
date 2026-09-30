// Cartographic palettes for the condition scale.
//
// SBZ, GBZ, FFK and Schadensklasse all run 1–5, so they share one ramp — showing the
// same scale in two colour schemes on one map would be worse than any single choice.
//
// The ISYBAU ramp is the default because it is what the existing application draws and
// what the printed reports use. It is also, measurably, not usable by everyone:
// simulating deuteranopia (~8% of men) and measuring CIE76 distance between classes,
// two of the five come out below the threshold at which colours are distinguishable at
// all — "sehr gut" and "schlecht" become the same colour. See minDeltaE.
//
// So the alternatives are not decoration. `minDeltaE` is the worst pair under
// deuteranope simulation; anything under ~12 means two classes collapse.
//
// These figures are not shown in the interface — the picker shows the ramps themselves,
// which is what a user chooses between. They are kept because scripts/check-palettes.mjs
// recomputes them on every test run, so the claim that Viridis is safe and ISYBAU is not
// cannot quietly stop being true.

export interface Ramp {
  id:          string
  name:        string
  /** Five colours, class 1 → 5. */
  colors:      [string, string, string, string, string]
  /** Worst-case perceptual distance between any two classes for a deuteranope. */
  minDeltaE:   number
  cvdSafe:     boolean
  /** True for the scheme the standard prescribes. */
  isStandard?: boolean
}

export const RAMPS: Ramp[] = [
  {
    id: 'isybau',
    name: 'ISYBAU',
    // Sampled from the production application's own legend and map strokes, not from
    // the nominal standard values (#4ce600, #0070ff, #ffff00, #ffaa00, #e60000). It
    // renders a softened set, and the point of this ramp is that a map here looks like
    // a map there — an operator comparing the two should not see two different greens.
    colors: ['#7ce345', '#2f6ef6', '#ffff55', '#f3ae3d', '#ea3323'],
    minDeltaE: 7.1,
    cvdSafe: false,
    isStandard: true,
  },
  {
    id: 'rdylgn',
    name: 'Rot–Gelb–Grün',
    // The classic condition ramp.
    colors: ['#1a9641', '#a6d96a', '#ffffbf', '#fdae61', '#d7191c'],
    minDeltaE: 6.7,
    cvdSafe: false,
  },
  {
    id: 'ylorrd',
    name: 'Gelb–Orange–Rot',
    // Sequential — damage rises with the warmth of the colour.
    colors: ['#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026'],
    minDeltaE: 10.9,
    cvdSafe: false,
  },
  {
    id: 'viridis',
    name: 'Viridis',
    // Perceptually uniform, and the one to reach for when colour has to carry the
    // meaning on its own.
    colors: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'],
    minDeltaE: 23.7,
    cvdSafe: true,
  },
  {
    id: 'cividis',
    name: 'Cividis',
    // Designed for colour vision deficiency, and holds up in print.
    colors: ['#00204d', '#31446b', '#666970', '#a09268', '#ffea46'],
    minDeltaE: 12.8,
    cvdSafe: true,
  },
]

// The figures above are measured, not quoted — see scripts/check-palettes.mjs, which
// recomputes them and fails if one drifts. Cividis sits just over the line at 12.8;
// Viridis is the one to reach for when colour has to carry the meaning alone.

export const DEFAULT_RAMP = 'isybau'

export function getRamp(id: string): Ramp {
  return RAMPS.find(r => r.id === id) ?? RAMPS[0]
}

/**
 * The ISYBAU levels as a lookup. One definition: this ramp used to be copied into
 * registry.ts, datenblatt.ts, config.ts and the Tailwind config, which is five places
 * to miss when the colours are corrected — and exactly what happened.
 */
export const ISYBAU_LEVELS: Record<number, string> = rampLevels(0)

function rampLevels(index: number): Record<number, string> {
  const { colors } = RAMPS[index]
  return { 1: colors[0], 2: colors[1], 3: colors[2], 4: colors[3], 5: colors[4] }
}

/** Class 1–5 → colour, for the given ramp. */
export function rampColors(id: string): Record<number, string> {
  const { colors } = getRamp(id)
  return { 1: colors[0], 2: colors[1], 3: colors[2], 4: colors[3], 5: colors[4] }
}

// ─── Single-symbol colours ───────────────────────────────────────────────────
// For layers that are not classified — Reinigungen, and each Wartung/Kontrolle
// sub-layer. Qualitative, chosen to stay apart from one another and from the
// condition ramps; drawn from the Refactoring UI palettes.

export const SWATCHES: { name: string; value: string }[] = [
  { name: 'Blau',     value: '#0967d2' },
  { name: 'Petrol',   value: '#0e7c86' },
  { name: 'Grün',     value: '#2f9e44' },
  { name: 'Limette',  value: '#8ab800' },
  { name: 'Gelb',     value: '#f0b429' },
  { name: 'Orange',   value: '#f35627' },
  { name: 'Rot',      value: '#cf1124' },
  { name: 'Magenta',  value: '#da127d' },
  { name: 'Violett',  value: '#653cad' },
  { name: 'Indigo',   value: '#4c63b6' },
  { name: 'Braun',    value: '#8a5a15' },
  { name: 'Grau',     value: '#627d98' },
]

/**
 * Colour for a feature the survey never classified — and the palette for changing it.
 *
 * Not a detail: 4 352 of 5 918 Schächte have no SBZ, so this is three quarters of what
 * is drawn, and it was the one colour with no control. Neutral by default, because
 * "not surveyed" is the absence of an assessment and must not read as a good one.
 *
 * The qualitative grey is dropped from this picker — two greys would be a choice
 * without a difference — and the neutral leads, so the standard shows as a selected
 * swatch instead of only being reachable through a separate button.
 */
export const NO_CLASS = '#94a3b8'

export const NO_CLASS_SWATCHES: { name: string; value: string }[] = [
  { name: 'Neutral (Standard)', value: NO_CLASS },
  ...SWATCHES.filter(s => s.name !== 'Grau'),
]
