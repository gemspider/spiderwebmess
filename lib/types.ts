// GeoJSON types returned by FastAPI endpoints.
// Properties shapes mirror the PostgreSQL column sets (via ColumnRegistry).

export interface GeoJSONFeature<T> {
  type: 'Feature'
  properties: T
  geometry: GeoJSONGeometry | null
}

export interface GeoJSONFeatureCollection<T> {
  type: 'FeatureCollection'
  features: GeoJSONFeature<T>[]
}

export type GeoJSONGeometry =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'LineString'; coordinates: [number, number][] }
  | { type: 'Polygon'; coordinates: [number, number][][] }
  | { type: 'MultiPoint'; coordinates: [number, number][] }
  | { type: 'MultiLineString'; coordinates: [number, number][][] }
  | { type: 'MultiPolygon'; coordinates: [number, number][][][] }

// ── GeoServer WFS feature property shapes (used by map layer components) ──────

export interface SchachtProperties {
  id: number
  schacht_nr?: string | null
  bezeichnung?: string | null
  gemeinde_nummer?: number
  sbz?: number | null
  Schachtart?: string | null
  lage?: string | null
  baujahr?: number | null
  material?: string | null
  tiefe?: number | null
  nennweite?: number | null
  [key: string]: unknown
}

export interface HaltungProperties {
  id: number
  bezeichnung?: string | null
  gemeinde_nummer?: number
  gesamtschadensklasse?: string | null
  leitungsart?: string | null
  laenge?: number | null
  material?: string | null
  [key: string]: unknown
}

export interface WartungProperties {
  id: number
  objektname?: string | null
  wartungstyp?: string | null
  status?: number
  beschreibung?: string | null
  eingabedatum?: string | null
  [key: string]: unknown
}

// Simplified flat row type (used where geometry is not needed)
export interface Schacht {
  id: number
  bezeichnung?: string
  gemeinde_nummer?: number
  [key: string]: unknown
}
