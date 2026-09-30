// Typed equivalent of App2's config.js — community-specific values come from env vars

// Relative path — Next.js rewrites /geoserver/* to the real GeoServer (no CORS).
// Override NEXT_PUBLIC_GEOSERVER_BASE only when not using the built-in proxy.
const GEOSERVER_BASE =
  process.env.NEXT_PUBLIC_GEOSERVER_BASE ?? '/geoserver';

export const config = {
  community: process.env.NEXT_PUBLIC_COMMUNITY_NAME ?? 'AWV Mittleres Schwarzatal',
  projectID: parseInt(process.env.NEXT_PUBLIC_COMMUNITY_ID ?? '54', 10),

  mapOptions: {
    // Default coords from App2 config.js — can be overridden per community
    coordinate: [
      parseFloat(process.env.NEXT_PUBLIC_MAP_LAT ?? '47.7136'),
      parseFloat(process.env.NEXT_PUBLIC_MAP_LNG ?? '16.0327'),
    ] as [number, number],
    zoom: parseInt(process.env.NEXT_PUBLIC_MAP_ZOOM ?? '18', 10),
    minZoom: 13,
    maxZoom: 26,
  },

  // Zoom thresholds below which layers are cleared (matches App2 exactly)
  customZoom: {
    minZoomLevelForSchachtQuery: 17,
    minZoomLevelForHaltungQuery: 13,
    minZoomLevelForEinbautenQuery: 19,
    minZoomLevelForLeitungenQuery: 18,
    minZoomLevelForReinigunSchachtQuery: 10,
    minZoomLevelForReinigunHaltungQuery: 10,
  },

  geoserverBase: GEOSERVER_BASE,

  kanal: {
    name: 'Abwasser',
    geoserverLayerOptions: {
      schacht: 'WS_awvms:schaechte_app',
      haltung: 'WS_awvms:haltungen_app',
      kanalWartungen: 'WS_awvms:wartungen_tabelle_kanal',
      reinigungenlinie: 'WS_awvms:reinigungen_combined',
      reinigungenpunkt: 'WS_awvms:reinigungen_punkt',
    },
  },

  wasser: {
    name: 'Wasser',
    geoserverLayerOptions: {
      einbauten: 'WS_awvms:app_einbauten_info',
      leitungen: 'WS_awvms:app_leitungen_info',
      wasserWartungen: 'WS_awvms:wartungen_tabelle_wasser',
    },
  },
} as const;

// Schacht (SBZ) and Haltung (GSK) class colours, for KanalMapManager.
//
// That component is not mounted — KanalLayers replaced it — and these are the only two
// consumers, so nothing on screen comes from here. Kept in step with lib/palettes all
// the same: a stale copy left in the tree is what the next person will read and trust.
import { ISYBAU_LEVELS } from './palettes';

export const SBZ_COLORS: Record<number, string> = ISYBAU_LEVELS;

export const GSK_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(ISYBAU_LEVELS),
);
