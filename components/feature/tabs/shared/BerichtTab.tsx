'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FileText, ClipboardList, Map as MapIcon, ArrowRight, Download, Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SectionHead, inputCls } from './InfoPrimitives'
import type { FormProps } from '@/lib/registry'

export function BerichtTab({ feature, featureType }: FormProps) {
  const [project, setProject] = useState('2024-2026_Zone1')
  const id = feature?.id

  // The datasheet is a real view now, not an export — so this entry navigates to it
  // rather than pretending to produce a download. The other two have no generator
  // behind them yet and say so instead of failing silently on click.
  const reports = [
    {
      icon: FileText,
      title: 'Datenblatt',
      sub:   'Stammdaten, Zustand, Anschlüsse, Schäden',
      href:  featureType === 'schacht' && id ? `/datenblatt/?id=${id}` : null,
    },
    {
      icon: ClipboardList,
      title: 'Inspektionsbericht',
      sub:   'TV-Inspektion — noch nicht verfügbar',
      href:  null,
    },
    {
      icon: MapIcon,
      title: 'Lageplan Export',
      sub:   'Karte als PDF — noch nicht verfügbar',
      href:  null,
    },
  ]

  return (
    <div className="space-y-5">
      <SectionHead>Berichte</SectionHead>

      <div className="space-y-2">
        {reports.map(r => {
          const Icon = r.icon
          const body = (
            <>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-light">
                <Icon className="h-[18px] w-[18px] text-brand" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{r.title}</p>
                <p className="mt-0.5 text-xs text-ink-dim">{r.sub}</p>
              </div>
              {r.href
                ? <ArrowRight className="h-4 w-4 flex-shrink-0 text-ink-dim transition-colors group-hover:text-brand" aria-hidden />
                : <Download   className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />}
            </>
          )

          return r.href ? (
            <Link
              key={r.title}
              href={r.href}
              className="group flex w-full items-center gap-3 rounded-xl border border-border p-3.5 text-left transition-all hover:border-brand hover:bg-brand-light"
            >
              {body}
            </Link>
          ) : (
            <div
              key={r.title}
              aria-disabled="true"
              className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl border border-border p-3.5 text-left opacity-55"
            >
              {body}
            </div>
          )
        })}
      </div>

      <SectionHead>Reinigungsabfrage</SectionHead>

      <div className="flex gap-2">
        <select value={project} onChange={e => setProject(e.target.value)} className={`flex-1 ${inputCls}`}>
          <option>2024-2026_Zone1</option>
          <option>2024-2026_Zone2</option>
          <option>2022-2024_Gesamt</option>
        </select>
        <Button variant="primary" size="sm" className="flex items-center gap-1.5 px-4">
          <Eye className="h-4 w-4" aria-hidden />
          Anzeigen
        </Button>
      </div>
    </div>
  )
}
