// Datenblatt data — the Haltung datasheet.
//
// The Schacht sheet describes one object. A Haltung sheet describes a *run*: two
// manholes, the pipe between them, and every defect placed at its station along it.
// scripts/extract-haltung-datenblatt.sh snapshots the three tables that hold it:
//
//   von / bis     kanal.schaechte, joined on haltungen.von_knoten / bis_knoten, which
//                 store the Schacht *name* rather than an id
//   schaeden      kanal.schaeden via kanal.inspektionen.haltung_id — `lage` is the
//                 station in metres, which is the x-axis of the drawing
//   inspektion    the most recent survey: who, when, which direction
//
// Two properties of this dump decide what the sheet can honestly show.
//
// haltungen.hoehe_start, hoehe_ende and gefaelle are NULL for all 2 892 rows, so the
// profile cannot come from the Haltung. It is derived from the two end manholes'
// invert levels, and the gradient is computed rather than read — see gradient() below.
// 1 469 runs have an invert at both ends; the rest can only be drawn schematically.
//
// Only 407 of 4 588 defects carry a Schadensklasse. `skl` is therefore optional and
// stays undefined rather than defaulting: an unclassified defect is not a class-1
// defect, and drawing it green would invent an assessment nobody made.

import { loadJSON } from '@/lib/staticData'

/** One end of the run — a manhole, with the levels the profile is drawn from. */
export interface Knoten {
  /** Schacht name, e.g. "SA054-000407". This is the join key, not the id. */
  name?:    string
  id?:      number
  /** The Schacht's own designation, as printed on the sheet. */
  nummer?:  string
  /** Invert level (Sohlhöhe) in metres above sea level. */
  sohle?:   number
  /** Cover level (Deckeloberkante). */
  dok?:     number
  /** Depth from cover to invert. */
  abstich?: number
}

/** A defect, located at a station along the pipe. */
export interface HaltungSchaden {
  /** Station in metres from the start node. */
  lage?:  number
  /** ISYBAU / EN 13508-2 main code, verbatim — there is no decode table. */
  code?:  string
  char?:  string
  menge?: string
  /** Clock range, e.g. "09-03" — same convention as the Schacht connection dial. */
  pos?:   string
  /** Schadensklasse 1–5, where the survey assigned one. */
  skl?:   string
  text?:  string
}

export interface HaltungInspektion {
  datum?:     string
  bewerter?:  string
  firma?:     string
  richtung?:  string
  gsk?:       string
  anmerkung?: string
}

export interface HaltungDatenblatt {
  von?:        Knoten
  bis?:        Knoten
  lookups?:    Record<string, string>
  schaeden?:   HaltungSchaden[]
  fotos?:      { id: number; name: string }[]
  inspektion?: HaltungInspektion
}

type File = Record<string, HaltungDatenblatt>

export function loadHaltungDatenblattFile(): Promise<File> {
  return loadJSON<File>('/data/details/haltung_datenblatt.json')
}

export async function fetchHaltungDatenblatt(
  id: number | string,
): Promise<HaltungDatenblatt | null> {
  try {
    const all = await loadHaltungDatenblattFile()
    return all[String(id)] ?? null
  } catch {
    return null
  }
}

// ─── Derived values ──────────────────────────────────────────────────────────

/**
 * Gradient in per mille, from the two invert levels and the length.
 *
 * Computed, not read: haltungen.gefaelle is NULL throughout this dump, and the map
 * view reports -1 as a sentinel. Positive means the pipe falls from start to end,
 * which is the direction it should flow.
 *
 * Reported in ‰ because that is the unit a sewer gradient is specified in — a 3 m drop
 * over 42 m is 71‰, and the same figure as 7.1% loses the resolution the trade works in.
 */
export function gradient(von?: Knoten, bis?: Knoten, laenge?: number | null): number | null {
  if (von?.sohle == null || bis?.sohle == null) return null
  if (!laenge || laenge <= 0) return null
  return ((von.sohle - bis.sohle) / laenge) * 1000
}

/** True when both ends carry an invert level, so a real profile can be drawn. */
export function hasProfile(b?: HaltungDatenblatt | null): boolean {
  return b?.von?.sohle != null && b?.bis?.sohle != null
}

/**
 * Defects with a usable station, in order along the pipe.
 *
 * A defect with no station cannot be placed on the drawing; it is still real, so it is
 * returned separately rather than dropped.
 */
export function splitByStation(schaeden: HaltungSchaden[] = []) {
  const placed: HaltungSchaden[] = []
  const unplaced: HaltungSchaden[] = []
  for (const s of schaeden) {
    if (typeof s.lage === 'number' && Number.isFinite(s.lage)) placed.push(s)
    else unplaced.push(s)
  }
  placed.sort((a, b) => (a.lage as number) - (b.lage as number))
  return { placed, unplaced }
}

/** Worst Schadensklasse present, or null when the survey classified nothing. */
export function worstClass(schaeden: HaltungSchaden[] = []): number | null {
  let worst = 0
  for (const s of schaeden) {
    const n = Number(s.skl)
    if (Number.isFinite(n) && n >= 1 && n <= 5 && n > worst) worst = n
  }
  return worst || null
}

/**
 * Groups defects by code for the summary list, keeping each one's stations so a code
 * that recurs along the run reads as "four places", not "four rows".
 */
export function groupByCode(schaeden: HaltungSchaden[] = []) {
  const byCode = new Map<string, {
    code: string; count: number; worst: number; stations: number[]; texts: string[]
  }>()

  for (const s of schaeden) {
    const code = s.code || '—'
    const entry = byCode.get(code) ?? { code, count: 0, worst: 0, stations: [], texts: [] }
    entry.count += 1
    const n = Number(s.skl)
    if (Number.isFinite(n) && n > entry.worst) entry.worst = n
    if (typeof s.lage === 'number') entry.stations.push(s.lage)
    const detail = [s.char, s.menge, s.text].filter(Boolean).join(' · ')
    if (detail && !entry.texts.includes(detail)) entry.texts.push(detail)
    byCode.set(code, entry)
  }

  return Array.from(byCode.values()).sort((a, b) => b.worst - a.worst || b.count - a.count)
}

/**
 * Which references are actually images.
 *
 * externedateien mixes the inspection video (.mpg) and its report (.pdf) in with the
 * stills, and none of the binary data is in the database anyway. The sheet says what
 * each reference is instead of showing a broken tile for all of them.
 */
export function fileKind(name: string): 'bild' | 'video' | 'dokument' | 'datei' {
  const ext = name.toLowerCase().split('.').pop() ?? ''
  if (['jpg', 'jpeg', 'png', 'bmp', 'gif', 'tif', 'tiff', 'webp'].includes(ext)) return 'bild'
  if (['mpg', 'mpeg', 'mp4', 'avi', 'mov', 'wmv', 'mkv'].includes(ext)) return 'video'
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'].includes(ext)) return 'dokument'
  return 'datei'
}
