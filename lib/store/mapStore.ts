/**
 * Zustand store — client-only UI state.
 *
 * Server state (fetched feature data) lives in TanStack Query, NOT here.
 * This store only holds what the user is doing in the UI.
 */

import { create } from 'zustand'
import type { FeatureTab } from '@/lib/registry'
import type { BaseTile } from '@/lib/tiles'

export type LayerVisibility = Record<string, boolean>

interface MapStore {
  // ── Feature selection ────────────────────────────────────────────────────
  selectedFeatureId:   string | null
  selectedModule:      string | null    // 'kanal' | 'wasser' | …
  selectedFeatureType: string | null    // 'haltung' | 'schacht' | …
  selectFeature: (
    id:   string | null,
    module?: string,
    type?: string,
  ) => void

  // ── Feature panel tab ────────────────────────────────────────────────────
  activeTab:    FeatureTab
  setActiveTab: (tab: FeatureTab) => void

  // ── Sidebar ──────────────────────────────────────────────────────────────
  sidebarOpen:   boolean
  toggleSidebar: () => void

  // ── Active module (TopBar switcher) ─────────────────────────────────────
  activeModule:    string
  setActiveModule: (id: string) => void

  // ── Base tile (mutually exclusive, radio-select) ─────────────────────────
  baseTile:    BaseTile
  setBaseTile: (tile: BaseTile) => void

  // ── Layer visibility ─────────────────────────────────────────────────────
  layerVisibility: LayerVisibility
  toggleLayer:     (id: string) => void
  setLayerVisible: (id: string, visible: boolean) => void
  setManyVisible:  (ids: string[], visible: boolean) => void

  // ── Map fly-to (set by FeaturePanel locate button, consumed by MapInner) ─
  flyTo:    [number, number] | null
  setFlyTo: (pos: [number, number] | null) => void

  // ── Search ───────────────────────────────────────────────────────────────
  searchQuery:    string
  setSearchQuery: (q: string) => void
}

export const useMapStore = create<MapStore>((set, get) => ({
  // Feature selection
  selectedFeatureId:   null,
  selectedModule:      null,
  selectedFeatureType: null,
  selectFeature: (id, module, type) => set({
    selectedFeatureId:   id,
    selectedModule:      module ?? get().selectedModule,
    selectedFeatureType: type   ?? get().selectedFeatureType,
    activeTab:           'info',
  }),

  // Panel tab
  activeTab:    'info',
  setActiveTab: tab => set({ activeTab: tab }),

  // Sidebar
  sidebarOpen:   true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

  // Active module
  activeModule:    'kanal',
  setActiveModule: id => set({ activeModule: id }),

  // Base tile
  baseTile:    'orthofoto',
  setBaseTile: tile => set({ baseTile: tile }),

  // Layer visibility — defaults to layer.defaultVisible (see LayerSidebar)
  layerVisibility: {},
  toggleLayer:     id => set(s => ({
    layerVisibility: { ...s.layerVisibility, [id]: !(s.layerVisibility[id] ?? true) },
  })),
  setLayerVisible: (id, visible) => set(s => ({
    layerVisibility: { ...s.layerVisibility, [id]: visible },
  })),
  setManyVisible: (ids: string[], visible: boolean) => set(s => {
    const patch: Record<string, boolean> = {}
    for (const id of ids) patch[id] = visible
    return { layerVisibility: { ...s.layerVisibility, ...patch } }
  }),

  // Fly-to
  flyTo:    null,
  setFlyTo: pos => set({ flyTo: pos }),

  // Search
  searchQuery:    '',
  setSearchQuery: q => set({ searchQuery: q }),
}))
