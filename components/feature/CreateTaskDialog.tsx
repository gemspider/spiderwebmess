'use client'

// Raise a maintenance task on a Schacht or a Haltung.
//
// The original does this in a modal with two tabs, Allgemein and Auftragsliste, and the
// order is not the order they are drawn in: you go to the second tab first, build the
// list of check items, press PARAMETER HINZUFÜGEN, and are dropped back on the first to
// set the interval and dates. Tabs that have to be used in a fixed order are a wizard
// wearing the wrong clothes, so this is a wizard — two steps, a visible position, and
// a primary button that says what happens next.
//
// The step order is the original's real order: check items, then scheduling. That is
// also the order that makes sense, because the check items are what the task *is*.

import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  X, Plus, Check, ArrowLeft, ArrowRight, CalendarDays, ClipboardList, AlertCircle,
} from 'lucide-react'
import {
  INTERVALLE, STANDARD_PARAMETER, createTask, nextDue, todayInput,
  type Intervall, type DemoTask,
} from '@/lib/demoTasks'
import { cn } from '@/lib/utils'

interface Props {
  art:        string                      // 'Sichtkontrolle' …
  objektName: string
  objektId:   string
  objektTyp:  'haltung' | 'schacht'
  objektLabel: string                     // 'Haltung' | 'Schacht'
  /** Where the pin goes: the point itself, or the midpoint of the line. */
  lat: number
  lng: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (task: DemoTask) => void
}

const fieldCls =
  'w-full rounded-xl border border-border bg-white px-3 py-2.5 text-[14px] text-ink ' +
  'outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20'

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-dim">
      {children}
    </span>
  )
}

