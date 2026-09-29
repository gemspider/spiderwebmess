'use client'
import { useState } from 'react'
import { useMapStore } from '@/lib/store/mapStore'
import { Toggle } from '@/components/ui/Toggle'
import { getFullLayerTree } from '@/lib/registry'
import type { LayerConfig } from '@/lib/registry'
import type { BaseTile } from '@/lib/tiles'
import { cn } from '@/lib/utils'

// ─── Base tile selector ───────────────────────────────────────────────────────

const BASE_TILES: { value: BaseTile; label: string }[] = [
  { value: 'orthofoto',    label: 'Orthofoto' },
  { value: 'osm',          label: 'OSM (basemap.at)' },
  { value: 'openstreetmap', label: 'OpenStreetMap' },
]

function HintergrundSection() {
  const { baseTile, setBaseTile } = useMapStore()
  const [open, setOpen] = useState(true)

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-1 rounded-md cursor-pointer hover:bg-surface-soft select-none"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-xs font-semibold text-ink-muted flex-1">Hintergrund</span>
        <span className="text-[9px] text-ink-dim">{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <div className="ml-3 border-l border-border pl-2 space-y-0.5">
          {BASE_TILES.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-2 py-1 px-1.5 rounded-md cursor-pointer hover:bg-surface-soft"
            >
              <input
                type="radio"
                name="baseTile"
                value={value}
                checked={baseTile === value}
                onChange={() => setBaseTile(value)}
                className="accent-brand w-3.5 h-3.5 flex-shrink-0"
              />
              <span className="text-xs text-ink-muted">{label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── GIS Symbols ─────────────────────────────────────────────────────────────

function LayerSymbol({ layer }: { layer: LayerConfig }) {
  const c = layer.color

  // Multi-color swatch for layers classified by legend items
  if (layer.legendItems && layer.legendItems.length > 0) {
    const swatches = layer.legendItems.slice(0, 5)
    if (layer.legendType === 'bar') {
      return (
        <div className="flex gap-px flex-shrink-0">
          {swatches.map(item => (
            <span key={item.color} className="w-3 h-2 rounded-sm" style={{ background: item.color }} />
          ))}
        </div>
      )
    }
    return (
      <div className="flex gap-0.5 flex-shrink-0">
        {swatches.map(item => (
          <svg key={item.color} width="10" height="10" viewBox="0 0 10 10">
            <circle cx="5" cy="5" r="4" fill="white" stroke={item.color} strokeWidth="1.8" />
            <circle cx="5" cy="5" r="1.5" fill={item.color} />
          </svg>
        ))}
      </div>
    )
  }

  if (layer.symbol === 'pin') {
    return (
      <svg width="14" height="18" viewBox="0 0 14 18" fill="none" className="flex-shrink-0">
        <path
          d="M7 0C3.13 0 0 3.13 0 7c0 4.97 7 11 7 11S14 11.97 14 7c0-3.87-3.13-7-7-7z"
          fill={c}
          stroke="white"
          strokeWidth="1.2"
        />
        <circle cx="7" cy="7" r="2.8" fill="white" opacity="0.85" />
      </svg>
    )
  }

  if (layer.symbol === 'line') {
    return (
      <svg width="22" height="8" viewBox="0 0 22 8" className="flex-shrink-0">
        <line x1="1" y1="4" x2="21" y2="4" stroke={c} strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    )
  }

  if (layer.symbol === 'dashed-line') {
    return (
      <svg width="22" height="8" viewBox="0 0 22 8" className="flex-shrink-0">
        <line x1="1" y1="4" x2="21" y2="4" stroke={c} strokeWidth="3" strokeLinecap="round" strokeDasharray="5 3" />
      </svg>
    )
  }

  if (layer.symbol === 'circle') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" className="flex-shrink-0">
        <circle cx="7" cy="7" r="5.5" fill="white" stroke={c} strokeWidth="2.5" />
        <circle cx="7" cy="7" r="2" fill={c} />
      </svg>
    )
  }

  // Pure group node — no misleading symbol
  if (!layer.symbol) return null

  return <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c }} />
}

// ─── Legend items ─────────────────────────────────────────────────────────────

