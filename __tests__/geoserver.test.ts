// Static fetchWFS — must keep the exact contract components/map/layers/kanal.tsx
// relies on, since that file is an unmodified copy from spider-gis.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const SCHAECHTE = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [16, 47.7] }, properties: { id: 1, sbz: 2 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [16.1, 47.7] }, properties: { id: 2, sbz: 5 } },
  ],
}

const REINIGUNGEN = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[16, 47.6], [16.01, 47.61]] },
      properties: { id: null, reinigung_id: 28385, linie_id: 28491 },
    },
    {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[16.1, 47.6], [16.11, 47.61]] },
      properties: { id: null, reinigung_id: 27002, linie_id: 27111 },
    },
  ],
}

beforeEach(() => {
  vi.stubGlobal('fetch', async (url: string) => {
    if (url === '/data/layers/schaechte.json') return new Response(JSON.stringify(SCHAECHTE))
    if (url === '/data/layers/reinigungen.json') return new Response(JSON.stringify(REINIGUNGEN))
    return new Response('', { status: 404 })
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function freshWFS() {
  vi.resetModules()
  return import('../lib/geoserver')
}

describe('fetchWFS', () => {
  it('serves a snapshot layer for a known GeoServer typeName', async () => {
    const { fetchWFS } = await freshWFS()
    const fc = await fetchWFS('WS_awvms:schaechte_app')
    expect(fc?.features).toHaveLength(2)
  })

  it('returns null for an unknown typeName instead of throwing', async () => {
    // The wasser typeNames in lib/config.ts land here — those views are not in the
    // dump (Finding 4). layers/kanal.tsx checks `!data`, so null is the right answer.
    const { fetchWFS } = await freshWFS()
    expect(await fetchWFS('WS_awvms:app_leitungen_info')).toBeNull()
  })

  it('returns null for an empty typeName', async () => {
    const { fetchWFS } = await freshWFS()
    expect(await fetchWFS('')).toBeNull()
  })

  it('returns null rather than throwing when the snapshot file is missing', async () => {
    vi.stubGlobal('fetch', async () => new Response('', { status: 404 }))
    const { fetchWFS } = await freshWFS()
    expect(await fetchWFS('WS_awvms:schaechte_app')).toBeNull()
  })

  it('filters by featureID when one is given', async () => {
    const { fetchWFS } = await freshWFS()
    const fc = await fetchWFS('WS_awvms:schaechte_app', undefined, '2')
    expect(fc?.features).toHaveLength(1)
    expect(fc?.features[0].properties?.sbz).toBe(5)
  })

  it('ignores bbox — the snapshot is always the whole layer', async () => {
    const { fetchWFS } = await freshWFS()
    const fc = await fetchWFS('WS_awvms:schaechte_app', '16,47,17,48')
    expect(fc?.features).toHaveLength(2)
  })

  it('backfills reinigungen ids from linie_id, not reinigung_id (Finding 2)', async () => {
    // Every feature ships with id null, so without a backfill they collide on one
    // React key and the detail lookup can never match. linie_id is the per-segment
    // key; reinigung_id identifies the cleaning run and repeats across segments.
    const { fetchWFS } = await freshWFS()
    const fc = await fetchWFS('WS_awvms:reinigungen_combined')
    expect(fc?.features.map(f => f.properties?.id)).toEqual([28491, 27111])
  })

  it('fetches each layer once across repeated calls', async () => {
    const calls: string[] = []
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(url)
      return new Response(JSON.stringify(SCHAECHTE))
    })

    const { fetchWFS } = await freshWFS()
    await fetchWFS('WS_awvms:schaechte_app')
    await fetchWFS('WS_awvms:schaechte_app')
    await fetchWFS('WS_awvms:schaechte_app', undefined, '1')

    // The four Wartung sub-layers in layers/kanal.tsx all mount at once; without
    // memoisation a cold start would refetch megabytes.
    expect(calls).toHaveLength(1)
  })
})
