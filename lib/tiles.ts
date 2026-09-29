// Shared basemap tile definitions — used by both LeafletMap and MiniMap.
// BaseTile is re-exported so LayerControlPanel doesn't need a separate import.

export type BaseTile = 'orthofoto' | 'osm' | 'openstreetmap';

// localStorage key — persists the user's tile choice across navigation
export const TILE_STORAGE_KEY = 'spider:baseTile';

export const TILES: Record<BaseTile, {
  url:             string;
  attribution:     string;
  maxNativeZoom?:  number;
  maxZoom:         number;
}> = {
  orthofoto: {
    // basemap.at aerial — row/column order {z}/{y}/{x}
    url:            'https://mapsneu.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpeg',
    attribution:    'Datenquelle <a href="https://www.basemap.at" target="_blank">basemap.at</a>',
    maxNativeZoom:  19,
    maxZoom:        26,
  },
  osm: {
    // basemap.at standard — same row/column order
    url:            'https://mapsneu.wien.gv.at/basemap/geolandbasemap/normal/google3857/{z}/{y}/{x}.png',
    attribution:    'Datenquelle <a href="https://www.basemap.at" target="_blank">basemap.at</a>',
    maxNativeZoom:  19,
    maxZoom:        26,
  },
  openstreetmap: {
    url:            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom:        22,
  },
};
