// Static apiFetch — the demo replacement for the FastAPI client.
//
// Every test resets the module registry: lib/staticData.ts and lib/snapshot.ts memoise
// at module scope (deliberately — the snapshot is 11 MB), so a stale cache would leak
// between cases.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Fixtures mirroring the real snapshot shape ──────────────────────────────

const DETAILS = {
  schaechte: {
    // Sparse, like the real base table: 109 columns, almost all null and stripped.
    '42': { id: 42, bezeichnung: 'H400012', schachtbauzustand: 3, gemeinde_nummer: 31 },
  },
  haltungen: {
    '7': { id: 7, bezeichnung: 'H320048', laenge: 56.13, gesamtschadensklasse: '4' },
  },
  wartungen: { '5': { id: 5, status: 1 } },
  // Zero overlap with the layer, exactly like the dump (Finding 2).
  reinigungen: { '900': { id: 900, projekt_id: 54 } },
}

const LAYERS = {
  schaechte: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [16.0018, 47.6926] },
        properties: {
          id: 42,
          name: 'SA054-000353',
          schacht_nr: 'H113154',
          sbz: 4,
          abstich: 3.57,
          sohle: 512.57,
          durchmesser: 1000,
          querschnitt: 'rund',
          schachtart: 'Verbandsanlage-Schacht',
          letzte_ueb: '2025-04-16Z',
          inspekteur: 'M. Gruber',
        },
      },
    ],
  },
  haltungen: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [[16, 47.6], [16.1, 47.7]] },
        properties: {
          id: 7,
          name: 'HA054-001833',
          entw_system: 'Schmutzwasser',
          breite: 250,
          letzte_ueb: '2024-05-06Z',
          gesamtschadensklasse: '4',
        },
      },
    ],
  },
  wartungen: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [16.05, 47.68] },
        properties: { id: 5, objektname: 'SA054-000431', datum: '2026-01-27Z', aufgabe: 'Sichtkontrolle', status: 1 },
      },
    ],
  },
  reinigungen: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [[16, 47.6], [16.01, 47.61]] },
        // id is null on every feature in the real view — reinigung_id is the key.
        properties: {
          id: null,
          reinigung_id: 28385,
          linie_id: 28491,
          name: 'HA054-001478',
          datum: '2026-04-01Z',
          fahrer: 'F. Steiner',
          reinigungsvorgang: 2,
          zufahrtschacht: 2,
          verschmutzungsgrad: 4,
        },
      },
    ],
  },
}

function stubSnapshotFetch() {
  const calls: string[] = []

  vi.stubGlobal('fetch', async (url: string) => {
    calls.push(url)

    const layer = /^\/data\/layers\/(\w+)\.json$/.exec(url)
    if (layer) return new Response(JSON.stringify(LAYERS[layer[1] as keyof typeof LAYERS]))

    const detail = /^\/data\/details\/(\w+)\.json$/.exec(url)
    if (detail) return new Response(JSON.stringify(DETAILS[detail[1] as keyof typeof DETAILS]))

    return new Response('', { status: 404 })
  })

  return calls
}

// jsdom is not enabled for this suite (vitest.config.ts uses environment: 'node'),
// so localStorage has to be provided for lib/demoStore.
function stubLocalStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
}

async function freshApi() {
  vi.resetModules()
  return import('../lib/api')
}

