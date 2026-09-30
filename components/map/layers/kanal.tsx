'use client'
/**
 * Kanal map layers — renders GeoServer WFS features on the Leaflet map.
 *
 * Each layer:
 *   1. Fetches GeoJSON from GeoServer via React Query (cached, shared)
 *   2. Renders Leaflet elements colored by condition field (GSK / SBZ)
 *   3. On click: opens the shared NetworkPopup; 'Details öffnen' there selects
 *      the feature and opens the panel
 *
 * When real GeoServer data is available, replace the placeholder useQuery
 * calls with fetchWFS() from lib/geoserver.ts.
 */

import { useQuery } from '@tanstack/react-query'
import { CircleMarker, Polyline, Marker } from 'react-leaflet'
import React from 'react'
import { useMapStore } from '@/lib/store/mapStore'
import { useLevelColors, useLayerColor, useLayerSize, useLayerNoClass } from '@/lib/store/styleStore'
import { pinIcon, labelIcon } from '@/lib/mapSymbols'
import { fetchWFS } from '@/lib/geoserver'
import { config } from '@/lib/config'
import MarkerClusterGroup from '../MarkerClusterGroup'
import { WartungPopup, type WartungProps } from '../WartungPopup'
import { useVisibleFeatures, useZoom, zoomWeight, LABEL_ZOOM, MIN_ZOOM } from './useVisibleFeatures'
import type { FeatureCollection, LineString, Point } from 'geojson'

const LAYERS = config.kanal.geoserverLayerOptions

// ─── Helper: GSK / SBZ → color ────────────────────────────────────────────────
// Colours come from the active ramp, so switching palette repaints the map.
//
// `noClass` catches everything outside 1–5: no value at all (4 352 of 5 918 Schächte),
// and the 6, 7 and 0 codes the data also carries. That is most of what is on the map,
// so it is a colour the user chooses, not a constant baked in here.

function levelColorWith(levels: Record<number, string>, noClass: string) {
  return (value: number | string | null | undefined): string => {
    const n = Number(value)
    return levels[n] ?? noClass
  }
}

// ─── Haltung layer (pipe segments) ────────────────────────────────────────────

export function HaltungLayer() {
  // One subscription per field: a bare useMapStore() re-renders on any store change,
  // which for these layers means reconciling thousands of children when the user types
  // in the search box.
  const selectedFeatureId = useMapStore(s => s.selectedFeatureId)
  const selectedFeatureType = useMapStore(s => s.selectedFeatureType)
  const openPopup = useMapStore(s => s.openPopup)
  const visible = useMapStore(s => s.layerVisibility['kanal-haltungen'] ?? true)
  const levelColor = levelColorWith(useLevelColors(), useLayerNoClass('kanal-haltungen'))
  const size = useLayerSize('kanal-haltungen')
  const zw = zoomWeight(useZoom())

  const { data } = useQuery<FeatureCollection | null>({
    queryKey: ['wfs', 'kanal-haltungen'],
    queryFn:  () => fetchWFS(LAYERS.haltung),
    enabled:  visible,
  })

  // Only the features in view — see useVisibleFeatures for why.
  const features = useVisibleFeatures(visible ? data : null, MIN_ZOOM.haltungen)

  if (!visible || !data) return null

  return (
    <>
      {features.map(f => {
        const id       = String(f.properties?.id ?? f.id)
        const gsk      = f.properties?.gesamtschadensklasse
        const color    = levelColor(gsk)
        const geom     = f.geometry as LineString
        const coords   = geom.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
        const selected = selectedFeatureId === id && selectedFeatureType === 'haltung'

        return (
          <React.Fragment key={id}>
            {selected && (
              <Polyline
                positions={coords}
                pathOptions={{ color: '#fff', weight: (10 + 4 * size) * zw, opacity: 0.7 }}
              />
            )}
            <Polyline
              positions={coords}
              pathOptions={{ color, weight: (selected ? 5 : 4) * size * zw, opacity: 0.9 }}
              eventHandlers={{
                // The bubble first, the panel on request — see NetworkPopup.
                click: e => {
                  e.originalEvent.stopPropagation()
                  openPopup({
                    id, type: 'haltung',
                    latlng: [e.latlng.lat, e.latlng.lng],
                    props: (f.properties ?? {}) as Record<string, unknown>,
                  })
                },
              }}
            />
          </React.Fragment>
        )
      })}
    </>
  )
}

// ─── Schacht layer (manholes) ─────────────────────────────────────────────────

