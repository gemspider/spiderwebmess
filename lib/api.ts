// Data client — static demo replacement.
//
// The real implementation fetched `/spider/api${path}`, which middleware.ts decorated
// with a Bearer token and next.config.js rewrote to FastAPI. Both are gone; this
// resolves the same paths against the snapshot in web/public/data/.
//
// apiFetch's signature and ApiError are unchanged, so modules/kanal/api.ts — the
// only caller — needs no edit.
//
// A row is assembled from three sources :
//
//   1. details/<table>.json   the base table — 109 columns, mostly null
//   2. layers/<layer>.json    the GeoServer view — where the populated values are
//   3. field aliases          renames the view's columns to what the tabs read
//   4. demo overlay           anything the user "saved" this session
//
// Order matters: the overlay is applied last, after aliasing, because the tab
// components send already-aliased field names (eingabedatum, not datum).

import { applyAliases } from './fieldAliases'
import { getOverlay, isDeleted, mergeOverlay, markDeleted, nextCreatedId } from './demoStore'
import { loadDetails, loadLayerIndex } from './snapshot'
import { getTask, taskAsFeature } from './demoTasks'
import type { DetailTable, LayerName } from './snapshot'

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

// Detail tables exposed by the snapshot, keyed by the FastAPI path segment.
const TABLES: Record<string, { detail: DetailTable; layer: LayerName }> = {
  schaechte:   { detail: 'schaechte',   layer: 'schaechte' },
  haltungen:   { detail: 'haltungen',   layer: 'haltungen' },
  wartungen:   { detail: 'wartungen',   layer: 'wartungen' },
  reinigungen: { detail: 'reinigungen', layer: 'reinigungen' },
}

// /kanal/schaechte/42  → ['kanal', 'schaechte', '42']
// /kanal/schaechte     → ['kanal', 'schaechte']
function parsePath(path: string): { domain: string; table: string; id?: string } | null {
  const parts = path.replace(/^\/+|\/+$/g, '').split('/')
  if (parts.length < 2) return null
  return { domain: parts[0], table: parts[1], id: parts[2] }
}

async function buildRow(table: string, id: string): Promise<Record<string, unknown> | null> {
  const source = TABLES[table]
  if (!source) return null

  if (isDeleted(table, id)) return null

  // The two sources are independent; load them together. Both are memoised, so a
  // second feature of the same type costs nothing.
  const [details, layerIndex] = await Promise.all([
    loadDetails(source.detail),
    loadLayerIndex(source.layer),
  ])

  // A task raised in this demo has no snapshot row at all; it is only in localStorage.
  // Serving it from here means FeaturePanel, the popup and the tabs all reach it
  // through the path they already use.
  if (table === 'wartungen' && Number(id) < 0) {
    const task = getTask(id)
    if (!task) return null
    const props = taskAsFeature(task).properties as Record<string, unknown>
    return { ...props, ...(getOverlay(table, id) ?? {}), id: Number(id) }
  }

  const base = details[id]
  const view = layerIndex.get(id)

  // reinigungen has zero id overlap between view and base table (Finding 2), so the
  // view alone is a legitimate row there.
  if (!base && !view) return null

  const merged = applyAliases(table, { ...base, ...view })
  const overlay = getOverlay(table, id)

  return { ...merged, ...(overlay ?? {}), id: Number(id) }
}

// ─── The static router ───────────────────────────────────────────────────────

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase()
  const route = parsePath(path)

  if (!route || route.domain !== 'kanal' || !TABLES[route.table]) {
    throw new ApiError(404, `Demo: no snapshot for ${path}`)
  }

  const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {}

  if (method === 'GET') {
    if (!route.id) throw new ApiError(404, `Demo: list endpoints are not in the snapshot`)

    const row = await buildRow(route.table, route.id)
    if (!row) throw new ApiError(404, 'Not found')

    // FastAPI returns a GeoJSON Feature; modules/kanal/api.ts reads .properties.
    // Geometry is omitted deliberately — FeaturePanel takes it from the layer cache.
    return { type: 'Feature', properties: row, geometry: null } as T
  }

  if (method === 'PUT') {
    if (!route.id) throw new ApiError(404, 'Not found')
    if (!(await buildRow(route.table, route.id))) throw new ApiError(404, 'Not found')
    mergeOverlay(route.table, route.id, body)
    return { updated: true } as T
  }

  if (method === 'POST') {
    const id = nextCreatedId()
    mergeOverlay(route.table, id, body)
    return { id, created: true } as T
  }

  if (method === 'DELETE') {
    if (!route.id) throw new ApiError(404, 'Not found')
    markDeleted(route.table, route.id)
    return undefined as T
  }

  throw new ApiError(405, `Demo: ${method} not supported`)
}
