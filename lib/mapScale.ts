/**
 * How map symbols grow as you zoom in.
 *
 * Its own module, with no Leaflet import, so the rule can be tested without a DOM —
 * it lived next to the culling hook, and pulling that into a test dragged Leaflet in
 * with it and failed on `window`.
 */

/**
 * Stroke multiplier for the current zoom.
 *
 * A constant weight is right for a map you read at one scale and wrong for one you zoom
 * into: at z20 a 4px line is a thread between buildings, where the application this
 * replaces draws a band you can see from across the room. Weight grows with zoom and
 * stops at 3x, past which a DN 150 pipe covers the street it runs under.
 *
 * Below z16 it stays at 1 — zoomed out the lines are dense enough to merge already.
 */
export function zoomWeight(zoom: number): number {
  return Math.max(1, Math.min(3, 1 + (zoom - 16) * 0.35))
}

/**
 * Zoom at which node names appear.
 *
 * They are DOM markers, one per node, so this has to stay where the viewport holds tens
 * of Schächte rather than hundreds — at 18 it is around 40 on a phone. It is also the
 * zoom at which you are working on a particular manhole rather than reading the network.
 */
export const LABEL_ZOOM = 18
