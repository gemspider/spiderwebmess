import L from 'leaflet'

export type SymbolType = 'line' | 'dashed-line' | 'circle' | 'pin'

export function pinIcon(color: string, count?: number, selected = false) {
  const size = selected ? 44 : 36
  const h = Math.round(size * 1.22)
  const anchor = size / 2
  const countText = count != null
    ? `<text x="18" y="21.5" text-anchor="middle" fill="white" font-size="13" font-weight="700"
         font-family="system-ui,-apple-system,sans-serif">${count}</text>`
    : ''
  return L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h}" viewBox="0 0 36 44">
      <filter id="ps"><feDropShadow dx="0" dy="2" stdDeviation="${selected ? 3 : 2}"
        flood-opacity="${selected ? 0.45 : 0.3}"/></filter>
      <path d="M18 1C9.16 1 2 8.16 2 17c0 12.17 16 25.5 16 25.5S34 29.17 34 17C34 8.16 26.84 1 18 1z"
        fill="${color}" stroke="white" stroke-width="${selected ? 2.5 : 2}" filter="url(#ps)"/>
      <circle cx="18" cy="17" r="7.5" fill="white" opacity="0.25"/>
      ${countText}
    </svg>`,
    iconSize: [size, h],
    iconAnchor: [anchor, h],
  })
}
