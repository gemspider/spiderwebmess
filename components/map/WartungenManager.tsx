'use client';

// Loads ALL Wartungen + Aufgaben (Kontrolle) on init and displays in MarkerCluster.
// Mirrors App2's kanalLayer.js wartungenInProgressLayerAnnex pattern exactly.
// 4 layers: Wartung/offen (blue), Wartung/fertig (green), Kontrolle/offen (red), Kontrolle/fertig (yellow)

import { useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import type { Feature, FeatureCollection } from 'geojson';
import { config } from '@/lib/config';
import { fetchWFS } from '@/lib/geoserver';

// basePath '/spider' is prepended to all public/ assets by Next.js
const BASE_PATH = '/spider';

interface Props {
  wartungenOffenVisible: boolean;
  wartungenFertigVisible: boolean;
  kontrolleOffenVisible: boolean;
  kontrolleFertigVisible: boolean;
  onFeatureClick: (feature: Feature) => void;
}

// Exact icon config from App2's kanalLayer.js
function makeIcon(color: 'blue' | 'green' | 'red' | 'yellow'): L.Icon {
  return L.icon({
    iconUrl: `${BASE_PATH}/images/marker-icon-${color}.png`,
    iconSize: [25, 41],
    iconAnchor: [11, 41],
    shadowUrl: `${BASE_PATH}/images/wartungen-shadow.png`,
    shadowSize: [50, 64],
    shadowAnchor: [11, 64],
    popupAnchor: [0, 0],
  });
}

// Mirrors App2's filterDataByType — split features by typ + status
function filterFeatures(features: Feature[], typ: string, status: number): Feature[] {
  return features.filter(
    f => f.properties?.typ === typ && Number(f.properties?.status) === status,
  );
}

export default function WartungenManager({
  wartungenOffenVisible,
  wartungenFertigVisible,
  kontrolleOffenVisible,
  kontrolleFertigVisible,
  onFeatureClick,
}: Props) {
  const map = useMap();
  const onClickRef = useRef(onFeatureClick);
  useEffect(() => { onClickRef.current = onFeatureClick; }, [onFeatureClick]);

  // Visibility refs — read inside async fetch callback to capture current state
  // (React state would be stale inside the closure; refs always reflect latest value)
  const wartOffenVisRef  = useRef(wartungenOffenVisible);
  const wartFertigVisRef = useRef(wartungenFertigVisible);
  const kontOffenVisRef  = useRef(kontrolleOffenVisible);
  const kontFertigVisRef = useRef(kontrolleFertigVisible);

  useEffect(() => { wartOffenVisRef.current  = wartungenOffenVisible; },  [wartungenOffenVisible]);
  useEffect(() => { wartFertigVisRef.current = wartungenFertigVisible; }, [wartungenFertigVisible]);
  useEffect(() => { kontOffenVisRef.current  = kontrolleOffenVisible; },  [kontrolleOffenVisible]);
  useEffect(() => { kontFertigVisRef.current = kontrolleFertigVisible; }, [kontrolleFertigVisible]);

  const clusterRef    = useRef<L.MarkerClusterGroup | null>(null);
  const wartOffenRef  = useRef<L.GeoJSON | null>(null);
  const wartFertigRef = useRef<L.GeoJSON | null>(null);
  const kontOffenRef  = useRef<L.GeoJSON | null>(null);
  const kontFertigRef = useRef<L.GeoJSON | null>(null);

  // ── Reusable load function — mirrors App2's refreshLayerWithGeoJSON ──────────
  // All deps are refs so the callback is stable (no re-creation on prop changes).
  const loadData = useCallback(() => {
    const cluster  = clusterRef.current;
    const wOffen   = wartOffenRef.current;
    const wFertig  = wartFertigRef.current;
    const kOffen   = kontOffenRef.current;
    const kFertig  = kontFertigRef.current;
    if (!cluster || !wOffen || !wFertig || !kOffen || !kFertig) return;

    // Mirrors App2's: removeLayer → clearLayers → addData → addLayer
    cluster.removeLayer(wOffen);
    cluster.removeLayer(wFertig);
    cluster.removeLayer(kOffen);
    cluster.removeLayer(kFertig);
    wOffen.clearLayers();
    wFertig.clearLayers();
    kOffen.clearLayers();
    kFertig.clearLayers();

    fetchWFS(config.kanal.geoserverLayerOptions.kanalWartungen).then(
      (data: FeatureCollection | null) => {
        if (!data?.features?.length) return;
        const f = data.features as Feature[];

        wOffen.addData(filterFeatures(f, 'Wartung', 0) as unknown as GeoJSON.GeoJsonObject);
        wFertig.addData(filterFeatures(f, 'Wartung', 1) as unknown as GeoJSON.GeoJsonObject);
        kOffen.addData(filterFeatures(f, 'Aufgabe',  0) as unknown as GeoJSON.GeoJsonObject);
        kFertig.addData(filterFeatures(f, 'Aufgabe', 1) as unknown as GeoJSON.GeoJsonObject);

        if (wartOffenVisRef.current)  cluster.addLayer(wOffen);
        if (wartFertigVisRef.current) cluster.addLayer(wFertig);
        if (kontOffenVisRef.current)  cluster.addLayer(kOffen);
        if (kontFertigVisRef.current) cluster.addLayer(kFertig);
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Create layers once on mount, then load data ───────────────────────────
  useEffect(() => {
    // require() inside useEffect — same pattern as LeafletMap icon fix.
    // ESM side-effect imports of Leaflet plugins don't reliably augment L in
    // webpack's module graph; require() guarantees the plugin runs synchronously
    // after L is available and attaches markerClusterGroup to the same L instance.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('leaflet.markercluster');

    // MarkerClusterGroup — exact config from App2 kanalLayer.js
    const cluster = L.markerClusterGroup({
      maxClusterRadius: (zoom: number) => (zoom <= 16 ? 80 : 1),
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyDistanceMultiplier: 1.5,
    });

    function makeGeoJsonLayer(icon: L.Icon): L.GeoJSON {
      return L.geoJson(undefined, {
        pointToLayer: (_feature, latlng) => L.marker(latlng, { icon }),
        onEachFeature: (feature, layer) => {
          layer.on('click', () => onClickRef.current(feature));
        },
      });
    }

    // Add cluster to map but NOT the empty sub-layers yet.
    // cluster.addLayer(emptyGeoJson) captures zero markers — the cluster won't
    // pick up features added via addData() later. Instead we add each layer
    // only after data is loaded (mirrors App2's removeLayer→addData→addLayer sequence).
    cluster.addTo(map);

    wartOffenRef.current  = makeGeoJsonLayer(makeIcon('blue'));
    wartFertigRef.current = makeGeoJsonLayer(makeIcon('green'));
    kontOffenRef.current  = makeGeoJsonLayer(makeIcon('red'));
    kontFertigRef.current = makeGeoJsonLayer(makeIcon('yellow'));
    clusterRef.current    = cluster;

    // Initial data load
    loadData();

    return () => { cluster.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // ── Listen for reload event dispatched by WartungInfoCard after save ──────
  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('wartungen:reload', handler);
    return () => window.removeEventListener('wartungen:reload', handler);
  }, [loadData]);

  // ── Visibility — add/remove each sub-layer from the shared cluster ─────────
  useEffect(() => {
    const c = clusterRef.current; const l = wartOffenRef.current;
    if (!c || !l) return;
    if (wartungenOffenVisible) c.addLayer(l); else c.removeLayer(l);
  }, [wartungenOffenVisible]);

  useEffect(() => {
    const c = clusterRef.current; const l = wartFertigRef.current;
    if (!c || !l) return;
    if (wartungenFertigVisible) c.addLayer(l); else c.removeLayer(l);
  }, [wartungenFertigVisible]);

  useEffect(() => {
    const c = clusterRef.current; const l = kontOffenRef.current;
    if (!c || !l) return;
    if (kontrolleOffenVisible) c.addLayer(l); else c.removeLayer(l);
  }, [kontrolleOffenVisible]);

  useEffect(() => {
    const c = clusterRef.current; const l = kontFertigRef.current;
    if (!c || !l) return;
    if (kontrolleFertigVisible) c.addLayer(l); else c.removeLayer(l);
  }, [kontrolleFertigVisible]);

  return null;
}
