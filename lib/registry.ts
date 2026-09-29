/**
 * Module Registry
 *
 * Central registry for all GIS domain modules (kanal, wasser, brücke, …).
 *
 * To add a new module:
 *   1. Create modules/<name>/index.ts exporting a ModuleConfig
 *   2. Import and add it to the MODULES array in modules/index.ts
 *   Everything else (sidebar layer tree, FeaturePanel tabs, map layers) picks
 *   it up automatically via the helpers exported here.
 */

import type { ComponentType } from 'react'

// ─── Symbol types ────────────────────────────────────────────────────────────

export type SymbolType = 'line' | 'dashed-line' | 'circle' | 'pin'

// ─── Layer tree (drives LayerSidebar) ────────────────────────────────────────

export interface LegendItem {
  label: string
  color: string
}

export interface LayerConfig {
  id:             string
  label:          string
  color:          string
  defaultVisible: boolean
  symbol?:        SymbolType
  legendType?:    'dot' | 'bar'
  legendItems?:   LegendItem[]
  children?:      LayerConfig[]
}

// ─── Feature tab types ───────────────────────────────────────────────────────

export type FeatureTab =
  | 'info'
  | 'aufgabe'
  | 'beobachtungen'
  | 'reinigung'
  | 'bericht'

// FormProps is intentionally generic — each module's InfoTab receives the raw
// API row so it can read whatever DB columns it needs.
export interface FormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feature: Record<string, any>
  moduleId: string
  featureType: string
}

// ─── Feature type config ─────────────────────────────────────────────────────

export interface FeatureTypeConfig {
  label:           string
  icon:            string
  symbolType:      SymbolType
  /** Base color for the feature — condition field overrides this per-feature */
  color:           string
  /**
   * DB column that holds the condition level (1–5).
   * e.g. 'gesamtschadensklasse' for Haltung, 'sbz' for Schacht.
   * When set, the map and badges color the feature by this value.
   */
  conditionField?: string
  /** FastAPI domain path segment — e.g. 'schaechte' → GET /kanal/schaechte/{id} */
  apiTable:        string
  /** GeoServer layer name — used by fetchWFS */
  geoserverLayer:  string
  tabs: Partial<Record<FeatureTab, ComponentType<FormProps>>>
}

// ─── Module manifest ─────────────────────────────────────────────────────────

export interface ModuleConfig {
  id:          string       // 'kanal' | 'wasser' | 'bruecke' …
  label:       string
  icon:        string
  color:       string
  /** Sent as X-Fachschale header on all API calls for this module */
  fachschale:  string
  layerTree:   LayerConfig[]
  featureTypes: Record<string, FeatureTypeConfig>
}

// ─── Registry helpers ────────────────────────────────────────────────────────
// These are populated by modules/index.ts at import time.

let _modules: ModuleConfig[] = []

export function registerModules(modules: ModuleConfig[]) {
  _modules = modules
}

export function getModules(): ModuleConfig[] {
  return _modules
}

export function getModule(id: string): ModuleConfig | undefined {
  return _modules.find(m => m.id === id)
}

export function getFeatureTypeConfig(
  moduleId: string,
  featureType: string,
): FeatureTypeConfig | undefined {
  return getModule(moduleId)?.featureTypes[featureType]
}

export function getForm(
  moduleId: string,
  featureType: string,
  tab: FeatureTab,
): ComponentType<FormProps> | null {
  return getFeatureTypeConfig(moduleId, featureType)?.tabs[tab] ?? null
}

export function getTabsForFeature(
  moduleId: string,
  featureType: string,
): { id: FeatureTab; label: string }[] {
  const TAB_LABELS: Record<FeatureTab, string> = {
    info:          'Übersicht',
    aufgabe:       'Aufgabe',
    beobachtungen: 'Beobachtungen',
    reinigung:     'Reinigung',
    bericht:       'Bericht',
  }
  const registered = getFeatureTypeConfig(moduleId, featureType)?.tabs ?? {}
  return (Object.keys(TAB_LABELS) as FeatureTab[])
    .filter(id => id in registered)
    .map(id => ({ id, label: TAB_LABELS[id] }))
}

/** Returns the merged layer tree across all active modules */
export function getFullLayerTree(): LayerConfig[] {
  return _modules.flatMap(m => m.layerTree)
}

// ISYBAU condition level colors — exact values from App2 kanalLayer.js (SBZ_COLORS / GSK_COLORS)
export const LEVEL_COLORS: Record<number, string> = {
  1: '#4ce600',  // green  — sehr gut
  2: '#0070ff',  // blue   — gut
  3: '#ffff00',  // yellow — mittel
  4: '#ffaa00',  // orange — schlecht
  5: '#e60000',  // red    — sehr schlecht
}
