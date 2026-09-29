// Snapshot access — layers, detail rows, and the id normalisation both need.
//
// Two data problems from the extraction are fixed here, at the edge, so that no
// component has to know about them :
//
//   Finding 1  kanal.schaechte does not contain most columns the UI renders —
//              the populated values live in the GeoServer view. Both sources are
//              exposed so lib/api.ts can merge them.
//   Finding 2  reinigungen_combined carries id: null on all 917 features; the
//              real key is reinigung_id. normaliseIds() repairs it on load.

import type { Feature, FeatureCollection } from 'geojson'
import { loadJSON, layerPath, detailPath } from './staticData'

/** Snapshot layer names — the four files in public/data/layers/. */
export type LayerName = 'schaechte' | 'haltungen' | 'wartungen' | 'reinigungen'

/** Detail tables — the four files in public/data/details/, one per FastAPI kanal router. */
export type DetailTable = 'schaechte' | 'haltungen' | 'wartungen' | 'reinigungen'

/**
 * GeoServer layer name → snapshot layer. Keys are the exact typeNames in
 * lib/config.ts (config.kanal.geoserverLayerOptions), so fetchWFS() can look up
 * by the same string the real WFS client used.
 */
export const GEOSERVER_LAYER_MAP: Record<string, LayerName> = {
  'WS_awvms:schaechte_app':           'schaechte',
  'WS_awvms:haltungen_app':           'haltungen',
  'WS_awvms:wartungen_tabelle_kanal': 'wartungen',
  'WS_awvms:reinigungen_combined':    'reinigungen',
}

/** featureType (registry) → detail table. Used by the static apiFetch router. */
export const FEATURE_TYPE_LAYERS: Record<string, LayerName> = {
  schacht:   'schaechte',
  haltung:   'haltungen',
  wartung:   'wartungen',
  reinigung: 'reinigungen',
}

// ─── id normalisation (Finding 2) ────────────────────────────────────────────

// Fallback id columns, in priority order, for layers whose view does not expose `id`.
//
// reinigungen_combined is one row per cleaned pipe segment: linie_id is unique across
// all 917 features, while reinigung_id identifies the cleaning *run* and repeats
// (only 20 distinct). Using reinigung_id would collapse 917 features onto 20 React
// keys and make most of them unselectable.
const ID_FALLBACKS: Partial<Record<LayerName, string[]>> = {
  reinigungen: ['linie_id', 'reinigung_id'],
}

function featureId(feature: Feature, fallbacks: string[]): string | null {
  const props = feature.properties ?? {}

  if (props.id !== null && props.id !== undefined) return String(props.id)

  for (const key of fallbacks) {
    const value = props[key]
    if (value !== null && value !== undefined) return String(value)
  }

  // GeoServer's own "layer.fid-…" id is stable within a snapshot, so it is a
  // usable last resort — a feature with no id at all would be unclickable.
  return feature.id !== undefined ? String(feature.id) : null
}

// ─── Value normalisation ─────────────────────────────────────────────────────

// GeoServer emits dates as '2025-04-16Z'. Left alone they render as "2025-04-16Z"
// in a Row and break <input type="date">, which needs exactly YYYY-MM-DD.
const GEOSERVER_DATE = /^(\d{4}-\d{2}-\d{2})(?:[TZ].*)?$/

function normaliseValue(key: string, value: unknown): unknown {
  if (typeof value !== 'string') return value

  const date = GEOSERVER_DATE.exec(value)
  if (date) return date[1]

  return value
}

// haltungen_app returns gesamtschadensklasse as a string ('4'). conditionBadge()
// in lib/utils.ts checks `typeof === 'number'`, so every Haltung badge reads
// "Unbekannt" until this is coerced. Same class of bug exists in spider-gis.
const NUMERIC_FIELDS = new Set([
  'gesamtschadensklasse',
  'sbz',
  'gbz',
  'status',
  'schachtbauzustand',
])

function normaliseProperties(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(props)) {
    let next = normaliseValue(key, value)

    if (NUMERIC_FIELDS.has(key) && typeof next === 'string' && next.trim() !== '') {
      const n = Number(next)
      if (!Number.isNaN(n)) next = n
    }

    out[key] = next
  }

  return out
}

// ─── Layer loading ───────────────────────────────────────────────────────────

// Normalising 5 918 features is cheap but not free, and React Query refetches on
// mount. Cache the processed collection, keyed by layer.
const layerCache = new Map<LayerName, Promise<FeatureCollection>>()

export function loadLayer(name: LayerName): Promise<FeatureCollection> {
  let p = layerCache.get(name)

  if (!p) {
    const fallbacks = ID_FALLBACKS[name] ?? []

    p = loadJSON<FeatureCollection>(layerPath(name)).then(fc => ({
      ...fc,
      features: fc.features.map(f => {
        const props = normaliseProperties(f.properties ?? {})
        const id = featureId(f, fallbacks)
        // Write the resolved id back onto properties: layers/kanal.tsx and
        // FeaturePanel both read f.properties.id, so this is what makes
        // reinigungen selectable at all.
        if (id !== null) props.id = Number.isNaN(Number(id)) ? id : Number(id)
        return { ...f, properties: props }
      }),
    }))

    p.catch(() => layerCache.delete(name))
    layerCache.set(name, p)
  }

  return p
}

// ─── Layer property index (id → properties) ──────────────────────────────────

const indexCache = new Map<LayerName, Promise<Map<string, Record<string, unknown>>>>()

/** id → layer properties. The populated display values behind Finding 1. */
export function loadLayerIndex(name: LayerName): Promise<Map<string, Record<string, unknown>>> {
  let p = indexCache.get(name)

  if (!p) {
    p = loadLayer(name).then(fc => {
      const index = new Map<string, Record<string, unknown>>()
      for (const f of fc.features) {
        const id = f.properties?.id
        if (id !== null && id !== undefined) {
          index.set(String(id), f.properties as Record<string, unknown>)
        }
      }
      return index
    })

    p.catch(() => indexCache.delete(name))
    indexCache.set(name, p)
  }

  return p
}

// ─── Detail rows ─────────────────────────────────────────────────────────────

export type DetailRows = Record<string, Record<string, unknown>>

const detailCache = new Map<DetailTable, Promise<DetailRows>>()

export function loadDetails(table: DetailTable): Promise<DetailRows> {
  let p = detailCache.get(table)

  if (!p) {
    p = loadJSON<DetailRows>(detailPath(table)).then(rows => {
      const out: DetailRows = {}
      for (const [id, row] of Object.entries(rows)) {
        out[id] = normaliseProperties(row)
      }
      return out
    })

    p.catch(() => detailCache.delete(table))
    detailCache.set(table, p)
  }

  return p
}

/** Geometry for one feature, from the layer — the detail files have none. */
export async function loadGeometry(name: LayerName, id: string) {
  const fc = await loadLayer(name)
  return fc.features.find(f => String(f.properties?.id) === id)?.geometry ?? null
}
