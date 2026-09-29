'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Marker, useMap } from 'react-leaflet'
import { useMapStore } from '@/lib/store/mapStore'
import { TILES } from '@/lib/tiles'
import { pinIcon, type SymbolType } from '@/lib/mapSymbols'

// Leaflet often initializes before the container's CSS dimensions are finalised
// (flex / fixed / animated parents). A short delay + explicit setView after
// invalidateSize guarantees the feature is always centred in the viewport.
function CenterOnMount({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    const id = setTimeout(() => {
      map.invalidateSize()
      map.setView(center, zoom, { animate: false })
    }, 50)
    return () => clearTimeout(id)
  }, [map, center, zoom])
  return null
}

interface Props {
  center: [number, number]
  zoom?: number
  color: string
  symbolType?: SymbolType
  polyline?: [number, number][]
}

export default function MiniMapInner({ center, zoom = 18, color, symbolType, polyline }: Props) {
  const { baseTile } = useMapStore()
  const tile = TILES[baseTile]

  const renderSymbol = () => {
    if (polyline) {
      if (symbolType === 'dashed-line') {
        return (
          <>
            <Polyline positions={polyline} pathOptions={{ color, weight: 10, opacity: 0.22 }} />
            <Polyline positions={polyline} pathOptions={{ color, weight: 4, opacity: 0.9, dashArray: '10 6' }} />
          </>
        )
      }
      return <Polyline positions={polyline} pathOptions={{ color, weight: 5, opacity: 0.9 }} />
    }

    if (symbolType === 'pin') {
      return <Marker position={center} icon={pinIcon(color)} />
    }

    // Default: ring + inner dot (schacht / circle)
    return (
      <>
        <CircleMarker
          center={center}
          radius={10}
          pathOptions={{ color, weight: 2.5, fillColor: '#ffffff', fillOpacity: 1 }}
        />
        <CircleMarker
          center={center}
          radius={4}
          pathOptions={{ color, fillColor: color, fillOpacity: 1, weight: 0 }}
        />
      </>
    )
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      zoomControl={false}
      dragging={false}
      doubleClickZoom={false}
      attributionControl={false}
      className="w-full h-full"
    >
      <TileLayer url={tile.url} attribution={tile.attribution} maxNativeZoom={tile.maxNativeZoom} maxZoom={tile.maxZoom} />
      <CenterOnMount center={center} zoom={zoom} />
      {renderSymbol()}
    </MapContainer>
  )
}
