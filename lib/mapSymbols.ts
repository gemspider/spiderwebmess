import L from 'leaflet'

export type SymbolType = 'line' | 'dashed-line' | 'circle' | 'pin'

// Wartung & Kontrolle markers.
//
// The colour scheme comes from the original application and is not ours to invent:
//
//   Wartung   blau   in Bearbeitung   ·  grün  fertig
//   Kontrolle rot    in Bearbeitung   ·  gelb  fertig
//
// Two of those four sit on the ISYBAU condition ramp (blue is level 2, red is level 5),
// which is a collision we inherit. Pins and condition chips never share a surface —
// pins are on the map, chips are in the panel — but it is why a pin is a teardrop with
// a white core and a chip is a square: the silhouette carries the meaning, not just
// the hue.

/** Ink that stays legible on a given marker colour — yellow and green need dark. */
function inkFor(color: string): string {
  const hex = color.replace('#', '')
  const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return luminance > 0.45 ? '#1c1917' : '#ffffff'
}

export function pinIcon(color: string, count?: number, selected = false, scale = 1) {
  // The viewBox is fixed at 26×34, so scaling only touches the rendered size — the
  // path, the core and the anchor maths all keep working at any multiplier.
  const w = Math.round((selected ? 32 : 26) * scale)
  const h = Math.round(w * 1.32)
  const ink = inkFor(color)

  // A solid white core rather than a translucent one: at 26px on an aerial photo, a
  // 25%-alpha circle disappears into whatever is underneath it.
  const core = count != null
    ? `<circle cx="13" cy="12.4" r="7.6" fill="#fff"/>
       <text x="13" y="16.4" text-anchor="middle" fill="${color}" font-size="10.5"
             font-weight="700" font-family="var(--font-sans), system-ui, sans-serif">${count}</text>`
    : `<circle cx="13" cy="12.4" r="4.4" fill="#fff"/>`

  return L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 26 34">
      <filter id="p" x="-40%" y="-20%" width="180%" height="150%">
        <feDropShadow dx="0" dy="${selected ? 2 : 1.2}" stdDeviation="${selected ? 2.2 : 1.4}"
                      flood-color="#1c1917" flood-opacity="${selected ? 0.45 : 0.32}"/>
      </filter>
      <path d="M13 .9C6.3.9.9 6.3.9 13c0 8.9 12.1 20 12.1 20s12.1-11.1 12.1-20C25.1 6.3 19.7.9 13 .9z"
            fill="${color}" stroke="#fff" stroke-width="${selected ? 2.4 : 1.8}" filter="url(#p)"/>
      ${core}
      ${selected ? `<circle cx="13" cy="12.4" r="11.4" fill="none" stroke="${ink === '#ffffff' ? '#fff' : color}" stroke-width="1.2" opacity=".55"/>` : ''}
    </svg>`,
    iconSize:   [w, h],
    iconAnchor: [w / 2, h],
    popupAnchor: [0, -h + 6],
  })
}

/**
 * The name tag beside a node.
 *
 * A Schacht is a 6px dot. Hitting one on a phone means hitting a target a third the
 * width of a fingertip, and the pipes running through it are easier to hit than the
 * node itself — so you open the wrong object. The application this replaces solves it
 * the same way: put the designation next to the point on a leader, and make the label
 * part of the target. The label is 20px tall and as wide as the name, which is roughly
 * ten times the area.
 *
 * Drawn white on a dark outline rather than in a box: over an orthophoto a filled chip
 * per node turns the map into a wall of rectangles, while an outlined glyph stays
 * legible on grass, asphalt and roof alike.
 */
export function labelIcon(text: string, selected = false) {
  const width = 16 + text.length * 7.2
  return L.divIcon({
    className: '',
    html: `<span style="
        display:inline-flex;align-items:center;gap:3px;
        padding:2px 6px 2px 0;
        font:italic 700 12px/1 var(--font-sans), system-ui, sans-serif;
        color:#fff;white-space:nowrap;cursor:pointer;
        text-shadow:0 0 3px #1c1917, 0 0 3px #1c1917, 0 1px 2px #1c1917;
        ${selected ? 'filter:drop-shadow(0 0 4px #fff);' : ''}
      "><span style="font-size:10px;line-height:1">&#9666;</span>${text}</span>`,
    iconSize: [width, 20],
    // Anchored so the leader triangle sits on the point and the name runs to its right.
    iconAnchor: [-2, 10],
  })
}

/**
 * Cluster chip.
 *
 * Each of the four sub-layers clusters on its own, so a cluster is always a single
 * category and can simply wear that category's colour — no blending, and the count
 * means "this many of exactly this kind", which is what an operator is counting.
 *
 * Size steps with magnitude so a cluster of 200 is visibly heavier than one of 3,
 * without scaling linearly into something that covers the street.
 */
export function clusterIcon(color: string, count: number) {
  const size = count < 10 ? 32 : count < 50 ? 38 : count < 200 ? 44 : 50
  const ink = inkFor(color)
  const font = count < 10 ? 13 : count < 100 ? 13.5 : 12.5

  return L.divIcon({
    className: '',
    html: `<div style="
        width:${size}px;height:${size}px;border-radius:9999px;
        display:flex;align-items:center;justify-content:center;
        background:${color};color:${ink};
        border:2.5px solid #fff;
        box-shadow:0 0 0 ${Math.round(size / 8)}px ${color}33, 0 2px 6px rgb(28 25 23 / .35);
        font:700 ${font}px/1 var(--font-sans), system-ui, sans-serif;
        font-variant-numeric:tabular-nums;
      ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}
