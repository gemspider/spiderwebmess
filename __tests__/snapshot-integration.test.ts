// Integration check against the real committed snapshot in web/public/data/.
//
// The other suites use fixtures. This one reads the actual 11 MB of data, because
// the failure mode that matters for a demo is not "the code is wrong" — it is "the
// data does not contain what the panel renders", which fixtures cannot catch.
//
// It runs in CI and locally with no Docker: the snapshot is committed.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

import { loadManifest } from '../lib/staticData'
import { loadLayer } from '../lib/snapshot'
import { fetchWFS } from '../lib/geoserver'
import { apiFetch } from '../lib/api'
import { conditionBadge } from '../lib/utils'
import { config } from '../lib/config'

const DATA = path.resolve(__dirname, '..', 'public', 'data')

// Serve web/public/data/ over the fetch the library code expects.
function stubFileFetch() {
  vi.stubGlobal('fetch', async (url: string) => {
    const file = path.join(DATA, url.replace(/^\/data\//, ''))
    if (!existsSync(file)) return new Response('', { status: 404 })
    return new Response(await readFile(file, 'utf8'))
  })
}

function stubLocalStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
}

beforeAll(() => {
  stubFileFetch()
  stubLocalStorage()
})

afterAll(() => {
  vi.unstubAllGlobals()
})

// ─── Snapshot integrity ──────────────────────────────────────────────────────

describe('snapshot', () => {
  it('is anonymised — this data is served from a public URL', async () => {
    const manifest = await loadManifest()
    //. An ANONYMISE=0 snapshot must never ship.
    expect(manifest.anonymised).toBe(1)
  })

  it('has every layer the kanal module asks for', async () => {

    for (const typeName of Object.values(config.kanal.geoserverLayerOptions)) {
      // reinigungen_punkt is only used by the unmounted KanalMapManager.
      if (typeName.endsWith('reinigungen_punkt')) continue
      const fc = await fetchWFS(typeName)
      expect(fc, `missing snapshot for ${typeName}`).not.toBeNull()
      expect(fc!.features.length, `${typeName} is empty`).toBeGreaterThan(0)
    }
  })

  it('gives every feature a usable id', async () => {

    for (const layer of ['schaechte', 'haltungen', 'wartungen', 'reinigungen'] as const) {
      const fc = await loadLayer(layer)
      const ids = fc.features.map(f => f.properties?.id)
      expect(ids.every(id => id !== null && id !== undefined), `${layer} has null ids`).toBe(true)
      // Distinct ids matter: layers/kanal.tsx uses them as React keys, and
      // reinigungen_combined ships with id:null on all 917 features (Finding 2).
      expect(new Set(ids).size, `${layer} has duplicate ids`).toBe(ids.length)
    }
  })

  it('has geometry in WGS84 inside the snapshot bounding box', async () => {
    const fc = await loadLayer('schaechte')

    const [lng, lat] = (fc.features[0].geometry as { coordinates: number[] }).coordinates
    // The dump is Baden / Lower Austria, not Walchsee — if this box ever fails, the
    // map centre in .env.local.example is wrong too.
    expect(lng).toBeGreaterThan(15.9)
    expect(lng).toBeLessThan(16.1)
    expect(lat).toBeGreaterThan(47.6)
    expect(lat).toBeLessThan(47.8)
  })
})

// ─── The thing a stakeholder actually sees ───────────────────────────────────

describe('feature panel data', () => {

  async function rowFor(table: string, id: unknown) {
    const res = await apiFetch<{ properties: Record<string, unknown> }>(`/kanal/${table}/${id}`)
    return res.properties
  }

  function populated(row: Record<string, unknown>, fields: string[]): string[] {
    return fields.filter(f => row[f] !== null && row[f] !== undefined && row[f] !== '')
  }

  /** How many of `fields` are filled, for every feature in the layer. */
  async function coverage(
    table: string,
    layer: 'schaechte' | 'haltungen' | 'wartungen' | 'reinigungen',
    fields: string[],
    sample = 400,
  ): Promise<number[]> {
    const fc = await loadLayer(layer)
    const step = Math.max(1, Math.floor(fc.features.length / sample))
    const counts: number[] = []

    for (let i = 0; i < fc.features.length; i += step) {
      const row = await rowFor(table, fc.features[i].properties!.id)
      counts.push(populated(row, fields).length)
    }
    return counts
  }

  const SCHACHT_FIELDS = [
    'bezeichnung', 'deckel_nr', 'material', 'nennweite', 'tiefe', 'soh',
    'abdecktyp', 'schachtform', 'letzte_ueberpruefung', 'ueberprufer',
  ]
  const HALTUNG_FIELDS = [
    'bezeichnung', 'name', 'strang', 'entwasserungssystem', 'material',
    'nennweite', 'laenge', 'abwasserart', 'letzte_ueberpruefung',
  ]

  it('fills the Schacht card wherever the dump has survey data', async () => {
    const counts = await coverage('schaechte', 'schaechte', SCHACHT_FIELDS)

    // The dump is sparse: only ~35% of Schächte were ever surveyed, so the median
    // feature genuinely has 2 of 10 fields (bezeichnung + abdecktyp, both 100%).
    // What this asserts is that the view merge works where data exists — against the
    // base table alone the best case would be 2 (Finding 1).
    expect(Math.max(...counts), 'no Schacht has a full card').toBeGreaterThanOrEqual(9)
    expect(counts.filter(n => n >= 6).length / counts.length).toBeGreaterThan(0.2)
    // bezeichnung comes from the view via an override alias and is universal.
    expect(Math.min(...counts), 'some Schacht has an empty card').toBeGreaterThanOrEqual(2)
  })

  it('fills the Haltung card for the typical feature', async () => {
    const counts = await coverage('haltungen', 'haltungen', HALTUNG_FIELDS)
    const sorted = [...counts].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]

    // Haltungen are well surveyed — a stakeholder clicking at random sees a full card.
    expect(median, 'typical Haltung card is thin').toBeGreaterThanOrEqual(6)
  })

  it('labels every Schacht and Haltung with its operator identifier', async () => {
    const schacht = await rowFor('schaechte', (await loadLayer('schaechte')).features[0].properties!.id)
    const haltung = await rowFor('haltungen', (await loadLayer('haltungen')).features[0].properties!.id)

    // FeaturePanel's title falls back to the raw id when bezeichnung is empty, which
    // reads as a bug in a demo.
    expect(schacht.bezeichnung).toMatch(/^SA054-/)
    expect(haltung.bezeichnung).toBeTruthy()
  })

  it('gives Haltungen a numeric GSK so the condition badge renders', async () => {

    const fc = await loadLayer('haltungen')
    const withGsk = fc.features.find(f => f.properties?.gesamtschadensklasse)
    expect(withGsk).toBeDefined()

    const { properties } = await apiFetch<{ properties: Record<string, unknown> }>(
      `/kanal/haltungen/${withGsk!.properties!.id}`,
    )

    expect(typeof properties.gesamtschadensklasse).toBe('number')
    // The view returns '4' as a string; conditionBadge checks typeof === 'number',
    // so without coercion every Haltung badge reads "Unbekannt".
    expect(conditionBadge(properties.gesamtschadensklasse as number).label).not.toBe('Unbekannt')
  })

  it('feeds AufgabeTab a date input can accept', async () => {
    const fc = await loadLayer('wartungen')
    const withDate = fc.features.find(f => f.properties?.datum)
    expect(withDate, 'no Wartung has a date').toBeDefined()

    const row = await rowFor('wartungen', withDate!.properties!.id)
    // <input type="date"> silently shows blank for anything but YYYY-MM-DD, so the
    // GeoServer 'Z' suffix has to be gone by the time AufgabeTab sees it.
    expect(String(row.eingabedatum)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(populated(row, ['bezeichnung', 'status']).length).toBeGreaterThanOrEqual(1)
  })

  it('resolves a completed Reinigung despite zero id overlap with its base table', async () => {
    const fc = await loadLayer('reinigungen')
    // Only ~6% of the 917 segments have actually been cleaned; the rest are planned
    // and legitimately have no driver or rating yet.
    const done = fc.features.find(f => f.properties?.fahrer)
    expect(done, 'no completed Reinigung in the snapshot').toBeDefined()

    const row = await rowFor('reinigungen', done!.properties!.id)
    const filled = populated(row, ['fahrer', 'rv', 'zf', 'vs', 'letzte_reinigung'])
    expect(filled.length, `only ${filled.join(', ')} populated`).toBeGreaterThanOrEqual(4)
  })

  it('leaves no raw GeoServer date suffix in a rendered row', async () => {
    const fc = await loadLayer('schaechte')
    const surveyed = fc.features.find(f => f.properties?.letzte_ueb)
    const row = await rowFor('schaechte', surveyed!.properties!.id)

    const raw = Object.entries(row).filter(
      ([, v]) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}Z$/.test(v),
    )
    expect(raw, `unformatted dates: ${raw.map(([k]) => k).join(', ')}`).toHaveLength(0)
    expect(row.letzte_ueberpruefung).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
  })
})

