'use client';

// Manages Kanal GeoJSON layers imperatively — mirrors App2's layerUpdateManagerBatch pattern.
// Renders nothing to the DOM; all work is done via Leaflet's layer API.

import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Feature, GeoJsonObject } from 'geojson';
import { config, SBZ_COLORS, GSK_COLORS } from '@/lib/config';
import { fetchWFS } from '@/lib/geoserver';

interface Props {
  onFeatureClick: (feature: Feature) => void;
  schachteVisible: boolean;
  haltungenVisible: boolean;
  reinigungenHaltungenVisible: boolean;
  reinigungenSchachteVisible: boolean;
}

export default function KanalMapManager({
  onFeatureClick,
  schachteVisible,
  haltungenVisible,
  reinigungenHaltungenVisible,
  reinigungenSchachteVisible,
}: Props) {
  const map = useMap();

  const onClickRef = useRef(onFeatureClick);
  useEffect(() => { onClickRef.current = onFeatureClick; }, [onFeatureClick]);

  const schachtLyrRef = useRef<L.GeoJSON | null>(null);
  const haltungLyrRef = useRef<L.GeoJSON | null>(null);
  const reinigunLineLyrRef = useRef<L.GeoJSON | null>(null);
  const reinigunPointLyrRef = useRef<L.GeoJSON | null>(null);

  // ── Create layers once on mount ────────────────────────────────────────────
  useEffect(() => {
    // Schacht layer — white circle, SBZ-coloured border, permanent schacht_nr label
    const schachtLyr = L.geoJson(undefined as unknown as GeoJsonObject, {
      pointToLayer: (feature, latlng) => {
        const style: L.CircleMarkerOptions = {
          radius: 8,
          fillColor: 'white',
          color: '#000000',
          weight: 2.5,
          opacity: 1,
          fillOpacity: 1,
        };

        const sbz: number | null | undefined = feature.properties?.sbz;
        if (sbz !== null && sbz !== undefined) {
          style.color = SBZ_COLORS[sbz] ?? '#000000';
        } else {
          const art: string | null = feature.properties?.Schachtart;
          if (art === 'Fiktiver Schacht') {
            style.fillColor = '#832a5b';
            style.radius = 4.5;
          } else if (art === 'Hauptschacht') {
            style.radius = 6;
          }
        }

        const marker = L.circleMarker(latlng, style);

        const nr = feature.properties?.schacht_nr;
        if (nr !== null && nr !== undefined) {
          marker.bindTooltip(String(nr), {
            permanent: true,
            direction: 'right',
            className: 'schacht-label',
            offset: [0, 0],
            opacity: 1,
          });
        }

        return marker;
      },
      onEachFeature: (feature, layer) => {
        layer.on('click', () => onClickRef.current(feature));
      },
    });

    // Haltung layer — default pink, Hauptleitung gets GSK colour + thicker weight
    const haltungLyr = L.geoJson(undefined as unknown as GeoJsonObject, {
      style: (feature) => {
        const style: L.PathOptions = { color: '#e4b0b6', weight: 4, opacity: 1 };
        const gsk: string = feature?.properties?.gesamtschadensklasse;
        const art: string = feature?.properties?.leitungsart;
        if (art === 'Transport- oder/und Hauptleitung') {
          style.color = GSK_COLORS[gsk] ?? '#e4b0b6';
          style.weight = 7;
        }
        return style;
      },
      onEachFeature: (feature, layer) => {
        layer.on('click', () => onClickRef.current(feature));
      },
    });

    // Reinigungen line layer — mirrors App2's reinigunLineLyr
    // status=1 (erledigt) → green #58d68d, else yellow #FFC300, weight 10
    const reinigunLineLyr = L.geoJson(undefined as unknown as GeoJsonObject, {
      style: (feature) => {
        const status = feature?.properties?.status;
        return {
          color: status === 1 ? '#58d68d' : '#FFC300',
          weight: 10,
          opacity: 1,
        };
      },
      onEachFeature: (feature, layer) => {
        layer.on('click', () => onClickRef.current(feature));
      },
    });

    // Reinigungen point layer — mirrors App2's reinigunPointLyr
    // Circle markers, same status-based colour
    const reinigunPointLyr = L.geoJson(undefined as unknown as GeoJsonObject, {
      pointToLayer: (feature, latlng) => {
        const status = feature?.properties?.status;
        return L.circleMarker(latlng, {
          radius: 8,
          fillColor: 'white',
          color: status === 1 ? '#58d68d' : '#FFC300',
          weight: 2.5,
          opacity: 1,
          fillOpacity: 1,
        });
      },
      onEachFeature: (feature, layer) => {
        layer.on('click', () => onClickRef.current(feature));
      },
    });

    // Layer order (bottom → top): reinigunLine, haltung, reinigunPoint, schacht
    reinigunLineLyr.addTo(map);
    haltungLyr.addTo(map);
    reinigunPointLyr.addTo(map);
    schachtLyr.addTo(map);

    schachtLyrRef.current = schachtLyr;
    haltungLyrRef.current = haltungLyr;
    reinigunLineLyrRef.current = reinigunLineLyr;
    reinigunPointLyrRef.current = reinigunPointLyr;

    return () => {
      map.removeLayer(schachtLyr);
      map.removeLayer(haltungLyr);
      map.removeLayer(reinigunLineLyr);
      map.removeLayer(reinigunPointLyr);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // ── Layer update — mirrors layerUpdateManagerBatch ─────────────────────────
  const updateLayers = useCallback(async () => {
    const schachtLyr = schachtLyrRef.current;
    const haltungLyr = haltungLyrRef.current;
    const reinigunLineLyr = reinigunLineLyrRef.current;
    const reinigunPointLyr = reinigunPointLyrRef.current;
    if (!schachtLyr || !haltungLyr || !reinigunLineLyr || !reinigunPointLyr) return;

    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const bbox = bounds.toBBoxString();

    const [schaechteData, haltungenData, reinigunLinienData, reinigunPunkteData] = await Promise.all([
      zoom >= config.customZoom.minZoomLevelForSchachtQuery
        ? fetchWFS(config.kanal.geoserverLayerOptions.schacht, bbox)
        : Promise.resolve(null),
      zoom >= config.customZoom.minZoomLevelForHaltungQuery
        ? fetchWFS(config.kanal.geoserverLayerOptions.haltung, bbox)
        : Promise.resolve(null),
      zoom >= config.customZoom.minZoomLevelForReinigunHaltungQuery
        ? fetchWFS(config.kanal.geoserverLayerOptions.reinigungenlinie, bbox)
        : Promise.resolve(null),
      zoom >= config.customZoom.minZoomLevelForReinigunSchachtQuery
        ? fetchWFS(config.kanal.geoserverLayerOptions.reinigungenpunkt, bbox)
        : Promise.resolve(null),
    ]);

    schachtLyr.clearLayers();
    if (schaechteData?.features?.length) schachtLyr.addData(schaechteData as GeoJsonObject);

    haltungLyr.clearLayers();
    if (haltungenData?.features?.length) haltungLyr.addData(haltungenData as GeoJsonObject);

    reinigunLineLyr.clearLayers();
    if (reinigunLinienData?.features?.length) reinigunLineLyr.addData(reinigunLinienData as GeoJsonObject);

    reinigunPointLyr.clearLayers();
    if (reinigunPunkteData?.features?.length) reinigunPointLyr.addData(reinigunPunkteData as GeoJsonObject);
  }, [map]);

  // ── Bind map events ────────────────────────────────────────────────────────
  useEffect(() => {
    updateLayers();
    map.on('moveend', updateLayers);
    return () => { map.off('moveend', updateLayers); };
  }, [map, updateLayers]);

  // ── Visibility control ─────────────────────────────────────────────────────
  useEffect(() => {
    const lyr = schachtLyrRef.current;
    if (!lyr) return;
    if (schachteVisible) lyr.addTo(map); else map.removeLayer(lyr);
  }, [map, schachteVisible]);

  useEffect(() => {
    const lyr = haltungLyrRef.current;
    if (!lyr) return;
    if (haltungenVisible) lyr.addTo(map); else map.removeLayer(lyr);
  }, [map, haltungenVisible]);

  useEffect(() => {
    const lyr = reinigunLineLyrRef.current;
    if (!lyr) return;
    if (reinigungenHaltungenVisible) lyr.addTo(map); else map.removeLayer(lyr);
  }, [map, reinigungenHaltungenVisible]);

  useEffect(() => {
    const lyr = reinigunPointLyrRef.current;
    if (!lyr) return;
    if (reinigungenSchachteVisible) lyr.addTo(map); else map.removeLayer(lyr);
  }, [map, reinigungenSchachteVisible]);

  return null;
}