export function SchachtLayer() {
  // One subscription per field: a bare useMapStore() re-renders on any store change,
  // which for these layers means reconciling thousands of children when the user types
  // in the search box.
  const selectedFeatureId = useMapStore(s => s.selectedFeatureId)
  const selectedFeatureType = useMapStore(s => s.selectedFeatureType)
  const openPopup = useMapStore(s => s.openPopup)
  const visible = useMapStore(s => s.layerVisibility['kanal-schaechte'] ?? true)
  const levelColor = levelColorWith(useLevelColors(), useLayerNoClass('kanal-schaechte'))
  const size = useLayerSize('kanal-schaechte')
  // The nodes track the pipes: a line that thickens with zoom over a fixed-size circle
  // ends up swallowing it.
  const zoom = useZoom()
  const zw = zoomWeight(zoom)
  const showLabels = zoom >= LABEL_ZOOM

  const { data } = useQuery<FeatureCollection | null>({
    queryKey: ['wfs', 'kanal-schaechte'],
    queryFn:  () => fetchWFS(LAYERS.schacht),
    enabled:  visible,
  })

  const features = useVisibleFeatures(visible ? data : null, MIN_ZOOM.schaechte)

  if (!visible || !data) return null

  return (
    <>
      {features.map(f => {
        const id       = String(f.properties?.id ?? f.id)
        const sbz      = f.properties?.sbz
        const color    = levelColor(sbz)
        const geom     = f.geometry as Point
        const pos: [number, number] = [geom.coordinates[1], geom.coordinates[0]]
        const selected = selectedFeatureId === id && selectedFeatureType === 'schacht'

        const label = String(f.properties?.name ?? f.properties?.schacht_nr ?? '')

        const open = (e: { originalEvent: MouseEvent }) => {
          e.originalEvent.stopPropagation()
          openPopup({
            id, type: 'schacht',
            latlng: pos,
            props: (f.properties ?? {}) as Record<string, unknown>,
          })
        }

        return (
          <React.Fragment key={id}>
          {/* The name tag, at working zoom. It opens the same popup as the dot, and it
              is the target most clicks actually land on — see labelIcon. */}
          {showLabels && label && (
            <Marker
              position={pos}
              icon={labelIcon(label, selected)}
              interactive
              keyboard={false}
              eventHandlers={{ click: open }}
            />
          )}
          <CircleMarker
            center={pos}
            radius={(selected ? 9 : 6) * size * zw}
            pathOptions={{
              color:       selected ? '#fff' : color,
              // The outline does not grow with the fill — at 200% a 2px ring around a
              // 12px dot still reads as an outline, a 4px one reads as a donut.
              weight:      selected ? 3 : 2,
              fillColor:   color,
              fillOpacity: 0.9,
            }}
            // The bubble first, the panel on request — see NetworkPopup.
            eventHandlers={{ click: open }}
          />
          </React.Fragment>
        )
      })}
    </>
  )
}

// ─── Pin colors matching App2 (4 sub-layer types) ────────────────────────────

const COLOR_WART_OFFEN    = '#0070ff'  // blue
const COLOR_WART_FERTIG   = '#4ce600'  // green
const COLOR_KONT_OFFEN    = '#e60000'  // red
const COLOR_KONT_FERTIG   = '#ffaa00'  // yellow

/**
 * The same four, by (typ, status), for anything outside the map that has to agree with
 * it — the feature panel's mini-map drew every task amber, so a task the map showed as
 * a red "in Bearbeitung" pin was amber the moment you opened it.
 */
export function taskColor(typ: unknown, status: unknown): string {
  const offen = Number(status) !== 1
  return typ === 'Wartung'
    ? (offen ? COLOR_WART_OFFEN : COLOR_WART_FERTIG)
    : (offen ? COLOR_KONT_OFFEN : COLOR_KONT_FERTIG)
}

// ─── Shared sub-layer: filters from cached WFS by typ + status ────────────────

