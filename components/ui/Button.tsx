'use client'
import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'success' | 'warning' | 'danger' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-blue-600',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  warning: 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200',
  danger:  'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
  ghost:   'bg-surface-soft text-ink-muted border border-border hover:bg-surface-muted',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md'
  fullWidth?: boolean
}

export function Button({
  variant = 'ghost',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-40',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
        fullWidth && 'w-full',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
