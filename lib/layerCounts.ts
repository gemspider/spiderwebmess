'use client'

// How many features each layer actually holds.
//
// The layer tree is static configuration describing what the product supports. What a
// given community's data contains is a different question, and in this snapshot the
// two disagree: every one of the 329 maintenance records has typ='Aufgabe', so both
// Wartungen sub-layers hold nothing.
//
// They are still listed. Hiding them made the tree differ from the original application's
// for no reason the operator can see, and "Wartungen is missing" is a worse message than
// "Wartungen: 0" — the second is a fact about the data, the first looks like a bug in the
// software. So an empty layer renders with its count and an inert toggle.
//
// Counts are derived from the same snapshot files the map draws from, so the sidebar
// and the map can never disagree about what exists.

import { useQuery } from '@tanstack/react-query'
import { loadJSON } from '@/lib/staticData'
import type { LayerName } from '@/lib/snapshot'

/** Layer id in the tree → how to count it in the snapshot. */
type Counter = { layer: LayerName; where?: (p: Record<string, unknown>) => boolean }

const COUNTERS: Record<string, Counter> = {
  'kanal-schaechte':   { layer: 'schaechte' },
  'kanal-haltungen':   { layer: 'haltungen' },
  'kanal-reinigungen': { layer: 'reinigungen' },

  // The four Wartung/Kontrolle sub-layers are one file split by typ and status.
  'kanal-wart-offen':  { layer: 'wartungen', where: p => p.typ === 'Wartung' && Number(p.status) === 0 },
  'kanal-wart-fertig': { layer: 'wartungen', where: p => p.typ === 'Wartung' && Number(p.status) === 1 },
  'kanal-kont-offen':  { layer: 'wartungen', where: p => p.typ === 'Aufgabe' && Number(p.status) === 0 },
  'kanal-kont-fertig': { layer: 'wartungen', where: p => p.typ === 'Aufgabe' && Number(p.status) === 1 },
}

export type LayerCounts = Record<string, number>

async function countAll(): Promise<LayerCounts> {
  const needed = Array.from(new Set(Object.values(COUNTERS).map(c => c.layer)))
  const loaded = await Promise.all(
    needed.map(async name => [name, await loadLayerRaw(name)] as const),
  )
  const byLayer = Object.fromEntries(loaded)

  const counts: LayerCounts = {}
  for (const [id, counter] of Object.entries(COUNTERS)) {
    const features = byLayer[counter.layer] ?? []
    const where = counter.where
    counts[id] = where
      ? features.filter(f => where((f.properties ?? {}) as Record<string, unknown>)).length
      : features.length
  }
  return counts
}

// loadLayer() in lib/snapshot needs a map instance for culling; counting only needs
// the raw collection, and loadJSON memoises so this shares the map's fetch.
async function loadLayerRaw(name: LayerName): Promise<GeoJSON.Feature[]> {
  try {
    const fc = await loadJSON<GeoJSON.FeatureCollection>(`/data/layers/${name}.json`)
    return fc.features ?? []
  } catch {
    return []
  }
}

/**
 * Counts per layer id. Undefined while loading, so callers show the full tree rather
 * than flashing an empty sidebar on first paint.
 */
export function useLayerCounts(): LayerCounts | undefined {
  const { data } = useQuery({
    queryKey: ['layer-counts'],
    queryFn:  countAll,
    staleTime: Infinity,
  })
  return data
}

/** True when this layer is known to hold nothing. Undefined counts mean "not yet known". */
export function isEmptyLayer(id: string, counts: LayerCounts | undefined): boolean {
  if (!counts) return false
  return id in counts && counts[id] === 0
}

/**
 * Feature count for a branch — its own if it is a leaf, the sum of its leaves if not.
 * Undefined while counts are loading, so nothing renders a misleading zero on first paint.
 */
export function branchCount(
  leafIds: string[],
  counts: LayerCounts | undefined,
): number | undefined {
  if (!counts) return undefined
  const known = leafIds.filter(id => id in counts)
  if (!known.length) return undefined
  return known.reduce((sum, id) => sum + counts[id], 0)
}