function WartungSubLayer({
  layerId, typ, status, color: baseColor, featureType,
}: {
  layerId: string
  typ: string
  status: number
  color: string
  featureType: string
}) {
  // One subscription per field: a bare useMapStore() re-renders on any store change,
  // which for these layers means reconciling thousands of children when the user types
  // in the search box.
  const selectedFeatureId = useMapStore(s => s.selectedFeatureId)
  const selectedFeatureType = useMapStore(s => s.selectedFeatureType)
  const selectFeature = useMapStore(s => s.selectFeature)
  const visible = useMapStore(s => s.layerVisibility[layerId] ?? true)
  const color = useLayerColor(layerId, baseColor)
  const size = useLayerSize(layerId)

  // All 4 sub-layers share the same cache key — only one WFS request is made
  const { data } = useQuery<FeatureCollection | null>({
    queryKey: ['wfs', 'kanal-wartungen'],
    queryFn:  () => fetchWFS(LAYERS.kanalWartungen),
    enabled:  visible,
  })

  const features = useVisibleFeatures(visible ? data : null, MIN_ZOOM.wartungen)

  if (!visible || !data) return null

  const filtered = features.filter(
    f => f.properties?.typ === typ && Number(f.properties?.status) === status,
  )

  return (
    <MarkerClusterGroup color={color}>
      {filtered.map(f => {
        const id       = String(f.properties?.id ?? f.id)
        const geom     = f.geometry as Point
        const pos: [number, number] = [geom.coordinates[1], geom.coordinates[0]]
        const selected = selectedFeatureId === id && selectedFeatureType === featureType

        return (
          <Marker
            key={id}
            position={pos}
            icon={pinIcon(color, undefined, selected, size)}
            eventHandlers={{
              // stopPropagation keeps MapInner's background click from clearing the
              // selection the popup is about to set.
              click: e => e.originalEvent.stopPropagation(),
            }}
          >
            <WartungPopup props={{ ...(f.properties as WartungProps), id }} />
          </Marker>
        )
      })}
    </MarkerClusterGroup>
  )
}

// ─── Wartung & Kontrolle — 4 public sub-layers ────────────────────────────────

export function WartungLayer() {
  return (
    <>
      <WartungSubLayer layerId="kanal-wart-offen"  typ="Wartung" status={0} color={COLOR_WART_OFFEN}  featureType="wartung" />
      <WartungSubLayer layerId="kanal-wart-fertig" typ="Wartung" status={1} color={COLOR_WART_FERTIG} featureType="wartung" />
      <WartungSubLayer layerId="kanal-kont-offen"  typ="Aufgabe" status={0} color={COLOR_KONT_OFFEN}  featureType="wartung" />
      <WartungSubLayer layerId="kanal-kont-fertig" typ="Aufgabe" status={1} color={COLOR_KONT_FERTIG} featureType="wartung" />
    </>
  )
}

// ─── Reinigung layer (cleaning segments) ─────────────────────────────────────

export function ReinigungLayer() {
  // One subscription per field: a bare useMapStore() re-renders on any store change,
  // which for these layers means reconciling thousands of children when the user types
  // in the search box.
  const selectedFeatureId = useMapStore(s => s.selectedFeatureId)
  const selectedFeatureType = useMapStore(s => s.selectedFeatureType)
  const selectFeature = useMapStore(s => s.selectFeature)
  const visible = useMapStore(s => s.layerVisibility['kanal-reinigungen'] ?? false)
  const levels = useLevelColors()
  const color = useLayerColor('kanal-reinigungen', levels[1])
  const size = useLayerSize('kanal-reinigungen')
  const zw = zoomWeight(useZoom())

  const { data } = useQuery<FeatureCollection | null>({
    queryKey: ['wfs', 'kanal-reinigungen'],
    queryFn:  () => fetchWFS(LAYERS.reinigungenlinie),
    enabled:  visible,
  })

  const features = useVisibleFeatures(visible ? data : null, MIN_ZOOM.reinigungen)

  if (!visible || !data) return null

  return (
    <>
      {features.map(f => {
        const id       = String(f.properties?.id ?? f.id)
        const geom     = f.geometry as LineString
        const coords   = geom.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
        const selected = selectedFeatureId === id && selectedFeatureType === 'reinigung'

        return (
          <React.Fragment key={id}>
            {selected && (
              <Polyline
                positions={coords}
                pathOptions={{ color: '#fff', weight: (10 + 4 * size) * zw, opacity: 0.7 }}
              />
            )}
            <Polyline
              positions={coords}
              // The dash scales with the weight, otherwise a thick line at the standard
              // dash length turns into a row of squares.
              pathOptions={{
                color, weight: 4 * size * zw, opacity: 0.9,
                dashArray: `${Math.round(10 * size * zw)} ${Math.round(6 * size * zw)}`,
              }}
              eventHandlers={{
                click: e => {
                  e.originalEvent.stopPropagation()
                  selectFeature(id, 'kanal', 'reinigung')
                },
              }}
            />
          </React.Fragment>
        )
      })}
    </>
  )
}

// ─── Composite export ─────────────────────────────────────────────────────────

export function KanalLayers() {
  return (
    <>
      <ReinigungLayer />
      <HaltungLayer />
      <SchachtLayer />
      <WartungLayer />
    </>
  )
}
