'use client'

// Speichern / Foto / Löschen for the open maintenance task.
//
// In the panel footer rather than inside a tab, because the original keeps them
// reachable from all three tabs — you can be reading Beobachtungen and still save the
// date you changed on Allgemein. The fields live in taskFormStore; this reads them.

import { useState } from 'react'
import { Save, Camera, Trash2, Check, AlertTriangle } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { saveWartung } from '@/modules/kanal/api'
import { fetchWartungDetail } from '@/modules/kanal/wartung'
import { listPhotos } from '@/lib/photoStore'
import { PhotoDialog } from './PhotoDialog'
import { useTaskFormStore } from '@/lib/store/taskFormStore'
import { useMapStore } from '@/lib/store/mapStore'

type State = 'idle' | 'saving' | 'saved' | 'error'

export function TaskActions({ taskId }: { taskId: string }) {
  const { draft, dirty, clear } = useTaskFormStore()
  const selectFeature = useMapStore(s => s.selectFeature)
  const qc = useQueryClient()
  const [state, setState] = useState<State>('idle')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [photosOpen, setPhotosOpen] = useState(false)

  // Snapshot references plus anything captured on this device — the button shows a
  // count so it is obvious whether there is something to look at before opening.
  const { data: detail } = useQuery({
    queryKey: ['wartung-detail', taskId],
    queryFn:  () => fetchWartungDetail(taskId),
  })
  const { data: captured = [] } = useQuery({
    queryKey: ['task-photos', taskId, photosOpen],
    queryFn:  () => listPhotos(taskId),
  })
  const existing = detail?.bilder ?? []
  const photoCount = existing.length + captured.length

  async function save() {
    setState('saving')
    try {
      await saveWartung({
        id:           Number(taskId),
        eingabedatum: draft.datum || undefined,
        status:       draft.status,
        wetter:       draft.wetter || undefined,
        beschreibung: draft.anmerkung || undefined,
      })
      // The panel reads through React Query, so the row has to be refetched for the
      // saved value to appear without closing and reopening the task.
      await qc.invalidateQueries({ queryKey: ['feature'] })
      setState('saved')
      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('error')
    }
  }

  async function remove() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    clear()
    selectFeature(null)
  }

  return (
    <div className="flex w-full items-center gap-2">
      <button
        type="button"
        onClick={save}
        disabled={state === 'saving' || !dirty}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-45"
      >
        {state === 'saved'
          ? <><Check className="h-4 w-4" aria-hidden /> Gespeichert</>
          : state === 'error'
            ? <><AlertTriangle className="h-4 w-4" aria-hidden /> Fehler</>
            : state === 'saving'
              ? 'Speichert…'
              : <><Save className="h-4 w-4" aria-hidden /> Speichern</>}
      </button>

      <button
        type="button"
        onClick={() => setPhotosOpen(true)}
        title="Bild aufnehmen oder auswählen"
        className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm text-ink-muted transition-colors hover:bg-surface-muted"
      >
        <Camera className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Foto</span>
        {photoCount > 0 && (
          <span className="rounded-full bg-surface-sunken px-1.5 font-mono text-[11px] tabular-nums text-ink-muted">
            {photoCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={remove}
        onBlur={() => setConfirmDelete(false)}
        title="Aufgabe löschen"
        className={
          confirmDelete
            ? 'flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2.5 text-sm font-semibold text-white'
            : 'flex items-center rounded-xl border border-red-200 px-3 py-2.5 text-red-600 transition-colors hover:bg-red-50'
        }
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        {confirmDelete && <span>Wirklich?</span>}
      </button>

      <PhotoDialog
        taskId={taskId}
        existing={existing}
        open={photosOpen}
        onOpenChange={setPhotosOpen}
      />
    </div>
  )
}
