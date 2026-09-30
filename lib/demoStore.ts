// Demo write overlay.
//
// The real app PUTs to FastAPI. There is no server here, but a form that silently
// does nothing looks broken to a stakeholder, and one that shows a red error looks
// worse. So edits land in localStorage: the value sticks, survives a reload, and
// is visibly reversible via "Demo zurücksetzen" in the TopBar.
//
// Nothing here leaves the browser. Every access is wrapped — a private window or
// blocked site data makes localStorage throw rather than return null.
//
// Tasks *created* in the demo live in lib/demoTasks (a whole feature with geometry, not
// a patch onto an existing row). resetDemo() clears both, so there is one way back to
// the snapshot rather than two half-ways.

import { resetTasks } from './demoTasks'

const KEY = 'spiderweb:demo-overlay'

/** `<table>:<id>` → the fields the user changed. Deleted rows get __deleted. */
type Overlay = Record<string, Record<string, unknown>>

const DELETED = '__deleted'

let memory: Overlay | null = null   // in-memory fallback when storage is unavailable

function read(): Overlay {
  if (memory) return memory

  try {
    const raw = localStorage.getItem(KEY)
    memory = raw ? (JSON.parse(raw) as Overlay) : {}
  } catch {
    memory = {}
  }

  return memory
}

function write(overlay: Overlay): void {
  memory = overlay
  try {
    localStorage.setItem(KEY, JSON.stringify(overlay))
  } catch {
    // Quota or private mode — the edit still shows this session, just not after reload.
  }
}

function rowKey(table: string, id: string | number): string {
  return `${table}:${id}`
}

export function getOverlay(table: string, id: string | number): Record<string, unknown> | null {
  const entry = read()[rowKey(table, id)]
  if (!entry) return null
  if (entry[DELETED]) return null
  return entry
}

export function isDeleted(table: string, id: string | number): boolean {
  return read()[rowKey(table, id)]?.[DELETED] === true
}

export function mergeOverlay(
  table: string,
  id: string | number,
  patch: Record<string, unknown>,
): void {
  const overlay = read()
  const key = rowKey(table, id)
  // Drop undefined so an untouched form field does not blank a real value —
  // the tab components pass `value || undefined` for empty inputs.
  const clean = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  )
  overlay[key] = { ...(overlay[key] ?? {}), ...clean }
  write(overlay)
}

export function markDeleted(table: string, id: string | number): void {
  const overlay = read()
  overlay[rowKey(table, id)] = { [DELETED]: true }
  write(overlay)
}

/** Ids for rows created in the demo. Negative so they cannot collide with snapshot ids. */
export function nextCreatedId(): number {
  const overlay = read()
  const lowest = Object.keys(overlay)
    .map(k => Number(k.split(':')[1]))
    .filter(n => !Number.isNaN(n) && n < 0)
    .reduce((min, n) => Math.min(min, n), 0)
  return lowest - 1
}

export function hasEdits(): boolean {
  return Object.keys(read()).length > 0
}

export function resetDemo(): void {
  memory = {}
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nothing to do — memory is already cleared
  }
  resetTasks()
}