export function CreateTaskDialog({
  art, objektName, objektId, objektTyp, objektLabel, lat, lng,
  open, onOpenChange, onCreated,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  // Check items typed into this dialog. Component state, not storage: they belong to
  // the task being raised, not to every task after it.
  const [eigene, setEigene] = useState<string[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [neu, setNeu] = useState('')
  const [fehler, setFehler] = useState<string | null>(null)

  const [intervall, setIntervall] = useState<Intervall>('einmalig')
  const [datum, setDatum] = useState(todayInput())
  const [naechste, setNaechste] = useState(todayInput())
  // Editing the next date by hand has to survive a later interval change being
  // *undone*, so the override is tracked rather than inferred from the value.
  const [naechsteManuell, setNaechsteManuell] = useState(false)
  const [aufgabe, setAufgabe] = useState('')

  // Reset on every open: this dialog is reached from five different buttons, and the
  // second one should not inherit the first one's half-filled form.
  useEffect(() => {
    if (!open) return
    setStep(1)
    setEigene([])
    setSelected([])
    setNeu('')
    setFehler(null)
    setIntervall('einmalig')
    const heute = todayInput()
    setDatum(heute)
    setNaechste(heute)
    setNaechsteManuell(false)
    setAufgabe('')
  }, [open, art])

  // The next date follows the interval until the user takes it over.
  useEffect(() => {
    if (!naechsteManuell) setNaechste(nextDue(datum, intervall))
  }, [datum, intervall, naechsteManuell])

  function toggle(name: string) {
    setFehler(null)
    setSelected(s => (s.includes(name) ? s.filter(x => x !== name) : [...s, name]))
  }

  const katalog = [...eigene, ...STANDARD_PARAMETER]

  function anlegenParameter() {
    const clean = neu.trim()
    if (!clean) return
    if (katalog.some(p => p.toLowerCase() === clean.toLowerCase())) {
      setFehler(`„${clean}“ steht schon in der Liste.`)
      return
    }
    setEigene(e => [clean, ...e])
    // Selected straight away — you typed it because you want it on this task.
    setSelected(s => [...s, clean])
    setNeu('')
    setFehler(null)
  }

  function weiter() {
    if (!selected.length) {
      setFehler('Mindestens ein Prüfpunkt muss gewählt sein.')
      return
    }
    setFehler(null)
    setStep(2)
  }

  function anlegen() {
    if (!aufgabe.trim()) {
      setFehler('Bitte die Aufgabe beschreiben.')
      return
    }
    const task = createTask({
      wartungsart: art,
      aufgabe:     aufgabe.trim(),
      intervall,
      datum,
      naechste,
      objektname:  objektName,
      objekt_id:   objektId,
      objekt_typ:  objektTyp,
      parameter:   selected,
      lat, lng,
    })
    onOpenChange(false)
    onCreated(task)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[2000] bg-ink/50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-[2001] flex max-h-[90vh] flex-col rounded-t-2xl bg-surface shadow-sheet data-[state=open]:animate-slide-up
                     sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[86vh] sm:max-w-lg sm:rounded-2xl sm:data-[state=open]:animate-fade-in"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex items-start gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="truncate text-[15px] font-semibold text-ink">
                {art} für {objektLabel}
              </Dialog.Title>
              <Dialog.Description className="truncate text-[12px] text-ink-dim">
                <span className="font-mono">{objektName}</span>
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-1.5 text-ink-dim transition-colors hover:bg-surface-muted">
              <X className="h-4 w-4" aria-hidden />
              <span className="sr-only">Schließen</span>
            </Dialog.Close>
          </div>

          {/* Position. Two steps do not need a progress bar, but they do need to say
              which one you are on and what is still coming. */}
          <ol className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-[12px]">
            {[
              { n: 1 as const, label: 'Prüfpunkte', Icon: ClipboardList },
              { n: 2 as const, label: 'Termin',     Icon: CalendarDays },
            ].map(({ n, label, Icon }) => (
              <li key={n} className="flex items-center gap-2">
                <span className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition-colors',
                  step === n ? 'bg-brand-light text-brand' : 'text-ink-dim',
                )}>
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </span>
                {n === 1 && <span className="text-border-strong">›</span>}
              </li>
            ))}
            <span className="ml-auto font-mono text-[11px] tabular-nums text-ink-faint">
              {step}/2
            </span>
          </ol>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {step === 1 ? (
              <>
                <Label>Neuer Prüfpunkt</Label>
                <div className="flex gap-2">
                  <input
                    value={neu}
                    onChange={e => { setNeu(e.target.value); setFehler(null) }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); anlegenParameter() } }}
                    placeholder="z. B. Deckel dicht"
                    className={fieldCls}
                  />
                  <button
                    type="button"
                    onClick={anlegenParameter}
                    disabled={!neu.trim()}
                    className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">Anlegen</span>
                  </button>
                </div>

                <div className="mt-4 mb-2 flex items-baseline justify-between">
                  <Label>Prüfpunkte wählen</Label>
                  <span className="font-mono text-[11px] tabular-nums text-ink-faint">
                    {selected.length} gewählt
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {katalog.map(name => {
                    const on = selected.includes(name)
                    return (
                      <li key={name}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          onClick={() => toggle(name)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all',
                            on
                              ? 'border-brand bg-brand-light'
                              : 'border-border bg-white hover:border-border-strong',
                          )}
                        >
                          <span className={cn(
                            'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                            on ? 'border-brand bg-brand text-white' : 'border-border-strong',
                          )}>
                            {on && <Check className="h-3 w-3" aria-hidden />}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">
                            {name}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Intervall</Label>
                  {/* Four options, so they are all on screen rather than behind a
                      dropdown — and each is a 44px target. */}
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {INTERVALLE.map(i => (
                      <button
                        key={i.id}
                        type="button"
                        aria-pressed={intervall === i.id}
                        onClick={() => setIntervall(i.id)}
                        className={cn(
                          'h-11 rounded-xl border px-2 text-[13px] font-medium transition-all',
                          intervall === i.id
                            ? 'border-brand bg-brand-light text-brand'
                            : 'border-border bg-white text-ink-muted hover:border-border-strong',
                        )}
                      >
                        {i.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <Label>Eingabedatum</Label>
                    <input
                      type="date" value={datum}
                      onChange={e => setDatum(e.target.value)}
                      className={fieldCls}
                    />
                  </label>
                  <label className="block">
                    <Label>Nächste Kontrolle</Label>
                    <input
                      type="date" value={naechste}
                      onChange={e => { setNaechste(e.target.value); setNaechsteManuell(true) }}
                      className={fieldCls}
                    />
                  </label>
                </div>
                {intervall !== 'einmalig' && !naechsteManuell && (
                  <p className="-mt-1 text-[12px] text-ink-dim">
                    Aus dem Intervall berechnet — überschreibbar.
                  </p>
                )}

                <label className="block">
                  <Label>Aufgabe</Label>
                  {/* Empty to start: what is actually to be done is the one thing only
                      the person raising it knows, and a prefilled "Reinigung" is a
                      default that gets saved unread. */}
                  <textarea
                    value={aufgabe}
                    onChange={e => { setAufgabe(e.target.value); setFehler(null) }}
                    rows={3}
                    placeholder={`Was ist zu tun? z. B. ${art} nach Starkregen`}
                    className={cn(fieldCls, 'resize-y placeholder:text-ink-faint')}
                  />
                </label>

                <div className="rounded-xl border border-border bg-surface-muted px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-dim">
                    Prüfpunkte
                  </p>
                  <p className="mt-1 text-[13px] text-ink-muted">{selected.join(' · ')}</p>
                </div>
              </div>
            )}

            {fehler && (
              <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-medium text-red-700">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                {fehler}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-border px-4 py-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:bg-surface-muted"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Zurück
              </button>
            )}
            {step === 1 ? (
              <button
                type="button"
                onClick={weiter}
                className="ml-auto flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                Weiter
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={anlegen}
                className="ml-auto flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                <Check className="h-4 w-4" aria-hidden />
                Aufgabe anlegen
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
