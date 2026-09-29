// WFS client — static demo replacement.
//
// The real implementation (spider-gis) hit GeoServer's /ows endpoint through a
// Next.js rewrite. Here the same layers are served from web/public/data/layers/,
// snapshotted by scripts/extract-data.sh.
//
// The signature and the "return null on failure" contract are unchanged, so
// components/map/layers/kanal.tsx needs no edit. It never sends a bbox — it fetches
// whole layers and filters client-side — which is what makes a static snapshot work
// at all. See.

import type { FeatureCollection } from 'geojson';
import { loadLayer, GEOSERVER_LAYER_MAP } from './snapshot';

export async function fetchWFS(
  typeName: string,
  _bbox?: string,
  featureID?: string,
): Promise<FeatureCollection | null> {
  if (!typeName) return null;

  const layer = GEOSERVER_LAYER_MAP[typeName];
  // Unknown layer — the wasser typeNames in lib/config.ts land here. Their views
  // are not in the community-054 dump .
  if (!layer) return null;

  try {
    const fc = await loadLayer(layer);

    if (!featureID) return fc;

    return {
      ...fc,
      features: fc.features.filter(f => String(f.properties?.id) === featureID),
    };
  } catch {
    // Same forgiving contract as the WFS client — callers already handle null.
    return null;
  }
}
