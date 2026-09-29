'use client'

interface RatingButtonsProps {
  label: string
  value: number
  onChange: (v: number) => void
  max?: number
}

const COLORS = ['#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444']
const LABELS = ['Sehr gut', 'Gut', 'Mittel', 'Schlecht', 'Sehr schlecht']

export function RatingButtons({ label, value, onChange, max = 5 }: RatingButtonsProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm font-medium text-ink">{label}</p>
        {value > 0 && (
          <span className="text-xs font-semibold" style={{ color: COLORS[value - 1] }}>
            {value} – {LABELS[value - 1]}
          </span>
        )}
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: max }, (_, i) => i + 1).map(n => {
          const active = n === value
          const col    = COLORS[n - 1]
          return (
            <button
              key={n}
              onClick={() => onChange(active ? 0 : n)}
              className="flex-1 h-9 rounded-xl text-sm font-bold transition-all border"
              style={{
                background:  active ? col : `${col}12`,
                color:       active ? '#fff' : col,
                borderColor: active ? col : `${col}35`,
                boxShadow:   active ? `0 1px 6px ${col}50` : 'none',
              }}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}
