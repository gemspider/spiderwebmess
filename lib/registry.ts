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
  | 'allgemein'
  | 'info'
  | 'aufgabe'
  | 'beobachtungen'
  | 'folge'
  | 'bilder'
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

/** A lucide-react icon, or anything with the same call shape. */
export type IconComponent = ComponentType<{ className?: string }>

// ─── Feature type config ─────────────────────────────────────────────────────

export interface FeatureTypeConfig {
  label:           string
  /**
   * Lucide component, not an emoji. An emoji renders in whatever the platform ships —
   * Apple's 🔔 is a gold cartoon bell — so it cannot be given the feature's colour, cannot
   * be sized against the type scale, and looks different on every device.
   */
  icon:            IconComponent
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
  icon:        IconComponent
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
    // Maintenance tasks open on 'Allgemein'; network objects open on 'Übersicht'.
    // Two ids rather than one relabelled tab, because the order below decides which
    // tab a feature opens on.
    allgemein:     'Allgemein',
    info:          'Übersicht',
    aufgabe:       'Aufgabe',
    beobachtungen: 'Beobachtungen',
    // The original application's task dialog names these two; they are separate tabs
    // because the follow-up is a different question from the observation itself.
    folge:         'Folgetätigkeiten',
    bilder:        'Galerie',
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

// ISYBAU condition level colours. One definition, in lib/palettes — this was a fourth
// copy of the same five hex values, and it is why correcting them missed places.
export { ISYBAU_LEVELS as LEVEL_COLORS } from '@/lib/palettes'
