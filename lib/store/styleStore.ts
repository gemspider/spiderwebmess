/**
 * Layer appearance, chosen by the user and remembered.
 *
 * One ramp for the whole condition scale rather than one per layer: SBZ, GBZ, FFK and
 * Schadensklasse are all the same 1–5 concept, and showing it in two colour schemes on
 * one map would be worse than any single choice.
 *
 * The chosen ramp themes everything — map, chips, legend, datasheet. The alternative,
 * theming only the map, leaves a green chip beside a purple dot for the same class,
 * and someone who switched away from ISYBAU did so on purpose.
 *
 * Persisted to localStorage so a preference survives a reload. Reading it is wrapped:
 * a private window throws rather than returning null.
 */

import { create } from 'zustand'
import { DEFAULT_RAMP, NO_CLASS, rampColors } from '@/lib/palettes'

const KEY = 'spiderweb:layer-style'

/** Size multiplier, 1 = the layer's designed size. */
export const SIZE_STEPS = [0.7, 0.85, 1, 1.25, 1.5, 2] as const
export const DEFAULT_SIZE = 1

/**
 * Colour for a feature the survey never classified.
 *
 * Not a detail: 4 352 of 5 918 Schächte have no SBZ, so this is three quarters of what
 * is on screen, and it was the one colour with no control. Neutral by default, because
 * "not yet surveyed" is the absence of an assessment and must not read as a good one —
 * but a user comparing coverage wants to pick it out, which is why it is adjustable.
 */
export const DEFAULT_NO_CLASS = NO_CLASS

export interface StyleState {
  /** Ramp id for the 1–5 condition scale. */
  rampId: string
  /** Per-layer overrides for layers that are not classified. */
  layerColor: Record<string, string>
  /** Per-layer size multiplier for point radius, line weight and pin size. */
  layerSize: Record<string, number>
  /** Per-layer colour for features outside the 1–5 scale. */
  layerNoClass: Record<string, string>

  setRamp: (id: string) => void
  setLayerColor: (layerId: string, color: string) => void
  setLayerSize: (layerId: string, size: number) => void
  setLayerNoClass: (layerId: string, color: string) => void
  /** Clears every override for one layer and returns the ramp to the standard. */
  resetLayer: (layerId: string) => void
  resetAll: () => void
  /** True when anything anywhere differs from the defaults. */
  isCustomised: () => boolean
}

interface Persisted {
  rampId?: string
  layerColor?: Record<string, string>
  layerSize?: Record<string, number>
  layerNoClass?: Record<string, string>
}

function read(): Persisted {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Persisted
  } catch {
    return {}
  }
}

function write(state: Persisted) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Private mode or a full quota — the choice just does not outlive the session.
  }
}

export const useStyleStore = create<StyleState>((set, get) => ({
  // Initial state is the default, not the stored value: this store is created while
  // the module loads, which during the static export happens in Node where there is no
  // localStorage. Hydration happens in hydrateStyle() after mount.
  rampId: DEFAULT_RAMP,
  layerColor: {},
  layerSize: {},
  layerNoClass: {},

  setRamp: id => {
    set({ rampId: id })
    write({ ...snapshot(get()), rampId: id })
  },

  setLayerColor: (layerId, color) => {
    const layerColor = { ...get().layerColor, [layerId]: color }
    set({ layerColor })
    write({ ...snapshot(get()), layerColor })
  },

  setLayerSize: (layerId, size) => {
    const layerSize = { ...get().layerSize, [layerId]: size }
    set({ layerSize })
    write({ ...snapshot(get()), layerSize })
  },

  setLayerNoClass: (layerId, color) => {
    const layerNoClass = { ...get().layerNoClass, [layerId]: color }
    set({ layerNoClass })
    write({ ...snapshot(get()), layerNoClass })
  },

  resetLayer: layerId => {
    const layerColor = { ...get().layerColor }
    const layerSize = { ...get().layerSize }
    const layerNoClass = { ...get().layerNoClass }
    delete layerColor[layerId]
    delete layerSize[layerId]
    delete layerNoClass[layerId]
    set({ layerColor, layerSize, layerNoClass })
    write({ ...snapshot(get()), layerColor, layerSize, layerNoClass })
  },

  resetAll: () => {
    const clean = { rampId: DEFAULT_RAMP, layerColor: {}, layerSize: {}, layerNoClass: {} }
    set(clean)
    write(clean)
  },

  isCustomised: () => {
    const s = get()
    return s.rampId !== DEFAULT_RAMP
      || Object.keys(s.layerColor).length > 0
      || Object.keys(s.layerSize).length > 0
      || Object.keys(s.layerNoClass).length > 0
  },
}))

function snapshot(s: StyleState): Persisted {
  return {
    rampId: s.rampId,
    layerColor: s.layerColor,
    layerSize: s.layerSize,
    layerNoClass: s.layerNoClass,
  }
}

/** Applies the stored preference. Called once on the client, after mount. */
export function hydrateStyle() {
  const stored = read()
  if (stored.rampId || stored.layerColor || stored.layerSize || stored.layerNoClass) {
    useStyleStore.setState({
      rampId: stored.rampId ?? DEFAULT_RAMP,
      layerColor: stored.layerColor ?? {},
      layerSize: stored.layerSize ?? {},
      layerNoClass: stored.layerNoClass ?? {},
    })
  }
}

/** Condition colours for the active ramp. Use in React. */
export function useLevelColors(): Record<number, string> {
  return rampColors(useStyleStore(s => s.rampId))
}

/**
 * Same, outside React — Leaflet callbacks and plain helpers run where hooks cannot.
 * Reads the live store, so it stays in step with the hook.
 */
export function getLevelColors(): Record<number, string> {
  return rampColors(useStyleStore.getState().rampId)
}

/** A layer's colour, honouring an override. */
export function useLayerColor(layerId: string, fallback: string): string {
  return useStyleStore(s => s.layerColor[layerId]) ?? fallback
}

/** A layer's size multiplier. 1 means the size the layer was designed at. */
export function useLayerSize(layerId: string): number {
  return useStyleStore(s => s.layerSize[layerId]) ?? DEFAULT_SIZE
}

/** A layer's colour for features with no condition class. */
export function useLayerNoClass(layerId: string): string {
  return useStyleStore(s => s.layerNoClass[layerId]) ?? DEFAULT_NO_CLASS
}
