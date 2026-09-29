'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useMapStore } from '@/lib/store/mapStore'
import { TILES } from '@/lib/tiles'
import { config } from '@/lib/config'
import { KanalLayers } from './layers/kanal'
import MapResizeHandler from './MapResizeHandler'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAP_CENTER = config.mapOptions.coordinate
const MAP_ZOOM   = config.mapOptions.zoom
// config defines these but nothing applied them, so the map could zoom out past the
// point where every layer's minimum zoom gates it off — leaving a basemap with no
// network on it, which reads as the data having failed to load.
const MAP_MIN_ZOOM = config.mapOptions.minZoom
const MAP_MAX_ZOOM = config.mapOptions.maxZoom

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
  const flyTo = useMapStore(s => s.flyTo)
  const setFlyTo = useMapStore(s => s.setFlyTo)
  useEffect(() => {
    if (!flyTo) return
    map.flyTo(flyTo, 18, { animate: true, duration: 1.2 })
    setFlyTo(null)
  }, [flyTo, map, setFlyTo])
  return null
}

// ─── Click hint ───────────────────────────────────────────────────────────────

function MapHint() {
  const selectedFeatureId = useMapStore(s => s.selectedFeatureId)
  if (selectedFeatureId) return null
  return (
    <div className="absolute bottom-14 right-3 z-[900] bg-white/95 rounded-full px-3 py-1.5 text-xs text-ink-dim border border-border shadow-sm pointer-events-none">
      Schacht · Haltung · Wartung anklicken
    </div>
  )
}

// ─── Mobile default ───────────────────────────────────────────────────────────

// The sidebar is 280px wide and is a flex sibling of the map, so on a 390px phone it
// leaves the map 110px — unusable, and the first thing a visitor sees. Collapse it on
// narrow screens. Done here rather than in the store's initial state because this
// component is client-only (dynamic ssr:false), so reading window cannot desync
// hydration.
function useCollapseSidebarOnPhones() {
  const setSidebarOpen = useMapStore(s => s.toggleSidebar)
  const sidebarOpen = useMapStore(s => s.sidebarOpen)

  useEffect(() => {
    if (sidebarOpen && window.matchMedia('(max-width: 767px)').matches) {
      setSidebarOpen()
    }
    // Deliberately mount-only: after this the sidebar is the user's to control.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

// ─── Main map (rendered without SSR via MapView) ──────────────────────────────

export default function MapInner() {
  // Selective subscriptions. A bare useMapStore() re-renders this component on any
  // store change, and it renders KanalLayers — so a keystroke in the search box
  // reconciled every feature on the map. Measured at 114 ms of blocked main thread
  // per character on a throttled phone.
  const baseTile = useMapStore(s => s.baseTile)
  const selectFeature = useMapStore(s => s.selectFeature)
  const activeModule = useMapStore(s => s.activeModule)
  const tile = TILES[baseTile]

  useCollapseSidebarOnPhones()

  return (
    <div className="relative w-full h-full" onClick={() => selectFeature(null)}>
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        className="w-full h-full"
        zoomControl={false}
        attributionControl
        // 5 918 Schächte + 2 892 Haltungen as SVG is ~9 100 DOM nodes, which is the
        // entire document and makes panning crawl on a phone. Canvas draws them all
        // into one element; Leaflet still hit-tests clicks correctly.
        preferCanvas
      >
        <TileLayer
          url={tile.url}
          attribution={tile.attribution}
          maxNativeZoom={tile.maxNativeZoom}
          maxZoom={tile.maxZoom}
        />

        <ZoomControl position="bottomleft" />
        <FlyToHandler />
        <MapResizeHandler />

        {/* Render the active module's map layers */}
        {activeModule === 'kanal' && <KanalLayers />}
      </MapContainer>

      <MapHint />
    </div>
  )
}
