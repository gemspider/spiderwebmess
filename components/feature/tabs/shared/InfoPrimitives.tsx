// Shared presentational primitives for all module InfoTab forms.

export function SectionHead({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
      <span className="w-0.5 h-4 rounded-full bg-brand flex-shrink-0" />
      <span className="text-xs font-bold tracking-widest text-ink-dim uppercase">{children}</span>
    </div>
  )
}

export function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-sm text-ink-dim flex-shrink-0 mr-3">{label}</span>
      <span className="min-w-0 truncate text-right text-sm font-semibold text-ink">
        {value === null || value === undefined || value === '' ? '—' : value}
      </span>
    </div>
  )
}

export function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden shadow-sm bg-white">
      {children}
    </div>
  )
}

export const inputCls = [
  'w-full text-sm px-3 py-2.5 border border-border rounded-xl bg-white text-ink',
  'outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-blue-100',
].join(' ')
