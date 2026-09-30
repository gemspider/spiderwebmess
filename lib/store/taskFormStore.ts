/**
 * Edit state for the open maintenance task.
 *
 * The original application puts Speichern / Foto / Löschen below the tab strip, so they
 * are reachable from any tab — but the fields they save live inside the Allgemein tab.
 * Rather than lift the whole form into the panel, the tab writes here and the footer
 * reads here.
 *
 * Deliberately a single open task, not a map: only one feature panel exists at a time,
 * and keeping per-id drafts around would mean deciding when to discard them.
 */

import { create } from 'zustand'

export interface TaskDraft {
  datum:     string
  status:    number
  wetter:    string
  anmerkung: string
}

interface TaskFormStore {
  /** Which task the draft belongs to — guards against a stale draft being saved. */
  taskId: string | null
  draft:  TaskDraft
  dirty:  boolean

  /** Called by the Allgemein tab when a task opens. Resets if it is a different one. */
  load:   (taskId: string, values: TaskDraft) => void
  patch:  (values: Partial<TaskDraft>) => void
  clear:  () => void
}

const EMPTY: TaskDraft = { datum: '', status: 1, wetter: '', anmerkung: '' }

export const useTaskFormStore = create<TaskFormStore>((set, get) => ({
  taskId: null,
  draft:  EMPTY,
  dirty:  false,

  load: (taskId, values) => {
    // Re-loading the same task must not wipe edits in progress — the tab remounts
    // whenever the user switches tabs and comes back.
    if (get().taskId === taskId) return
    set({ taskId, draft: values, dirty: false })
  },

  patch: values => set(s => ({ draft: { ...s.draft, ...values }, dirty: true })),

  clear: () => set({ taskId: null, draft: EMPTY, dirty: false }),
}))
