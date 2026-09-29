'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useMapStore } from '@/lib/store/mapStore'
import { TILES } from '@/lib/tiles'
import { config } from '@/lib/config'
import { KanalLayers } from './layers/kanal'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAP_CENTER = config.mapOptions.coordinate
const MAP_ZOOM   = config.mapOptions.zoom

// Fix Leaflet default icon paths (broken in webpack builds)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ─── Fly-to handler ───────────────────────────────────────────────────────────

function FlyToHandler() {
  const map = useMap()
  const { flyTo, setFlyTo } = useMapStore()
  useEffect(() => {
    if (!flyTo) return
    map.flyTo(flyTo, 18, { animate: true, duration: 1.2 })
    setFlyTo(null)
  }, [flyTo, map, setFlyTo])
  return null
}

// ─── Click hint ───────────────────────────────────────────────────────────────

function MapHint() {
  const { selectedFeatureId } = useMapStore()
  if (selectedFeatureId) return null
  return (
    <div className="absolute bottom-14 right-3 z-[900] bg-white/95 rounded-full px-3 py-1.5 text-xs text-ink-dim border border-border shadow-sm pointer-events-none">
      Schacht · Haltung · Wartung anklicken
    </div>
  )
}

// ─── Main map (rendered without SSR via MapView) ──────────────────────────────

export default function MapInner() {
  const { baseTile, selectFeature, activeModule } = useMapStore()
  const tile = TILES[baseTile]

  return (
    <div className="relative w-full h-full" onClick={() => selectFeature(null)}>
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        className="w-full h-full"
        zoomControl={false}
        attributionControl
      >
        <TileLayer
          url={tile.url}
          attribution={tile.attribution}
          maxNativeZoom={tile.maxNativeZoom}
          maxZoom={tile.maxZoom}
        />

        <ZoomControl position="bottomleft" />
        <FlyToHandler />

        {/* Render the active module's map layers */}
        {activeModule === 'kanal' && <KanalLayers />}
      </MapContainer>

      <MapHint />
    </div>
  )
}
