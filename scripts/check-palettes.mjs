// Recompute every ramp's worst-case class separation under deuteranope simulation and
// fail if a declared figure has drifted.
//
// These numbers justify the palette list existing at all — the ISYBAU default collapses
// two classes for ~8% of men — so they must not be allowed to become stale folklore.
// Run from web/:  node scripts/check-palettes.mjs

import { readFileSync } from 'node:fs'

const srgbToLinear = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const hexToRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255)

/** Brettel/Viénot deuteranope simulation via LMS. */
function simulateDeuteranopia(hex) {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear)
  const L = 17.8824 * r + 43.5161 * g + 4.11935 * b
  const S = 0.0299566 * r + 0.184309 * g + 1.46709 * b
  const M = 0.494207 * L + 1.24827 * S
  return [
    0.0809444479 * L - 0.130504409 * M + 0.116721066 * S,
    0.113614708 * L - 0.0102485335 * M + 0.154298164 * S,
    -0.000365296938 * L - 0.00412161469 * M + 0.693511405 * S,
  ].map(v => Math.max(0, Math.min(1, v)))
}

function toLab(rgbLinear) {
  const m = [[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]]
  const xyz = m.map(row => row.reduce((a, k, i) => a + k * rgbLinear[i], 0))
  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const [fx, fy, fz] = xyz.map((v, i) => f(v / [0.95047, 1, 1.08883][i]))
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

const deltaE = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]))

const src = readFileSync(new URL('../lib/palettes.ts', import.meta.url), 'utf8')
const blocks = [...src.matchAll(
  /name: '([^']+)',[\s\S]*?colors: \[([^\]]+)\],\s*\n\s*minDeltaE: ([\d.]+),\s*\n\s*cvdSafe: (true|false)/g,
)]

let failed = 0
for (const [, name, colorsRaw, claimed, safe] of blocks) {
  const colors = colorsRaw.split(',').map(c => c.trim().replace(/'/g, ''))
  const lab = colors.map(c => toLab(simulateDeuteranopia(c)))

  let worst = Infinity
  for (let i = 0; i < lab.length; i++)
    for (let j = i + 1; j < lab.length; j++) worst = Math.min(worst, deltaE(lab[i], lab[j]))

  const drift = Math.abs(worst - Number(claimed)) > 0.6
  // 12 is roughly where two colours stop being reliably separable.
  const safeWrong = (worst >= 12) !== (safe === 'true')
  if (drift || safeWrong) failed++

  console.log(
    `${name.padEnd(18)} declared ${claimed.padStart(5)}  measured ${worst.toFixed(1).padStart(5)}` +
    `  ${drift ? '✗ drifted' : '✓'}  cvdSafe=${safe} ${safeWrong ? '✗' : '✓'}`,
  )
}

// ── The "no class" picker ───────────────────────────────────────────────────
// The neutral has to be *in* the palette and has to come first, or the standard shows
// as no swatch selected and the user cannot see which one is active. Two greys in one
// picker is the other failure: a choice with no visible difference.

const noClass = src.match(/export const NO_CLASS = '(#[0-9a-f]{6})'/i)?.[1]
const swatchBlock = src.match(/NO_CLASS_SWATCHES[\s\S]*?= \[([\s\S]*?)\n\]/)?.[1] ?? ''
// The first *entry*, not the first 'value:' — a spread carries no 'value:', so matching
// on that reported the neutral as leading no matter where in the list it sat. This
// check was written wrong and passed a deliberately broken palette before it was fixed.
const firstEntry = swatchBlock.split('\n').map(l => l.trim()).filter(Boolean)[0] ?? ''
const leads = firstEntry.includes('NO_CLASS') ? 'NO_CLASS' : firstEntry
const dropsGrey = /filter\(s => s\.name !== 'Grau'\)/.test(swatchBlock)

if (!noClass) { console.error('\nNO_CLASS is not exported from lib/palettes.ts'); failed++ }
else if (leads !== 'NO_CLASS') { console.error('\nNO_CLASS_SWATCHES does not lead with the neutral'); failed++ }
else if (!dropsGrey) { console.error('\nNO_CLASS_SWATCHES keeps a second grey'); failed++ }
else console.log(`\nNo-class neutral ${noClass} leads its picker, qualitative grey dropped  ✓`)

if (failed) {
  console.error(`\n${failed} palette check(s) failed.`)
  process.exit(1)
}
console.log('\nAll palette figures match their colours.')
