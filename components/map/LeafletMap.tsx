'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Feature } from 'geojson';
import { config } from '@/lib/config';
import { TILES, TILE_STORAGE_KEY, type BaseTile } from '@/lib/tiles';
import KanalMapManager from './KanalMapManager';
import WartungenManager from './WartungenManager';
import LayerControlPanel, {
  DEFAULT_LAYER_STATE,
  type LayerState,
} from './LayerControlPanel';

interface Props {
  onFeatureClick: (feature: Feature) => void;
}

export default function LeafletMap({ onFeatureClick }: Props) {
  // Restore tile choice from localStorage (persists across navigation to detail pages)
  const [layerState, setLayerState] = useState<LayerState>(() => {
    const saved = localStorage.getItem(TILE_STORAGE_KEY) as BaseTile | null;
    return {
      ...DEFAULT_LAYER_STATE,
      baseTile: saved && saved in TILES ? saved : DEFAULT_LAYER_STATE.baseTile,
    };
  });

  // Persist tile choice whenever user changes it
  useEffect(() => {
    localStorage.setItem(TILE_STORAGE_KEY, layerState.baseTile);
  }, [layerState.baseTile]);

  useEffect(() => {
    // Fix Leaflet default marker icon broken by webpack
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet');
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  const tile = TILES[layerState.baseTile];

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={config.mapOptions.coordinate}
        zoom={config.mapOptions.zoom}
        minZoom={config.mapOptions.minZoom}
        maxZoom={config.mapOptions.maxZoom}
        zoomControl={false}
        className="h-full w-full"
      >
        {/* Base tile — key forces remount when tile type changes */}
        <TileLayer
          key={layerState.baseTile}
          url={tile.url}
          attribution={tile.attribution}
          maxNativeZoom={('maxNativeZoom' in tile ? tile.maxNativeZoom : 19) as number}
          maxZoom={tile.maxZoom}
        />

        {/* Kanal GeoJSON layers (Schächte + Haltungen + Reinigungen) */}
        <KanalMapManager
          onFeatureClick={onFeatureClick}
          schachteVisible={layerState.schachte}
          haltungenVisible={layerState.haltungen}
          reinigungenHaltungenVisible={layerState.reinigungenHaltungen}
          reinigungenSchachteVisible={layerState.reinigungenSchachte}
        />

        {/* Wartungen + Aufgaben MarkerCluster */}
        <WartungenManager
          onFeatureClick={onFeatureClick}
          wartungenOffenVisible={layerState.wartungenOffen}
          wartungenFertigVisible={layerState.wartungenFertig}
          kontrolleOffenVisible={layerState.kontrolleOffen}
          kontrolleFertigVisible={layerState.kontrolleFertig}
        />
      </MapContainer>

      {/* Layer control panel — React overlay, not Leaflet control */}
      <LayerControlPanel state={layerState} onChange={setLayerState} />
    </div>
  );
}
