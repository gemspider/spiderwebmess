'use client'

// Viewport culling for the map layers.
//
// The snapshot holds 5 918 Schächte and 2 892 Haltungen, and the layers render every
// one of them as a React element regardless of where the map is looking. That is
// ~8 800 component instances and the same number of Leaflet layer objects, which is
// what makes the first paint and every pan expensive on a phone — canvas rendering
// fixed the DOM cost, not the reconciliation cost.
//
// At a normal working zoom only a few hundred features are actually on screen, so
// filtering to the padded viewport cuts the work by an order of magnitude while
// changing nothing a user sees.
//
// Bounds are computed once per feature when the data loads, then reused on every pan —
// an O(n) intersect test over 8 800 cheap objects is nothing next to reconciling 8 800
// React elements.

import { useEffect, useMemo, useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Feature, FeatureCollection, LineString, Point } from 'geojson'

// Re-exported so the layers keep one import; the rule itself is Leaflet-free.
export { zoomWeight, LABEL_ZOOM } from '@/lib/mapScale'

/** Padding around the viewport, as a fraction of its size. */
const VIEWPORT_PADDING = 0.3

/**
 * Minimum zoom at which a layer renders at all.
 *
 * The original application gates layers this way (`config.customZoom`) and the mounted
 * KanalLayers implementation dropped it — which is why zooming out used to try to draw
 * several thousand Schächte at once.
 *
 * Schächte deviate from the original's 17: this build opens at zoom 15, and a first
 * view with no manholes on it would look empty. 15 keeps the default view intact while
 * still cutting out the pathological wide-zoom case.
 */
export const MIN_ZOOM = {
  schaechte:   15,
  haltungen:   13,
  reinigungen: 13,
  wartungen:   10,
} as const

interface Indexed {
  feature: Feature
  bounds: L.LatLngBounds
}

function featureBounds(feature: Feature): L.LatLngBounds | null {
  const geometry = feature.geometry
  if (!geometry) return null

  if (geometry.type === 'Point') {
    const [lng, lat] = (geometry as Point).coordinates
    return L.latLngBounds([lat, lng], [lat, lng])
  }

  if (geometry.type === 'LineString') {
    const coords = (geometry as LineString).coordinates
    if (!coords.length) return null
    return L.latLngBounds(coords.map(([lng, lat]) => [lat, lng] as [number, number]))
  }

  return null
}

/**
 * The map's current zoom, updated on zoomend.
 *
 * Its own hook because the line weights need it and the culling already tracked it
 * privately — two components watching the same event beats one of them guessing.
 */
export function useZoom(): number {
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())

  useEffect(() => {
    const update = () => setZoom(map.getZoom())
    update()
    map.on('zoomend', update)
    return () => { map.off('zoomend', update) }
  }, [map])

  return zoom
}

/**
 * Returns only the features intersecting the current viewport (plus padding).
 * Recomputed on moveend/zoomend, not on every frame of a drag.
 */
export function useVisibleFeatures(
  data: FeatureCollection | null | undefined,
  minZoom = 0,
): Feature[] {
  const map = useMap()

  const indexed = useMemo<Indexed[]>(() => {
    if (!data?.features?.length) return []
    const out: Indexed[] = []
    for (const feature of data.features) {
      const bounds = featureBounds(feature)
      if (bounds) out.push({ feature, bounds })
    }
    return out
  }, [data])

  const [viewport, setViewport] = useState<L.LatLngBounds | null>(null)
  const [zoom, setZoom] = useState(() => map.getZoom())

  useEffect(() => {
    const update = () => {
      setViewport(map.getBounds().pad(VIEWPORT_PADDING))
      setZoom(map.getZoom())
    }
    update()
    // moveend covers pan and the tail of a zoom; zoomend catches zoom without pan.
    map.on('moveend', update)
    map.on('zoomend', update)
    return () => {
      map.off('moveend', update)
      map.off('zoomend', update)
    }
  }, [map])

  return useMemo(() => {
    if (!viewport || zoom < minZoom) return []
    const out: Feature[] = []
    for (const item of indexed) {
      if (viewport.intersects(item.bounds)) out.push(item.feature)
    }
    return out
  }, [indexed, viewport, zoom, minZoom])
}
