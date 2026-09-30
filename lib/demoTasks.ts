// Maintenance tasks raised in the demo, and the observation catalogue behind them.
//
// The real app POSTs to FastAPI, which writes kanal.wartungen plus a row per
// kanal.wartungsparameterwerte and returns the new id. There is no server here, so a
// created task lives in localStorage and is merged into the snapshot on read — see
// loadLayer() in lib/snapshot.ts for the map and buildRow() in lib/api.ts for the panel.
//
// It is kept apart from lib/demoStore (the *edit* overlay) because the shapes are
// different: that one is a patch onto an existing row, this one is a whole feature with
// geometry that has to appear on the map. Both are cleared by "Demo zurücksetzen".
//
// A created task is typ 'Aufgabe' with status 0, which is what the map draws as a red
// "in Bearbeitung" pin — the same sub-layer the original puts a new Kontrolle on.

import type { Feature, Point } from 'geojson'

const TASK_KEY  = 'spiderweb:demo-tasks'
const ANSWER_KEY = 'spiderweb:demo-beobachtungen'

/** Repeat rule for a task. The original's dropdown, in its order. */
export type Intervall = 'einmalig' | 'woechentlich' | 'monatlich' | 'vierteljaehrlich'

export const INTERVALLE: { id: Intervall; label: string; months?: number; days?: number }[] = [
  { id: 'einmalig',         label: 'einmalig' },
  { id: 'woechentlich',     label: 'wöchentlich',     days: 7 },
  { id: 'monatlich',        label: 'monatlich',       months: 1 },
  { id: 'vierteljaehrlich', label: 'vierteljährlich', months: 3 },
]

/**
 * The five things you can raise from an object, and how each names itself.
 *
 * `art` is what goes in kanal.wartungen.wartungsart and what the pin's popup shows.
 */
export const AUFGABEN_ARTEN = [
  'Sichtkontrolle', 'Reinigung', 'Nachkontrolle', 'Bauabnahme', 'HA-Kontrolle',
] as const

export interface DemoTask {
  id:            number          // negative, so it cannot collide with a snapshot id
  wartungsart:   string
  aufgabe:       string
  intervall:     Intervall
  datum:         string          // Eingabedatum, YYYY-MM-DD
  naechste:      string          // Nächste Kontrolle
  objektname:    string
  objekt_id:     string
  objekt_typ:    'haltung' | 'schacht'
  parameter:     string[]
  lat:           number
  lng:           number
  angelegt_am:   string
}

// ─── storage helpers ─────────────────────────────────────────────────────────
// Every access is wrapped: a private window makes localStorage throw rather than
// return null, and the demo has to keep working without persistence.

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota or private mode — it still holds for this page view.
  }
}

// ─── the parameter catalogue ─────────────────────────────────────────────────

/**
 * The four check items the original offers, and the whole catalogue.
 *
 * Nothing is added to it. A check item typed into the dialog belongs to the task being
 * raised, not to every task after it — otherwise the list grows with every demo run and
 * the next person picking check items wades through someone else's one-off entries.
 * The ad-hoc ones live in the dialog's own state and go on the task it creates.
 *
 * The snapshot's observation names are inspection-programme labels rather than check
 * items (328 of 329 read "Schachtueberpruefung_extern_2023"), so seeding from the data
 * would give a catalogue of one.
 */
export const STANDARD_PARAMETER = ['Baulich OK', 'Betrieblich OK', 'Funktion OK', 'Reinigung OK']

// ─── tasks ───────────────────────────────────────────────────────────────────

export function listTasks(): DemoTask[] {
  return read<DemoTask[]>(TASK_KEY, [])
}

export function getTask(id: number | string): DemoTask | null {
  return listTasks().find(t => String(t.id) === String(id)) ?? null
}

export function createTask(input: Omit<DemoTask, 'id' | 'angelegt_am'>): DemoTask {
  const tasks = listTasks()
  // Negative and descending, the same convention lib/demoStore uses for created rows.
  const id = tasks.reduce((min, t) => Math.min(min, t.id), 0) - 1
  const task: DemoTask = { ...input, id, angelegt_am: new Date().toISOString() }
  write(TASK_KEY, [...tasks, task])
  return task
}

export function deleteTask(id: number | string): void {
  write(TASK_KEY, listTasks().filter(t => String(t.id) !== String(id)))
}

/**
 * A created task as a map feature.
 *
 * The shape matches wartungen_tabelle_kanal, because layers/kanal.tsx filters on `typ`
 * and `status` and WartungPopup reads the same property names. typ 'Aufgabe' + status 0
 * is the red "Kontrolle, in Bearbeitung" sub-layer.
 */
export function taskAsFeature(t: DemoTask): Feature<Point> {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [t.lng, t.lat] },
    properties: {
      id:          t.id,
      typ:         'Aufgabe',
      status:      0,
      wartungsart: t.wartungsart,
      aufgabe:     t.aufgabe,
      datum:       t.datum,
      objektname:  t.objektname,
      anmerkung:   null,
      // Kept so the panel and the datasheet can lead back to the object.
      objekt_id:   t.objekt_id,
      objekt_typ:  t.objekt_typ,
      intervall:   t.intervall,
      naechste_kontrolle: t.naechste,
      demo:        true,
    },
  }
}

// ─── observation answers ─────────────────────────────────────────────────────
// Ja / Nein per (task, parameter). Separate from the task so answering one does not
// rewrite the whole record, and so answers on *snapshot* tasks work the same way.

type Answers = Record<string, Record<string, boolean>>

export function getAnswers(taskId: number | string): Record<string, boolean> {
  return read<Answers>(ANSWER_KEY, {})[String(taskId)] ?? {}
}

export function setAnswer(taskId: number | string, name: string, wert: boolean): void {
  const all = read<Answers>(ANSWER_KEY, {})
  all[String(taskId)] = { ...(all[String(taskId)] ?? {}), [name]: wert }
  write(ANSWER_KEY, all)
}

export function resetTasks(): void {
  for (const key of [TASK_KEY, ANSWER_KEY]) {
    try { localStorage.removeItem(key) } catch { /* already gone */ }
  }
}

// ─── dates ───────────────────────────────────────────────────────────────────

export function todayInput(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Next due date for an interval.
 *
 * Month arithmetic clamps rather than rolling over: 31 January plus one month is
 * 28 February, not 3 March, which is what an operator means by "monatlich".
 */
export function nextDue(from: string, intervall: Intervall): string {
  const rule = INTERVALLE.find(i => i.id === intervall)
  if (!rule || (!rule.days && !rule.months)) return from

  const [y, m, d] = from.split('-').map(Number)
  if (!y || !m || !d) return from

  if (rule.days) {
    const dt = new Date(Date.UTC(y, m - 1, d + rule.days))
    return dt.toISOString().slice(0, 10)
  }

  const targetMonth = m - 1 + (rule.months ?? 0)
  const year = y + Math.floor(targetMonth / 12)
  const month = ((targetMonth % 12) + 12) % 12
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const dt = new Date(Date.UTC(year, month, Math.min(d, lastDay)))
  return dt.toISOString().slice(0, 10)
}
