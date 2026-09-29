'use client'
/**
 * Kanal map layers — renders GeoServer WFS features on the Leaflet map.
 *
 * Each layer:
 *   1. Fetches GeoJSON from GeoServer via React Query (cached, shared)
 *   2. Renders Leaflet elements colored by condition field (GSK / SBZ)
 *   3. On click: calls selectFeature(id, 'kanal', type) on the Zustand store
 *
 * When real GeoServer data is available, replace the placeholder useQuery
 * calls with fetchWFS() from lib/geoserver.ts.
 */

import { useQuery } from '@tanstack/react-query'
import { CircleMarker, Polyline, Marker } from 'react-leaflet'
import React from 'react'
import { useMapStore } from '@/lib/store/mapStore'
import { LEVEL_COLORS } from '@/lib/registry'
import { pinIcon } from '@/lib/mapSymbols'
import { fetchWFS } from '@/lib/geoserver'
import { config } from '@/lib/config'
import MarkerClusterGroup from '../MarkerClusterGroup'
import type { FeatureCollection, LineString, Point } from 'geojson'

const LAYERS = config.kanal.geoserverLayerOptions

// ─── Helper: GSK / SBZ → color ────────────────────────────────────────────────

function levelColor(value: number | string | null | undefined): string {
  const n = Number(value)
  return LEVEL_COLORS[n] ?? '#94a3b8'
}

// ─── Haltung layer (pipe segments) ────────────────────────────────────────────

export function HaltungLayer() {
  const { selectedFeatureId, selectedFeatureType, layerVisibility, selectFeature } = useMapStore()
  const visible = layerVisibility['kanal-haltungen'] ?? true

  const { data } = useQuery<FeatureCollection | null>({
    queryKey: ['wfs', 'kanal-haltungen'],
    queryFn:  () => fetchWFS(LAYERS.haltung),
    enabled:  visible,
  })

  if (!visible || !data) return null

  return (
    <>
      {data.features.map(f => {
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
                pathOptions={{ color: '#fff', weight: 14, opacity: 0.7 }}
              />
            )}
            <Polyline
              positions={coords}
              pathOptions={{ color, weight: selected ? 5 : 4, opacity: 0.9 }}
              eventHandlers={{
                click: e => {
                  e.originalEvent.stopPropagation()
                  selectFeature(id, 'kanal', 'haltung')
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
  const { selectedFeatureId, selectedFeatureType, layerVisibility, selectFeature } = useMapStore()
  const visible = layerVisibility['kanal-schaechte'] ?? true

  const { data } = useQuery<FeatureCollection | null>({
    queryKey: ['wfs', 'kanal-schaechte'],
    queryFn:  () => fetchWFS(LAYERS.schacht),
    enabled:  visible,
  })

  if (!visible || !data) return null

  return (
    <>
      {data.features.map(f => {
        const id       = String(f.properties?.id ?? f.id)
        const sbz      = f.properties?.sbz
        const color    = levelColor(sbz)
        const geom     = f.geometry as Point
        const pos: [number, number] = [geom.coordinates[1], geom.coordinates[0]]
        const selected = selectedFeatureId === id && selectedFeatureType === 'schacht'

        return (
          <CircleMarker
            key={id}
            center={pos}
            radius={selected ? 9 : 6}
            pathOptions={{
              color:       selected ? '#fff' : color,
              weight:      selected ? 3 : 2,
              fillColor:   color,
              fillOpacity: 0.9,
            }}
            eventHandlers={{
              click: e => {
                e.originalEvent.stopPropagation()
                selectFeature(id, 'kanal', 'schacht')
              },
            }}
          />
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

// ─── Shared sub-layer: filters from cached WFS by typ + status ────────────────

function WartungSubLayer({
  layerId, typ, status, color, featureType,
}: {
  layerId: string
  typ: string
  status: number
  color: string
  featureType: string
}) {
  const { selectedFeatureId, selectedFeatureType, layerVisibility, selectFeature } = useMapStore()
  const visible = layerVisibility[layerId] ?? true

  // All 4 sub-layers share the same cache key — only one WFS request is made
  const { data } = useQuery<FeatureCollection | null>({
    queryKey: ['wfs', 'kanal-wartungen'],
    queryFn:  () => fetchWFS(LAYERS.kanalWartungen),
    enabled:  visible,
  })

  if (!visible || !data) return null

  const filtered = data.features.filter(
    f => f.properties?.typ === typ && Number(f.properties?.status) === status,
  )

  return (
    <MarkerClusterGroup>
      {filtered.map(f => {
        const id       = String(f.properties?.id ?? f.id)
        const geom     = f.geometry as Point
        const pos: [number, number] = [geom.coordinates[1], geom.coordinates[0]]
        const selected = selectedFeatureId === id && selectedFeatureType === featureType

        return (
          <Marker
            key={id}
            position={pos}
            icon={pinIcon(color, undefined, selected)}
            eventHandlers={{
              click: e => {
                e.originalEvent.stopPropagation()
                selectFeature(id, 'kanal', featureType)
              },
            }}
          />
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
  const { selectedFeatureId, selectedFeatureType, layerVisibility, selectFeature } = useMapStore()
  const visible = layerVisibility['kanal-reinigungen'] ?? false

  const { data } = useQuery<FeatureCollection | null>({
    queryKey: ['wfs', 'kanal-reinigungen'],
    queryFn:  () => fetchWFS(LAYERS.reinigungenlinie),
    enabled:  visible,
  })

  if (!visible || !data) return null

  const color    = LEVEL_COLORS[1]
  return (
    <>
      {data.features.map(f => {
        const id       = String(f.properties?.id ?? f.id)
        const geom     = f.geometry as LineString
        const coords   = geom.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
        const selected = selectedFeatureId === id && selectedFeatureType === 'reinigung'

        return (
          <React.Fragment key={id}>
            {selected && (
              <Polyline
                positions={coords}
                pathOptions={{ color: '#fff', weight: 14, opacity: 0.7 }}
              />
            )}
            <Polyline
              positions={coords}
              pathOptions={{ color, weight: 4, opacity: 0.9, dashArray: '10 6' }}
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
