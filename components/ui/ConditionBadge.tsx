'use client'

// ISYBAU condition 1–5, shown as a chip.
//
// The number is always present, not just the colour: levels 3 (yellow) and 4 (amber)
// are hard to tell apart on a phone in daylight, and roughly 8% of men cannot separate
// 1 (green) from 5 (red) at all. Colour is reinforcement here, never the sole carrier.

import { LEVEL_LABEL, levelInk } from '@/modules/kanal/datenblatt'
import { useLevelColors } from '@/lib/store/styleStore'
import { cn } from '@/lib/utils'

interface Props {
  level: number
  /** 'chip' is the inline square; 'band' is the full-width header row. */
  variant?: 'chip' | 'band'
  label?: string
  className?: string
}

export function ConditionBadge({ level, variant = 'chip', label, className }: Props) {
  const bg = useLevelColors()[level]
  // Ink follows the chosen ramp, not a fixed table: Viridis class 1 is near-black and
  // Cividis class 5 is bright yellow, so a hardcoded foreground would be unreadable on
  // roughly half the palettes.
  const fg = levelInk(level, bg)

  if (variant === 'band') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border px-3 py-2.5',
          className,
        )}
        // A 12%-alpha wash of the level colour, so the band reads as the same signal
        // as the chip without shouting at full saturation.
        style={{ background: `${bg}1f`, borderColor: `${bg}66` }}
      >
        <span
          className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 font-mono text-base font-semibold tabular-nums"
          style={{ background: bg, color: fg }}
        >
          {level}
        </span>
        <span className="text-sm font-semibold text-ink">
          {label ? `${label} — ` : ''}{LEVEL_LABEL[level]}
        </span>
      </div>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex h-[22px] min-w-[26px] items-center justify-center rounded px-1.5',
        'font-mono text-[12.5px] font-semibold tabular-nums',
        className,
      )}
      style={{ background: bg, color: fg }}
      title={LEVEL_LABEL[level]}
    >
      {level}
    </span>
  )
}