function LegendItems({ layer }: { layer: LayerConfig }) {
  if (!layer.legendItems) return null
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 py-1.5 px-1">
      {layer.legendItems.map(item => (
        <div key={item.label} className="flex items-center gap-1">
          {layer.legendType === 'dot' ? (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="4.5" fill="white" stroke={item.color} strokeWidth="2" />
              <circle cx="6" cy="6" r="1.5" fill={item.color} />
            </svg>
          ) : (
            <svg width="18" height="6" viewBox="0 0 18 6">
              <line x1="0" y1="3" x2="18" y2="3" stroke={item.color} strokeWidth="4" strokeLinecap="round" />
            </svg>
          )}
          <span className="text-[10px] text-ink-dim">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Individual layer item ────────────────────────────────────────────────────

function LayerItem({ layer }: { layer: LayerConfig }) {
  const { layerVisibility, toggleLayer } = useMapStore()
  const visible = layerVisibility[layer.id] ?? layer.defaultVisible

  return (
    <div className="flex items-center gap-2 py-1 px-1.5 rounded-md hover:bg-surface-soft group">
      <Toggle checked={visible} onChange={() => toggleLayer(layer.id)} size="sm" />
      <span className="text-xs text-ink-muted flex-1">{layer.label}</span>
      <LayerSymbol layer={layer} />
    </div>
  )
}

// ─── Collect all leaf layer IDs under a group ─────────────────────────────────

function collectLeafIds(layer: LayerConfig): string[] {
  if (!layer.children) return [layer.id]
  return layer.children.flatMap(collectLeafIds)
}

// ─── Collapsible layer group ──────────────────────────────────────────────────

function LayerGroup({ layer, depth = 0 }: { layer: LayerConfig; depth?: number }) {
  const [open, setOpen] = useState(true)
  const { layerVisibility, toggleLayer, setManyVisible } = useMapStore()

  const hasChildren  = !!layer.children
  const hasLegend    = !!layer.legendItems

  // Pure leaf with no legend — just a simple row
  if (!hasChildren && !hasLegend) return <LayerItem layer={layer} />

  const hasToggle = layer.id !== 'hintergrund'
  const visible   = layerVisibility[layer.id] ?? layer.defaultVisible

  function handleGroupToggle(e: React.MouseEvent) {
    e.stopPropagation()
    const next = !visible
    // Set the group flag itself
    toggleLayer(layer.id)
    // Cascade to all leaf descendants so map layers respond immediately
    if (layer.children) {
      setManyVisible(collectLeafIds(layer), next)
    }
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-1 rounded-md cursor-pointer hover:bg-surface-soft group select-none"
        onClick={() => setOpen(o => !o)}
      >
        {hasToggle && (
          <span onClick={handleGroupToggle}>
            <Toggle checked={visible} onChange={() => {}} size="sm" />
          </span>
        )}
        <span className={cn('text-xs flex-1', depth === 0 ? 'font-semibold text-ink-muted' : 'font-medium text-ink-muted')}>
          {layer.label}
        </span>
        <LayerSymbol layer={layer} />
        <span className="text-[9px] text-ink-dim ml-1">{open ? '▾' : '▸'}</span>
      </div>

      {open && (
        <div className={cn('ml-3 border-l border-border pl-2', depth > 0 && 'ml-4')}>
          {layer.children?.map(child => (
            <LayerGroup key={child.id} layer={child} depth={depth + 1} />
          ))}
          <LegendItems layer={layer} />
        </div>
      )}
    </div>
  )
}

// ─── WMS Import Panel ─────────────────────────────────────────────────────────

function WmsPanel() {
  const [wmsType, setWmsType] = useState('WMS')
  const [url, setUrl] = useState('')
  const types = ['WMS', 'WFS', 'GeoJSON', 'KMZ']

  return (
    <div className="mt-2 p-3 bg-surface-soft rounded-lg border border-border">
      <p className="text-[9px] font-bold tracking-widest text-ink-dim uppercase mb-2">Neue Ebene</p>
      <div className="flex gap-1 mb-2">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setWmsType(t)}
            className={cn(
              'flex-1 py-1 text-[9px] font-medium rounded border transition-all',
              wmsType === t
                ? 'bg-brand-light text-brand border-brand-border'
                : 'bg-white text-ink-dim border-border',
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <input
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="Dienst-URL eingeben..."
        className="w-full text-[11px] px-2 py-1.5 border border-border rounded-md outline-none focus:border-brand-border bg-white text-ink mb-1.5"
      />
      <input
        placeholder="Layer-Name..."
        className="w-full text-[11px] px-2 py-1.5 border border-border rounded-md outline-none focus:border-brand-border bg-white text-ink mb-2"
      />
      <button className="w-full py-1.5 bg-brand text-white text-[11px] font-medium rounded-md hover:bg-blue-700 transition-colors">
        ↑ Ebene laden
      </button>
    </div>
  )
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export function LayerSidebar() {
  const { sidebarOpen } = useMapStore()
  const [wmsOpen, setWmsOpen] = useState(false)
  const layerTree = getFullLayerTree()

  return (
    <aside
      className={cn(
        'h-full bg-surface-soft border-r border-border flex flex-col flex-shrink-0 overflow-hidden transition-all duration-200 ease-in-out',
        sidebarOpen ? 'w-[280px] opacity-100' : 'w-0 opacity-0 pointer-events-none',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 bg-ink flex-shrink-0">
        <span className="text-[9px] font-bold tracking-widest text-white/45 uppercase">Ebenen</span>
        <input
          placeholder="Suchen..."
          className="text-[11px] px-2 py-1 rounded-md outline-none bg-white/10 border border-white/10 focus:border-brand text-white placeholder:text-white/30 w-28"
        />
      </div>

      {/* Layer tree */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-0.5 scroll-thin">
        <HintergrundSection />
        <div className="h-px bg-border my-1.5 mx-1" />
        {layerTree.map((layer, i) => (
          <div key={layer.id}>
            <LayerGroup layer={layer} />
            {i < layerTree.length - 1 && (
              <div className="h-px bg-border my-1.5 mx-1" />
            )}
          </div>
        ))}

        {/* Add layer — shown to all users for now; scope via role later */}
        <>
          <div className="h-px bg-border my-1.5 mx-1" />
          <button
            onClick={() => setWmsOpen(o => !o)}
            className="w-full py-2 border border-dashed border-border rounded-lg text-[11px] text-ink-dim hover:border-brand hover:text-brand hover:bg-brand-light transition-all"
          >
            + WMS / WFS / GeoJSON
          </button>
          {wmsOpen && <WmsPanel />}
        </>
      </div>
    </aside>
  )
}
