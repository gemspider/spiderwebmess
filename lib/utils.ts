import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { LEVEL_COLORS } from './registry'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('de-AT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(value))
  } catch {
    return value
  }
}

/**
 * Returns a badge label + color for a feature based on its condition field value.
 * conditionValue: GSK or SBZ level (1–5), or status string.
 */
export function conditionBadge(conditionValue: number | string | null | undefined): {
  label: string
  color: string
} {
  const STATUS_LABELS = ['Sehr gut', 'Gut', 'Mittel', 'Schlecht', 'Sehr schlecht']

  if (typeof conditionValue === 'number' && conditionValue >= 1 && conditionValue <= 5) {
    return {
      label: `${STATUS_LABELS[conditionValue - 1]}`,
      color: LEVEL_COLORS[conditionValue],
    }
  }

  // String status fallback (e.g. wartung status: 0 = offen, 1 = done)
  if (conditionValue === 'ok' || conditionValue === 1) {
    return { label: 'OK', color: LEVEL_COLORS[1] }
  }
  if (conditionValue === 'warning') {
    return { label: 'In Bearbeitung', color: LEVEL_COLORS[3] }
  }
  if (conditionValue === 'critical') {
    return { label: 'Kritisch', color: LEVEL_COLORS[5] }
  }

  return { label: 'Unbekannt', color: '#94a3b8' }
}
