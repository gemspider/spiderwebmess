'use client'

// Appearance for one layer.
//
// Opened from the layer's own symbol swatch — it already sits on the row and already
// means "this is how this layer looks", so the control costs no extra chrome in a
// 280px panel.
//
// A bottom sheet on phones, a centred dialog on desktop. Editing an object's
// properties is what a sheet is for, and the 280px column has no room for a ramp
// preview that has to be judged at a glance.

import * as Dialog from '@radix-ui/react-dialog'
import { X, Check, RotateCcw } from 'lucide-react'
import { RAMPS, SWATCHES, NO_CLASS_SWATCHES, DEFAULT_RAMP } from '@/lib/palettes'
import { useStyleStore, SIZE_STEPS, DEFAULT_SIZE, DEFAULT_NO_CLASS } from '@/lib/store/styleStore'
import { levelInk } from '@/modules/kanal/datenblatt'
import type { LayerConfig } from '@/lib/registry'
import { cn } from '@/lib/utils'

interface Props {
  layer: LayerConfig
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** A palette, as a grid of swatches. */
function Swatches({ options = SWATCHES, value, onPick }: {
  options?: { name: string; value: string }[]
  value: string
  onPick: (hex: string) => void
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {options.map(sw => {
        const active = value.toLowerCase() === sw.value.toLowerCase()
        return (
          <button
            key={sw.value}
            type="button"
            title={sw.name}
            aria-label={sw.name}
            aria-pressed={active}
            onClick={() => onPick(sw.value)}
            className={cn(
              'flex aspect-square items-center justify-center rounded-lg border-2 transition-all',
              active ? 'border-ink' : 'border-transparent hover:border-border-strong',
            )}
            style={{ background: sw.value }}
          >
            {active && (
              <Check className="h-4 w-4" style={{ color: levelInk(1, sw.value) }} aria-hidden />
            )}
          </button>
        )
      })}
    </div>
  )
}

export function LayerStyleSheet({ layer, open, onOpenChange }: Props) {
  const {
    rampId, layerColor, layerSize, layerNoClass,
    setRamp, setLayerColor, setLayerSize, setLayerNoClass,
    resetLayer, resetAll, isCustomised,
  } = useStyleStore()

  // A layer with a legend is classified 1–5 and takes a ramp; anything else is drawn
  // in one colour.
  const isClassified = Boolean(layer.legendItems?.length)
  const current = layerColor[layer.id] ?? layer.color
  const size = layerSize[layer.id] ?? DEFAULT_SIZE
  const noClass = layerNoClass[layer.id] ?? DEFAULT_NO_CLASS
  const isLine = layer.symbol === 'line' || layer.symbol === 'dashed-line'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[2000] bg-ink/50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-[2001] flex max-h-[85vh] flex-col rounded-t-2xl bg-surface shadow-sheet data-[state=open]:animate-slide-up
                     sm:inset-0 sm:m-auto sm:h-fit sm:max-w-md sm:rounded-2xl sm:data-[state=open]:animate-fade-in"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="truncate text-[15px] font-semibold text-ink">
                {layer.label}
              </Dialog.Title>
              <Dialog.Description className="text-[12px] text-ink-dim">
                {isLine ? 'Farbe und Linienstärke' : 'Farbe und Punktgröße'}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-1.5 text-ink-dim transition-colors hover:bg-surface-muted">
              <X className="h-4 w-4" aria-hidden />
              <span className="sr-only">Schließen</span>
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {/* Size comes first. It is one 44px row, where the palette for a classified
                layer is five cards — on a phone, putting colour first pushes the size
                control off screen entirely. Discrete steps rather than a free slider:
                the useful range is narrow, and a stop you can land on beats chasing a
                pixel value. The preview is the real symbol at the real size. */}
            <section>
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-dim">
                  {isLine ? 'Linienstärke' : 'Punktgröße'}
                </h3>
                <span className="font-mono text-[11px] tabular-nums text-ink-faint">
                  {Math.round(size * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {SIZE_STEPS.map(step => {
                  const active = Math.abs(step - size) < 0.01
                  return (
                    <button
                      key={step}
                      type="button"
                      aria-pressed={active}
                      aria-label={`${Math.round(step * 100)} Prozent`}
                      onClick={() => setLayerSize(layer.id, step)}
                      className={cn(
                        'flex h-11 flex-1 items-center justify-center rounded-lg border transition-all',
                        active
                          ? 'border-brand bg-brand-light ring-1 ring-brand'
                          : 'border-border bg-white hover:border-border-strong',
                      )}
                    >
                      {isLine ? (
                        <span
                          className="w-6 rounded-full"
                          style={{ height: Math.max(2, 4 * step), background: current }}
                        />
                      ) : (
                        <span
                          className="rounded-full"
                          style={{
                            width: 12 * step,
                            height: 12 * step,
                            background: current,
                            border: '1.5px solid #fff',
                            boxShadow: '0 0 0 1px rgb(0 0 0 / .12)',
                          }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </section>

            <div className="my-4 h-px bg-border" />

            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-dim">
                {isClassified ? 'Farbskala der Zustandsklassen' : 'Farbe'}
              </h3>
              {isClassified ? (
                <ul className="space-y-2">
                  {RAMPS.map(ramp => {
                    const active = ramp.id === rampId
                    return (
                      <li key={ramp.id}>
                        <button
                          type="button"
                          onClick={() => setRamp(ramp.id)}
                          aria-pressed={active}
                          className={cn(
                            'w-full rounded-xl border p-3 text-left transition-all',
                            active
                              ? 'border-brand bg-brand-light ring-1 ring-brand'
                              : 'border-border bg-white hover:border-border-strong',
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex-1 text-[13.5px] font-semibold text-ink">
                              {ramp.name}
                              {ramp.isStandard && (
                                <span className="ml-2 rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium text-ink-dim">
                                  Norm
                                </span>
                              )}
                            </span>
                            {active && <Check className="h-4 w-4 text-brand" aria-hidden />}
                          </div>

                          {/* Previewed as the legend, with the class numbers on it — the
                              question is "can I tell 3 from 4", not "are these nice". */}
                          <div className="mt-2 flex gap-1">
                            {ramp.colors.map((c, i) => (
                              <span
                                key={i}
                                className="flex h-7 flex-1 items-center justify-center rounded font-mono text-[11px] font-semibold tabular-nums"
                                style={{ background: c, color: levelInk(i + 1, c) }}
                              >
                                {i + 1}
                              </span>
                            ))}
                          </div>

                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <Swatches value={current} onPick={hex => setLayerColor(layer.id, hex)} />
              )}
            </section>

            {/* The unsurveyed ones. Three quarters of the Schächte have no SBZ, so this
                is most of what is on the map — and until now the one colour that could
                not be changed. It is separate from the ramp on purpose: "not assessed"
                is not a sixth class, and putting it on the scale would imply it is. */}
            {isClassified && (
              <>
                <div className="my-4 h-px bg-border" />
                <section>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-dim">
                    Ohne Zustandsklasse
                  </h3>
                  <Swatches
                    options={NO_CLASS_SWATCHES}
                    value={noClass}
                    onPick={hex => setLayerNoClass(layer.id, hex)}
                  />
                </section>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-border px-4 py-3">
            <button
              type="button"
              onClick={() => {
                resetLayer(layer.id)
                if (isClassified) setRamp(DEFAULT_RAMP)
              }}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:bg-surface-muted"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Standard
            </button>

            {/* Only offered once something has actually been changed — a permanent
                "reset everything" invites a misclick that undoes work elsewhere. */}
            {isCustomised() && (
              <button
                type="button"
                onClick={resetAll}
                className="rounded-xl px-2 py-2 text-[12.5px] font-medium text-ink-dim underline decoration-dotted transition-colors hover:text-ink"
              >
                Alle Ebenen
              </button>
            )}
            <Dialog.Close className="ml-auto rounded-xl bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover">
              Fertig
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
