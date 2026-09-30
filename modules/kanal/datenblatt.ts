// Datenblatt data — the Schacht datasheet.
//
// The map layer and the base table cover the header. Everything that makes the sheet
// worth opening lives in other tables and is snapshotted into details/datenblatt.json
// by scripts/extract-datenblatt.sh:
//
//   Anschlüsse   kanal.zuablaeufe      `uhrzeit` is the 1–12 clock position that places
//                                       each inlet/outlet on the connection dial
//   Schäden      kanal.schaeden        ISYBAU damage records, reached via inspektionen
//   Inspektion   kanal.inspektionen    when the manhole was last surveyed
//   Fotos        kanal.externedateien  filenames only — see below
//   lookups      resolved *_id labels  ("400KN", "Betonsegmente", …)
//
// Coverage is uneven because the survey is: all 5 918 Schächte have resolved labels,
// but only ~15% have Anschlüsse, Schäden or an inspection. The UI has to read well
// when a section is empty, which is the normal case rather than the exception.

import { loadJSON } from '@/lib/staticData'
import { ISYBAU_LEVELS } from '@/lib/palettes'

/** A damage record. `skl` is the ISYBAU Schadensklasse 1–5. */
export interface Schaden {
  nr?:   number
  skl?:  string
  code?: string
  char?: string
  lage?: string
  text?: string
}

/** An inlet or outlet. `typ` is 'Z' (Zulauf) or 'A' (Ablauf). */
export interface Anschluss {
  typ?:          string
  uhrzeit?:      number
  abstich?:      number
  material?:     string
  hoehe?:        number
  dicke?:        number
  hauptgerinne?: boolean
  anmerkung?:    string
}

/**
 * A photo record. `name` is the original filename; there is no URL because the image
 * data is not in the database — only the reference is. The original application shows
 * placeholder tiles here for the same reason.
 */
export interface Foto {
  id:   number
  name: string
}

export interface Datenblatt {
  lookups?:     Record<string, string>
  anschluesse?: Anschluss[]
  schaeden?:    Schaden[]
  inspektion?:  { datum?: string; anmerkung?: string }
  fotos?:       Foto[]
}

type DatenblattFile = Record<string, Datenblatt>

export function loadDatenblattFile(): Promise<DatenblattFile> {
  return loadJSON<DatenblattFile>('/data/details/datenblatt.json')
}

export async function fetchDatenblatt(id: number | string): Promise<Datenblatt | null> {
  try {
    const all = await loadDatenblattFile()
    return all[String(id)] ?? null
  } catch {
    return null
  }
}

// ─── Presentation helpers ────────────────────────────────────────────────────

/**
 * ISYBAU condition levels 1–5 — the standard's own colours.
 *
 * This is the fallback and the printed-report reference. What the interface actually
 * draws comes from the active ramp (lib/store/styleStore), which the user can change.
 */
export { ISYBAU_LEVELS as LEVEL_HEX } from '@/lib/palettes'

export const LEVEL_LABEL: Record<number, string> = {
  1: 'sehr gut',
  2: 'gut',
  3: 'mittel',
  4: 'schlecht',
  5: 'sehr schlecht',
}

const INK = '#1c1917'
const PAPER = '#ffffff'

/** WCAG relative luminance of a #rrggbb colour. */
function luminance(hex: string): number {
  const channel = (i: number) => {
    const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2)
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Foreground for a condition chip, chosen by measured contrast rather than a hardcoded
 * list — the ISYBAU ramp spans bright yellow to deep red, and guessing gets it wrong.
 * It did: level 1 against white is under 2:1, effectively invisible, and was
 * shipping that way.
 *
 * Levels 2 and 5 top out around 4.4:1 and 4.8:1 with white; nothing reaches AA on
 * level 2 either way, which is why the chip always carries its number and a title as
 * well as its colour.
 */
export function levelInk(level: number, bg?: string): string {
  const color = bg ?? ISYBAU_LEVELS[level]
  if (!color) return INK
  return contrast(color, INK) >= contrast(color, PAPER) ? INK : PAPER
}

/**
 * What to call an object in a heading.
 *
 * `bezeichnung` is the designation an operator reads — except on 1 265 of the 2 892
 * Haltungen, where the import left the literal string "0". Every one of those has a
 * real `name` (HA054-…), so a heading falls through to it rather than announcing the
 * object as "0". The Info list still shows the stored field; this is only for titles,
 * where the job is to identify the thing you are looking at.
 */
export function objectLabel(row: Record<string, unknown> | null | undefined, fallback: string): string {
  const placeholder = (v: unknown) => {
    const t = v == null ? '' : String(v).trim()
    return t === '' || t === '0' || t === '-' || t === '--'
  }
  if (!placeholder(row?.bezeichnung)) return String(row!.bezeichnung)
  if (!placeholder(row?.name)) return String(row!.name)
  return fallback
}

export function toLevel(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null
}

/** 'Z' → Zulauf, 'A' → Ablauf. Anything else is passed through as-is. */
export function anschlussLabel(typ?: string): string {
  if (typ === 'Z') return 'Zulauf'
  if (typ === 'A') return 'Ablauf'
  return typ || '—'
}

/**
 * Clock position → a point on the dial. 12 is at the top and the hours run clockwise,
 * which is the opposite direction to the maths convention, hence the negated angle.
 */
export function clockPoint(uhrzeit: number, radius: number, cx = 0, cy = 0) {
  const angle = ((uhrzeit % 12) / 12) * Math.PI * 2 - Math.PI / 2
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius }
}

/** Worst damage class present, which is what the header badge reports. */
export function worstSkl(schaeden?: Schaden[]): number | null {
  if (!schaeden?.length) return null
  let worst = 0
  for (const s of schaeden) {
    const n = toLevel(s.skl)
    if (n && n > worst) worst = n
  }
  return worst || null
}

/** Groups damage by ISYBAU code so a manhole with 14 records reads as a few problems. */
export function groupSchaeden(schaeden: Schaden[]) {
  const byCode = new Map<string, { code: string; worst: number; count: number; texts: string[] }>()

  for (const s of schaeden) {
    const code = s.code || '—'
    const level = toLevel(s.skl) ?? 0
    const entry = byCode.get(code) ?? { code, worst: 0, count: 0, texts: [] }
    entry.count += 1
    if (level > entry.worst) entry.worst = level
    if (s.text && !entry.texts.includes(s.text)) entry.texts.push(s.text)
    byCode.set(code, entry)
  }

  return Array.from(byCode.values()).sort((a, b) => b.worst - a.worst || b.count - a.count)
}
