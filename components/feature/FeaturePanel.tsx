'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMapStore } from '@/lib/store/mapStore'
import { getModule, getTabsForFeature, getForm, LEVEL_COLORS } from '@/lib/registry'
import { conditionBadge, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import MiniMap from '@/components/map/MiniMap'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { AddTaskSheet } from './AddTaskSheet'
import { objectLabel } from '@/modules/kanal/datenblatt'
import { taskColor } from '@/components/map/layers/kanal'
import { TaskActions } from './TaskActions'
import type { SymbolType } from '@/lib/registry'
import type { FeatureCollection, LineString, Point } from 'geojson'

// ─── Feature data fetcher ─────────────────────────────────────────────────────

async function fetchFeatureData(
  moduleId: string,
  featureType: string,
  featureId: string,
): Promise<Record<string, unknown>> {
  const mod = await import(`../../modules/${moduleId}/api`)
  const fetcher = mod[`fetch${capitalize(featureType)}`]
  if (!fetcher) throw new Error(`No fetcher for ${moduleId}/${featureType}`)
  const row = await fetcher(Number(featureId))
  if (!row) throw new Error(`Feature ${featureId} not found`)
  return row as Record<string, unknown>
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── WFS geometry lookup ──────────────────────────────────────────────────────
// featureType → WFS React Query cache key (matches keys in layers/kanal.tsx)
const WFS_CACHE_KEY: Record<string, string> = {
  schacht:   'kanal-schaechte',
  haltung:   'kanal-haltungen',
  wartung:   'kanal-wartungen',
  kontrolle: 'kanal-wartungen',  // same WFS layer, filtered by typ='Aufgabe'
  reinigung: 'kanal-reinigungen',
}

function useWFSGeom(moduleId: string | null, featureType: string | null, featureId: string | null) {
  const qc = useQueryClient()
  if (!moduleId || !featureType || !featureId) return null
  const cacheKey = WFS_CACHE_KEY[featureType]
  if (!cacheKey) return null
  const fc = qc.getQueryData<FeatureCollection>(['wfs', cacheKey])
  if (!fc) return null
  return fc.features.find(f => String(f.properties?.id ?? f.id) === featureId) ?? null
}

// ─── Mini-map props from WFS geometry ────────────────────────────────────────

function miniMapProps(
  wfsFeature: GeoJSON.Feature,
  featureType: string,
  color: string,
): { center: [number,number]; zoom: number; color: string; symbolType: SymbolType; polyline?: [number,number][] } {
  if (featureType === 'haltung' || featureType === 'reinigung') {
    const geom    = wfsFeature.geometry as LineString
    const polyline = geom.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
    const mid     = polyline[Math.floor(polyline.length / 2)] ?? [0, 0]
    return { center: mid, zoom: 17, color, symbolType: featureType === 'reinigung' ? 'dashed-line' : 'line', polyline }
  }
  const geom   = wfsFeature.geometry as Point
  const center: [number, number] = [geom.coordinates[1], geom.coordinates[0]]
  if (featureType === 'wartung') {
    return { center, zoom: 18, color, symbolType: 'pin' }
  }
  return { center, zoom: 18, color, symbolType: 'circle' }
}

// ─── Feature Panel ────────────────────────────────────────────────────────────

export function FeaturePanel() {
  const {
    selectedFeatureId, selectedModule, selectedFeatureType,
    selectFeature, activeTab, setActiveTab, setFlyTo,
  } = useMapStore()

  const enabled = !!(selectedFeatureId && selectedModule && selectedFeatureType)

  const { data: feature, isLoading, isError } = useQuery({
    queryKey: ['feature', selectedModule, selectedFeatureType, selectedFeatureId],
    queryFn:  () => fetchFeatureData(selectedModule!, selectedFeatureType!, selectedFeatureId!),
    enabled,
  })

  // WFS geometry is already in cache from the map layer — use it for the mini-map
  // so we don't need Flask to return coordinates.
  const wfsFeature = useWFSGeom(selectedModule, selectedFeatureType, selectedFeatureId)

  if (!enabled) return null

  const moduleConfig = getModule(selectedModule!)
  const ftConfig     = moduleConfig?.featureTypes[selectedFeatureType!]

  if (!moduleConfig || !ftConfig) return null

  // Condition badge from the feature's condition field.
  //
  // A Wartung's conditionField is `status`, which is 0/1 rather than an ISYBAU class,
  // so it fell through conditionBadge to 'Unbekannt'. Tasks get their own wording, and
  // anything genuinely unclassified shows no badge — a chip reading "Unbekannt" is
  // less informative than no chip, and it sat next to every unsurveyed Schacht too.
  const isTask = selectedFeatureType === 'wartung'
  const isNetworkObject = selectedFeatureType === 'schacht' || selectedFeatureType === 'haltung'
  const conditionValue = feature
    ? (feature[ftConfig.conditionField ?? ''] as number | undefined)
    : undefined
  const badge = isTask
    ? (Number(conditionValue) === 1
        ? { label: 'fertig',         color: '#16a34a' }
        : { label: 'in Bearbeitung', color: '#e60000' })
    : conditionBadge(conditionValue)
  const showBadge = isTask || badge.label !== 'Unbekannt'
  const color = isTask
    // A task's colour is its sub-layer's, so the mini-map pin matches the map pin.
    ? taskColor(feature?.typ, feature?.status)
    : (conditionValue ? (LEVEL_COLORS[conditionValue] ?? ftConfig.color) : ftConfig.color)

  const visibleTabs = getTabsForFeature(selectedModule!, selectedFeatureType!)
  const currentTab  = visibleTabs.find(t => t.id === activeTab)?.id ?? visibleTabs[0]?.id
  const TabContent  = currentTab ? getForm(selectedModule!, selectedFeatureType!, currentTab) : null

  const mmProps = wfsFeature
    ? miniMapProps(wfsFeature, selectedFeatureType!, color)
    : null
  const center = mmProps?.center ?? [0, 0]

  const handleLocate = () => {
    setFlyTo(center)
    selectFeature(null)
  }

  return (
    <aside
      className={cn(
        'bg-white flex flex-col overflow-hidden',
        'md:absolute md:inset-0 md:z-[1200] md:flex-row md:animate-fade-in',
        'max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:top-12',
        'max-md:z-[1100] max-md:rounded-t-2xl max-md:shadow-2xl max-md:border-t max-md:border-border',
        'max-md:animate-slide-up',
      )}
    >
      {/* ── Left column: spatial context ─────────────────────────────────── */}
      <div className="flex flex-col flex-shrink-0 md:w-[380px] md:border-r md:border-border md:h-full md:overflow-hidden">

        {/* Drag handle — mobile only */}
        <div className="md:hidden flex-shrink-0 flex justify-center pt-2.5 pb-1">
          <div className="w-9 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 bg-surface-soft border-b border-border flex-shrink-0">
          <nav className="flex items-center gap-1.5 mb-2.5 text-sm">
            <button onClick={() => selectFeature(null)} className="text-brand font-medium hover:underline">
              ← Karte
            </button>
            <span className="text-border-strong">›</span>
            <span className="text-ink-dim">{moduleConfig.label}</span>
            <span className="text-border-strong">›</span>
            <span className="text-ink-dim">{ftConfig.label}</span>
            <span className="text-border-strong">›</span>
            <span className="text-ink font-medium truncate max-w-[120px]">{selectedFeatureId}</span>
          </nav>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
                style={{ background: `${color}18`, borderColor: `${color}30`, color }}
              >
                <ftConfig.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                {/* A task has no designation of its own — objectLabel would fall all
                    the way through to the row id, and a panel headed "-1" says nothing.
                    It is named by what it is and what it is on, the way the original
                    titles its dialog. */}
                <p className="text-base font-bold text-ink truncate">
                  {isTask
                    ? ((feature?.wartungsart as string) || (feature?.aufgabe as string) || ftConfig.label)
                    : objectLabel(feature, selectedFeatureId!)}
                </p>
                <p className="text-sm text-ink-dim mt-0.5 truncate">
                  {isTask && feature?.objektname
                    ? <>{ftConfig.label} · <span className="font-mono">{feature.objektname as string}</span></>
                    : ftConfig.label}
                </p>
              </div>
            </div>
            {showBadge && <Badge label={badge.label} color={badge.color} className="flex-shrink-0" />}
          </div>
        </div>

        {/* Mini-map section */}
        <div className="flex flex-col gap-2.5 p-3 md:flex-1 md:min-h-0">
          <div
            className="relative rounded-xl overflow-hidden border-2 border-border h-[150px] md:h-auto md:flex-1 md:min-h-0"
            style={{ boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.07)' }}
          >
            {mmProps && center[0] !== 0 ? (
              <MiniMap key={selectedFeatureId} {...mmProps} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-soft text-ink-dim text-xs">
                {isLoading ? 'Lade…' : 'Keine Koordinaten'}
              </div>
            )}

            <span className="absolute top-2 left-2 z-[1100] bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-ink-muted uppercase tracking-widest px-2 py-0.5 rounded-md border border-border/60 shadow-sm pointer-events-none select-none">
              Lageplan
            </span>
            {center[0] !== 0 && (
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1100] bg-black/50 text-white text-[10px] font-mono px-2 py-0.5 rounded pointer-events-none whitespace-nowrap select-none">
                {center[0].toFixed(4)}° N &nbsp;{center[1].toFixed(4)}° E
              </span>
            )}
          </div>

          <button
            onClick={handleLocate}
            className="flex-shrink-0 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="8" cy="8" r="3" />
              <line x1="8" y1="1" x2="8" y2="5" /><line x1="8" y1="11" x2="8" y2="15" />
              <line x1="1" y1="8" x2="5" y2="8" /><line x1="11" y1="8" x2="15" y2="8" />
            </svg>
            Auf Hauptkarte anzeigen
          </button>
        </div>
      </div>

      {/* ── Right column: tabs + content + footer ────────────────────────── */}
      <div className="flex flex-col flex-1 min-h-0 min-w-0">

        {/* A strip of one tab is a label pretending to be a control. Schacht and
            Haltung have a single detail list, so it is not drawn for them. */}
        {visibleTabs.length > 1 && (
        <div className="flex border-b border-border flex-shrink-0 overflow-x-auto bg-white">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-shrink-0 px-4 py-2.5 text-sm border-b-2 transition-all whitespace-nowrap',
                currentTab === tab.id
                  ? 'text-brand border-brand font-medium'
                  : 'text-ink-dim border-transparent hover:text-ink-muted',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
          {isLoading && (
            <div className="flex items-center justify-center h-32 text-ink-dim text-sm">
              Daten werden geladen…
            </div>
          )}
          {isError && (
            <div className="flex items-center justify-center h-32 text-red-500 text-sm">
              Fehler beim Laden der Daten.
            </div>
          )}
          {feature && TabContent && (
            <TabContent
              feature={feature}
              moduleId={selectedModule!}
              featureType={selectedFeatureType!}
            />
          )}
        </div>

        {/* Footer. A task is edited from here, reachable from all three of its tabs.
            A network object gets the two things the original offers on it: raise a new
            maintenance task, or open the datasheet. */}
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-t border-border bg-white px-4 py-2.5">
          {isTask && selectedFeatureId ? (
            <TaskActions taskId={selectedFeatureId} />
          ) : (
            <Button variant="ghost" size="sm" onClick={() => selectFeature(null)}>✕ Schließen</Button>
          )}
          {isNetworkObject && (
            <>
              <div className="ml-auto flex items-center gap-2">
                <AddTaskSheet
                  objektName={objectLabel(feature, selectedFeatureId!)}
                  objektTyp={ftConfig.label}
                  objektId={selectedFeatureId!}
                  featureType={selectedFeatureType as 'haltung' | 'schacht'}
                  // The pin goes where the mini-map is already centred: the point
                  // itself, or the midpoint of the line.
                  position={mmProps && center[0] !== 0 ? center : null}
                />
                <Link
                  href={`/datenblatt/?id=${selectedFeatureId}${selectedFeatureType === 'haltung' ? '&typ=haltung' : ''}`}
                  className="flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                  <FileText className="h-4 w-4" aria-hidden />
                  Datenblatt
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