beforeEach(() => {
  stubSnapshotFetch()
  stubLocalStorage()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ─── GET ─────────────────────────────────────────────────────────────────────

describe('apiFetch GET', () => {
  it('returns a GeoJSON Feature, matching what FastAPI returned', async () => {
    const { apiFetch } = await freshApi()
    const res = await apiFetch<{ type: string; properties: Record<string, unknown> }>(
      '/kanal/schaechte/42',
    )
    expect(res.type).toBe('Feature')
    expect(res.properties.id).toBe(42)
  })

  it('merges layer view properties over the sparse base row (Finding 1)', async () => {
    const { apiFetch } = await freshApi()
    const { properties } = await apiFetch<{ properties: Record<string, unknown> }>(
      '/kanal/schaechte/42',
    )
    // From the base table only
    expect(properties.schachtbauzustand).toBe(3)
    // From the view only — absent from kanal.schaechte entirely
    expect(properties.sbz).toBe(4)
  })

  it('applies field aliases so the Info tab finds its columns', async () => {
    const { apiFetch } = await freshApi()
    const { properties } = await apiFetch<{ properties: Record<string, unknown> }>(
      '/kanal/schaechte/42',
    )
    expect(properties.tiefe).toBe(3.57)            // ← abstich
    expect(properties.soh).toBe(512.57)            // ← sohle
    expect(properties.deckel_nr).toBe('H113154')   // ← schacht_nr
    expect(properties.nennweite).toBe(1000)        // ← durchmesser
    expect(properties.schachtform).toBe('rund')    // ← querschnitt
    expect(properties.ueberprufer).toBe('M. Gruber') // ← inspekteur
    expect(properties.bezeichnung).toBe('SA054-000353') // ← name, beats the base value
  })

  it('formats display-only dates for a German audience', async () => {
    const { apiFetch } = await freshApi()
    const { properties } = await apiFetch<{ properties: Record<string, unknown> }>(
      '/kanal/schaechte/42',
    )
    expect(properties.letzte_ueberpruefung).toBe('16.04.2025')
  })

  it('keeps <input type="date"> fields as YYYY-MM-DD', async () => {
    const { apiFetch } = await freshApi()
    const { properties } = await apiFetch<{ properties: Record<string, unknown> }>(
      '/kanal/wartungen/5',
    )
    // AufgabeTab feeds this straight into an <input type="date">, which rejects
    // anything but YYYY-MM-DD — the GeoServer 'Z' suffix has to be stripped.
    expect(properties.eingabedatum).toBe('2026-01-27')
    expect(properties.beschreibung).toBe('Sichtkontrolle')
  })

  it('coerces gesamtschadensklasse to a number so the badge is not "Unbekannt"', async () => {
    const { apiFetch } = await freshApi()
    const { properties } = await apiFetch<{ properties: Record<string, unknown> }>(
      '/kanal/haltungen/7',
    )
    expect(properties.gesamtschadensklasse).toBe(4)
    expect(typeof properties.gesamtschadensklasse).toBe('number')
  })

  it('resolves reinigungen by linie_id, which the view uses instead of id', async () => {
    const { apiFetch } = await freshApi()
    const { properties } = await apiFetch<{ properties: Record<string, unknown> }>(
      '/kanal/reinigungen/28491',
    )
    expect(properties.fahrer).toBe('F. Steiner')
    expect(properties.rv).toBe(2)   // ← reinigungsvorgang
    expect(properties.zf).toBe(2)   // ← zufahrtschacht
    expect(properties.vs).toBe(4)   // ← verschmutzungsgrad
    expect(properties.letzte_reinigung).toBe('2026-04-01')
  })

  it('throws ApiError(404) for an unknown id', async () => {
    const { apiFetch, ApiError } = await freshApi()
    const err = await apiFetch('/kanal/schaechte/999999').catch(e => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(404)
  })

  it('throws ApiError(404) for a table not in the snapshot', async () => {
    const { apiFetch, ApiError } = await freshApi()
    const err = await apiFetch('/wasser/leitungen/1').catch(e => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(404)
  })

  it('loads each snapshot file at most once', async () => {
    vi.unstubAllGlobals()
    const calls = stubSnapshotFetch()
    stubLocalStorage()

    const { apiFetch } = await freshApi()
    await apiFetch('/kanal/schaechte/42')
    await apiFetch('/kanal/schaechte/42')

    expect(calls.filter(u => u.includes('details/schaechte'))).toHaveLength(1)
    expect(calls.filter(u => u.includes('layers/schaechte'))).toHaveLength(1)
  })
})

// ─── Writes ──────────────────────────────────────────────────────────────────

describe('apiFetch writes', () => {
  it('PUT persists to the demo overlay and shows up on the next read', async () => {
    const { apiFetch } = await freshApi()

    await apiFetch('/kanal/schaechte/42', {
      method: 'PUT',
      body: JSON.stringify({ id: 42, tiefe: 9.99 }),
    })

    const { properties } = await apiFetch<{ properties: Record<string, unknown> }>(
      '/kanal/schaechte/42',
    )
    // The overlay is applied after aliasing, so it wins over the aliased abstich.
    expect(properties.tiefe).toBe(9.99)
  })

  it('PUT on an unknown id is a 404, not a silent success', async () => {
    const { apiFetch, ApiError } = await freshApi()
    const err = await apiFetch('/kanal/schaechte/999999', {
      method: 'PUT',
      body: JSON.stringify({ tiefe: 1 }),
    }).catch(e => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(404)
  })

  it('POST returns a negative id so it cannot collide with the snapshot', async () => {
    const { apiFetch } = await freshApi()
    const res = await apiFetch<{ id: number }>('/kanal/schaechte', {
      method: 'POST',
      body: JSON.stringify({ bezeichnung: 'Neu' }),
    })
    expect(res.id).toBeLessThan(0)
  })

  it('DELETE hides the row from later reads', async () => {
    const { apiFetch, ApiError } = await freshApi()

    await apiFetch('/kanal/schaechte/42', { method: 'DELETE' })

    const err = await apiFetch('/kanal/schaechte/42').catch(e => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(404)
  })

  it('does not blank a real value when a form sends undefined', async () => {
    const { apiFetch } = await freshApi()

    // The tab components send `value || undefined` for empty inputs.
    await apiFetch('/kanal/schaechte/42', {
      method: 'PUT',
      body: JSON.stringify({ id: 42, tiefe: undefined, soh: 1.5 }),
    })

    const { properties } = await apiFetch<{ properties: Record<string, unknown> }>(
      '/kanal/schaechte/42',
    )
    expect(properties.tiefe).toBe(3.57)  // untouched
    expect(properties.soh).toBe(1.5)     // updated
  })
})
