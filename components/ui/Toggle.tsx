'use client'
import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  color?: string
  size?: 'sm' | 'md'
  disabled?: boolean
}

export function Toggle({
  checked,
  onChange,
  color = '#2563eb',
  size = 'md',
  disabled = false,
}: ToggleProps) {
  const w = size === 'sm' ? 28 : 32
  const h = size === 'sm' ? 14 : 16
  const knob = size === 'sm' ? 10 : 12
  const off = 2
  const on = w - knob - off

  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn('relative flex-shrink-0 rounded-full transition-colors duration-150 focus:outline-none', disabled && 'opacity-40 cursor-not-allowed')}
      style={{ width: w, height: h, background: checked ? color : '#e2e8f0' }}
    >
      <span
        className="absolute rounded-full bg-white shadow-sm transition-all duration-150"
        style={{ width: knob, height: knob, top: off, left: checked ? on : off }}
      />
    </button>
  )
}
