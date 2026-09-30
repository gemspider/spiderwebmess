'use client'

// "Hinzufügen" — start a maintenance task on this object.
//
// The original is a native <select> beside a button: pick a type, press HINZUFÜGEN.
// That is two steps and a 16px hit target, which on a phone in a wet trench is the
// wrong shape. Here the button opens the list directly and each type is one full-width
// row — one tap instead of two, and a 48px target.
//
// Same sheet/dialog split as the layer appearance control: a bottom sheet on phones,
// where a dropdown anchored to a footer button would open off the bottom of the screen,
// and a centred dialog on desktop.
//
// Choosing a type hands over to CreateTaskDialog, which is where the task is built.

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, X, Eye, Droplets, RotateCcw, ClipboardCheck, Home } from 'lucide-react'
import { CreateTaskDialog } from './CreateTaskDialog'
import { useMapStore } from '@/lib/store/mapStore'
import { invalidateLayer } from '@/lib/snapshot'
import type { DemoTask } from '@/lib/demoTasks'
import type { IconComponent } from '@/lib/registry'

interface TaskType {
  id:    string
  label: string
  icon:  IconComponent
  hint:  string
}

/** The original's dropdown, in its order. */
const TASK_TYPES: TaskType[] = [
  { id: 'sichtkontrolle', label: 'Sichtkontrolle', icon: Eye,            hint: 'Begehung ohne Gerät' },
  { id: 'reinigung',      label: 'Reinigung',      icon: Droplets,       hint: 'Spülung oder Hochdruck' },
  { id: 'nachkontrolle',  label: 'Nachkontrolle',  icon: RotateCcw,      hint: 'Prüfung nach einer Maßnahme' },
  { id: 'bauabnahme',     label: 'Bauabnahme',     icon: ClipboardCheck, hint: 'Abnahme nach Bauarbeiten' },
  { id: 'ha-kontrolle',   label: 'HA-Kontrolle',   icon: Home,           hint: 'Hausanschluss' },
]

interface Props {
  objektName:  string
  objektTyp:   string                       // 'Haltung' | 'Schacht', for the heading
  objektId:    string
  featureType: 'haltung' | 'schacht'
  /** Where the new pin goes — the point, or the midpoint of the line. */
  position:    [number, number] | null
}

export function AddTaskSheet({ objektName, objektTyp, objektId, featureType, position }: Props) {
  const [open, setOpen] = useState(false)
  const [art, setArt] = useState<string | null>(null)
  const qc = useQueryClient()
  const selectFeature = useMapStore(s => s.selectFeature)

  function onCreated(task: DemoTask) {
    setArt(null)
    // The snapshot layer is memoised and React Query holds the collection, so both
    // have to be dropped or the new pin does not appear until a reload.
    invalidateLayer('wartungen')
    qc.invalidateQueries({ queryKey: ['wfs', 'kanal-wartungen'] })
    qc.invalidateQueries({ queryKey: ['layer-counts'] })
    // Straight into the task you just raised — that is what you opened this to do.
    selectFeature(String(task.id), 'kanal', 'wartung')
  }

  // Without a position there is nowhere to put the pin. The geometry comes from the
  // layer cache and is there for every feature you can have clicked, so this is a
  // guard rather than a case.
  const canCreate = position !== null

  return (
    <>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger
          disabled={!canCreate}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-ink-muted transition-colors hover:border-border-strong hover:bg-surface-muted disabled:opacity-40"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Hinzufügen
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[2000] bg-ink/50 data-[state=open]:animate-fade-in" />
          <Dialog.Content
            className="fixed inset-x-0 bottom-0 z-[2001] flex max-h-[85vh] flex-col rounded-t-2xl bg-surface shadow-sheet data-[state=open]:animate-slide-up
                       sm:inset-0 sm:m-auto sm:h-fit sm:max-w-md sm:rounded-2xl sm:data-[state=open]:animate-fade-in"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-[15px] font-semibold text-ink">
                  Neue Aufgabe
                </Dialog.Title>
                <Dialog.Description className="truncate text-[12px] text-ink-dim">
                  {objektTyp} <span className="font-mono">{objektName}</span>
                </Dialog.Description>
              </div>
              <Dialog.Close className="rounded-lg p-1.5 text-ink-dim transition-colors hover:bg-surface-muted">
                <X className="h-4 w-4" aria-hidden />
                <span className="sr-only">Schließen</span>
              </Dialog.Close>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <ul className="space-y-1.5">
                {TASK_TYPES.map(t => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => { setOpen(false); setArt(t.label) }}
                      className="flex w-full items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5 text-left transition-all hover:border-brand hover:bg-brand-light"
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-muted">
                        <t.icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-semibold text-ink">{t.label}</span>
                        <span className="block truncate text-[12px] text-ink-dim">{t.hint}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {art && position && (
        <CreateTaskDialog
          art={art}
          objektName={objektName}
          objektId={objektId}
          objektTyp={featureType}
          objektLabel={objektTyp}
          lat={position[0]}
          lng={position[1]}
          open={art !== null}
          onOpenChange={next => { if (!next) setArt(null) }}
          onCreated={onCreated}
        />
      )}
    </>
  )
}