// ─── Privacy ─────────────────────────────────────────────────────────────────

describe('privacy', () => {
  it('has no real personal names left in the person fields', async () => {

    // The placeholder pools from scripts/anonymise.py. Anything outside them means
    // the scrub missed a field or the snapshot was regenerated with ANONYMISE=0.
    const allowed = new Set([
      'M. Gruber', 'A. Huber', 'T. Wagner', 'S. Berger', 'K. Moser',
      'Vermessung Ost', 'Vermessung West', 'Vermessung Nord',
      'j.bauer', 'm.lang', 'c.wolf',
      'F. Steiner', 'R. Maier', 'L. Fuchs', 'D. Winkler',
      'P. Hofer', 'N. Reiter', 'B. Gross',
      'Kanalservice Nord GmbH', 'Rohrtechnik Süd GmbH', 'Eigenregie',
      'WN-1234A', 'WN-5678B', 'NK-9012C', 'BN-3456D',
    ])
    const personFields = ['inspekteur', 'vermesser', 'erfuellt_von', 'fahrer', 'helfer', 'firma', 'kennzeichen']

    for (const layer of ['schaechte', 'haltungen', 'wartungen', 'reinigungen'] as const) {
      const fc = await loadLayer(layer)
      for (const f of fc.features) {
        for (const field of personFields) {
          const value = f.properties?.[field]
          if (typeof value === 'string' && value.trim() !== '') {
            expect(allowed.has(value), `${layer}.${field} = "${value}" is not a placeholder`).toBe(true)
          }
        }
      }
    }
  })
})
