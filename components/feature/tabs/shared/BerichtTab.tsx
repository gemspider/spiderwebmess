'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { SectionHead, inputCls } from './InfoPrimitives'
import type { FormProps } from '@/lib/registry'

export function BerichtTab(_: FormProps) {
  const [project, setProject] = useState('2024-2026_Zone1')

  const reports = [
    { icon: '📄', title: 'Datenblatt PDF',     sub: 'Technische Daten & Längsprofil', color: '#2563eb' },
    { icon: '📊', title: 'Inspektionsbericht', sub: 'TV-Inspektion Ergebnisse',       color: '#7c3aed' },
    { icon: '🗺️', title: 'Lageplan Export',    sub: 'Karte als PDF / PNG',            color: '#0891b2' },
  ]

  return (
    <div className="space-y-5">
      <SectionHead>Berichte</SectionHead>

      <div className="space-y-2">
        {reports.map(r => (
          <button
            key={r.title}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border hover:border-brand hover:bg-brand-light transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${r.color}15` }}>
              {r.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink group-hover:text-brand transition-colors">{r.title}</p>
              <p className="text-xs text-ink-dim mt-0.5">{r.sub}</p>
            </div>
            <span className="text-ink-dim group-hover:text-brand text-sm transition-colors flex-shrink-0">↓</span>
          </button>
        ))}
      </div>

      <SectionHead>Reinigungsabfrage</SectionHead>

      <div className="flex gap-2">
        <select value={project} onChange={e => setProject(e.target.value)} className={`flex-1 ${inputCls}`}>
          <option>2024-2026_Zone1</option>
          <option>2024-2026_Zone2</option>
          <option>2022-2024_Gesamt</option>
        </select>
        <Button variant="primary" size="sm" className="px-4">👁 Anzeigen</Button>
      </div>
    </div>
  )
}
