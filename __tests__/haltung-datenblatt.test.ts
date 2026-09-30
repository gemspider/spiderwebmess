// The Haltung datasheet: its helpers, and the real snapshot behind them.
//
// Like snapshot-integration, the half that matters reads the committed data rather than a
// fixture. The failure that would actually reach a stakeholder is not a broken function —
// it is a sheet that renders a gradient from levels the extract stopped emitting, and only
// the real file catches that.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

import {
  gradient, hasProfile, splitByStation, worstClass, groupByCode, fileKind,
  fetchHaltungDatenblatt,
} from '../modules/kanal/haltungDatenblatt'
import { objectLabel } from '../modules/kanal/datenblatt'

const DATA = path.resolve(__dirname, '..', 'public', 'data')

function stubFileFetch() {
  vi.stubGlobal('fetch', async (url: string) => {
    const file = path.join(DATA, url.replace(/^\/data\//, ''))
    if (!existsSync(file)) return new Response('', { status: 404 })
    return new Response(await readFile(file, 'utf8'))
  })
}

describe('gradient', () => {
  it('falls positive when the run drops', () => {
    // 2.39 m over 38.30 m is 62.4 ‰ — the figure the sheet prints for H112026.
    expect(gradient({ sohle: 467.02 }, { sohle: 464.63 }, 38.3)).toBeCloseTo(62.4, 1)
  })

  it('goes negative when the run climbs', () => {
    // A Druckleitung out of a Pumpwerk rises, and several in this network do. The sign
    // has to survive so the sheet can label it Steigung rather than a fault.
    expect(gradient({ sohle: 402.49 }, { sohle: 436.03 }, 1028.02)).toBeLessThan(0)
  })

  it('is null when either invert or the length is missing', () => {
    expect(gradient({ sohle: 467 }, {}, 38)).toBeNull()
    expect(gradient({}, { sohle: 464 }, 38)).toBeNull()
    expect(gradient({ sohle: 467 }, { sohle: 464 }, null)).toBeNull()
    expect(gradient({ sohle: 467 }, { sohle: 464 }, 0)).toBeNull()
  })
})

describe('hasProfile', () => {
  it('needs an invert at both ends', () => {
    expect(hasProfile({ von: { sohle: 1 }, bis: { sohle: 2 } })).toBe(true)
    expect(hasProfile({ von: { sohle: 1 }, bis: {} })).toBe(false)
    expect(hasProfile(null)).toBe(false)
  })
})

describe('splitByStation', () => {
  it('orders the placed defects and keeps the rest', () => {
    const { placed, unplaced } = splitByStation([
      { lage: 30.7, code: 'BCE' },
      { code: 'BAJ' },
      { lage: 0, code: 'BCD' },
    ])
    expect(placed.map(s => s.code)).toEqual(['BCD', 'BCE'])
    expect(unplaced.map(s => s.code)).toEqual(['BAJ'])
  })

  it('keeps station 0 — it is the start node, not a missing value', () => {
    expect(splitByStation([{ lage: 0 }]).placed).toHaveLength(1)
  })
})

describe('worstClass', () => {
  it('is null when nothing was classified, which is the common case here', () => {
    expect(worstClass([{ code: 'BCD' }, { code: 'BCE' }])).toBeNull()
  })

  it('reports the worst class present', () => {
    expect(worstClass([{ skl: '1' }, { skl: '4' }, { code: 'X' }])).toBe(4)
  })
})

describe('groupByCode', () => {
  it('collects one code into one row and keeps its stations', () => {
    const g = groupByCode([
      { code: 'BCA', lage: 1.3 },
      { code: 'BCA', lage: 22.8, skl: '3' },
      { code: 'BCD', lage: 0 },
    ])
    expect(g[0].code).toBe('BCA')          // worst class first
    expect(g[0].count).toBe(2)
    expect(g[0].worst).toBe(3)
    expect(g[0].stations).toEqual([1.3, 22.8])
  })
})

describe('fileKind', () => {
  it('separates the stills from the video and the report', () => {
    expect(fileKind('ETR_2023_1352.JPG')).toBe('bild')
    expect(fileKind('H112030.mpg')).toBe('video')
    expect(fileKind('H112030.pdf')).toBe('dokument')
    expect(fileKind('weird')).toBe('datei')
  })
})

describe('the committed snapshot', () => {
  beforeAll(stubFileFetch)
  afterAll(() => vi.unstubAllGlobals())

  it('is present and covers every Haltung', async () => {
    const raw = JSON.parse(
      await readFile(path.join(DATA, 'details', 'haltung_datenblatt.json'), 'utf8'),
    )
    expect(Object.keys(raw).length).toBeGreaterThan(2800)
  })

  it('carries enough profiles for the drawing to be worth having', async () => {
    const raw = JSON.parse(
      await readFile(path.join(DATA, 'details', 'haltung_datenblatt.json'), 'utf8'),
    ) as Record<string, { von?: { sohle?: number }; bis?: { sohle?: number } }>
    const withProfile = Object.values(raw).filter(v => hasProfile(v)).length
    // 1 469 at the 2026-09-30 extraction. A floor, not the exact figure — a re-snapshot
    // may move it, but a drop to near zero means von_knoten stopped resolving.
    expect(withProfile).toBeGreaterThan(1000)
  })

  it('never emits a padded CHAR column as if it were a value', async () => {
    const raw = JSON.parse(
      await readFile(path.join(DATA, 'details', 'haltung_datenblatt.json'), 'utf8'),
    ) as Record<string, { schaeden?: { pos?: string; char?: string }[] }>
    // lage_umfang_* are CHAR(n): an absent value arrives as spaces, and concat_ws turned
    // that into '  -  '. The extract trims; this is the guard that it still does.
    for (const v of Object.values(raw)) {
      for (const s of v.schaeden ?? []) {
        expect(s.pos ?? 'x').not.toMatch(/^\s|\s$/)
        expect(s.char ?? 'x').not.toMatch(/^\s|\s$/)
      }
    }
  })

  it('has scrubbed the inspector name', async () => {
    const text = await readFile(path.join(DATA, 'details', 'haltung_datenblatt.json'), 'utf8')
    // The dump's real zustandsbewerter values. anonymise.py walks nested objects now;
    // before that it did not, and these reached the public snapshot.
    expect(text).not.toMatch(/Schilchegger|Wieser/i)
  })

  it('loads a real record through the app path', async () => {
    const raw = JSON.parse(
      await readFile(path.join(DATA, 'details', 'haltung_datenblatt.json'), 'utf8'),
    )
    const id = Object.keys(raw).find(k => raw[k].von?.sohle != null && raw[k].bis?.sohle != null)!
    const b = await fetchHaltungDatenblatt(id)
    expect(b).not.toBeNull()
    expect(hasProfile(b)).toBe(true)
  })

  it('returns null for an id that is not a Haltung', async () => {
    expect(await fetchHaltungDatenblatt('999999999')).toBeNull()
  })
})

describe('objectLabel', () => {
  it('uses the designation when there is one', () => {
    expect(objectLabel({ bezeichnung: 'FBA22023', name: 'HA029-000687' }, 'x')).toBe('FBA22023')
  })

  it('falls through to the name when the import left a placeholder', () => {
    // 1 265 of 2 892 Haltungen carry the literal string "0" here. A heading that reads
    // "0" tells the operator nothing; every one of them has a real name.
    for (const junk of ['0', '', '  ', '-', '--', null, undefined]) {
      expect(objectLabel({ bezeichnung: junk, name: 'HA054-001554' }, 'x')).toBe('HA054-001554')
    }
  })

  it('falls back to the id when neither is usable', () => {
    expect(objectLabel({ bezeichnung: '0', name: null }, '169955')).toBe('169955')
    expect(objectLabel(null, '169955')).toBe('169955')
  })
})

describe('the snapshot still has the placeholder this guards against', () => {
  it('and every affected Haltung has a name to fall back to', async () => {
    const fc = JSON.parse(
      await readFile(path.join(DATA, 'layers', 'haltungen.json'), 'utf8'),
    ) as { features: { properties: Record<string, unknown> }[] }
    const junk = fc.features.filter(f => String(f.properties.bezeichnung ?? '').trim() === '0')
    expect(junk.length).toBeGreaterThan(1000)
    expect(junk.every(f => String(f.properties.name ?? '').trim() !== '')).toBe(true)
  })
})
