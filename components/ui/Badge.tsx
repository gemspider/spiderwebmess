'use client'
import { cn } from '@/lib/utils'

interface BadgeProps {
  label: string
  color: string
  className?: string
}

export function Badge({ label, color, className }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border', className)}
      style={{
        background: `${color}18`,
        color,
        borderColor: `${color}40`,
      }}
    >
      {label}
    </span>
  )
}
