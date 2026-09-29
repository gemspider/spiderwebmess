'use client'
import dynamic from 'next/dynamic'

// Leaflet uses browser APIs (window, document) that are not available in SSR.
// The dynamic import with ssr: false ensures this component is only rendered
// on the client. The loading state provides a placeholder while JS loads.
const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#e8ede4]">
      <div className="text-center">
        <div className="text-2xl mb-2">🗺</div>
        <p className="text-sm text-ink-dim">Karte wird geladen…</p>
      </div>
    </div>
  ),
})

export function MapView() {
  return <MapInner />
}
