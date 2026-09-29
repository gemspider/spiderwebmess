'use client'
import { useState, useEffect } from 'react'
import { useMapStore } from '@/lib/store/mapStore'
import { getModules } from '@/lib/registry'
import { cn } from '@/lib/utils'
// Demo-only: basePath '/spider' is gone, so the logout href would 404, and without
// clearing the session DemoGate would bounce straight back to the map.
// This is the single sanctioned edit to a copied component — see CLAUDE.md.
import { signOut } from '@/lib/demoSession'

function useUsername(): string {
  const [username, setUsername] = useState('')
  useEffect(() => {
    const el = document.querySelector('[data-username]')
    setUsername(el?.getAttribute('data-username') ?? '')
  }, [])
  return username
}

// ─── User avatar initials ─────────────────────────────────────────────────────

function Avatar({ username }: { username: string }) {
  const initials = username
    .split(/[\s._-]/)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? '')
    .join('') || '?'

  return (
    <div className="w-7 h-7 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
      {initials}
    </div>
  )
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

export function TopBar() {
  const {
    sidebarOpen, toggleSidebar,
    activeModule, setActiveModule,
    searchQuery,  setSearchQuery,
  } = useMapStore()

  const modules  = getModules()
  const username = useUsername()

  return (
    <header className="h-12 bg-ink flex items-center gap-2.5 px-3 flex-shrink-0 z-30 shadow-md">

      {/* Logo */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2.5" fill="white"/>
            <line x1="8" y1="1"    x2="8"    y2="5.5"   stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            <line x1="8" y1="10.5" x2="8"    y2="15"    stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            <line x1="1" y1="8"    x2="5.5"  y2="8"     stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            <line x1="10.5" y1="8" x2="15"   y2="8"     stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            <line x1="2.9"  y1="2.9"  x2="6"    y2="6"    stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity=".65"/>
            <line x1="10"   y1="10"   x2="13.1" y2="13.1" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity=".65"/>
            <line x1="13.1" y1="2.9"  x2="10"   y2="6"    stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity=".65"/>
            <line x1="6"    y1="10"   x2="2.9"  y2="13.1" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity=".65"/>
          </svg>
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-bold text-white leading-tight tracking-tight">Spider GIS</p>
          <p className="text-[10px] text-white/45 leading-tight">AWV Mittleres Schwarzatal</p>
        </div>
      </div>

      <div className="w-px h-5 bg-white/10 flex-shrink-0" />

      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        title="Ebenen ein-/ausblenden"
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
          sidebarOpen
            ? 'bg-brand text-white shadow-sm'
            : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white',
        )}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <rect x="2" y="2" width="12" height="12" rx="1.5" />
          <line x1="6" y1="2" x2="6" y2="14" />
        </svg>
      </button>

      <div className="w-px h-5 bg-white/10 flex-shrink-0" />

      {/* Module tabs */}
      {modules.length > 1 && (
        <nav className="hidden md:flex items-center gap-0.5 bg-white/8 rounded-lg p-0.5">
          {modules.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                activeModule === m.id
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/50 hover:text-white/80',
              )}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </nav>
      )}

      {/* Search */}
      <div className="flex-1 min-w-0 max-w-xs">
        <div className="flex items-center gap-2 bg-white/10 border border-white/12 rounded-lg px-2.5 py-1.5 focus-within:border-brand focus-within:bg-white/15 transition-colors">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/40 flex-shrink-0">
            <circle cx="5.5" cy="5.5" r="4" />
            <line x1="9" y1="9" x2="12" y2="12" />
          </svg>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Objekt suchen…"
            className="flex-1 text-xs bg-transparent outline-none text-white placeholder:text-white/35 min-w-0"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white/70 text-xs">✕</button>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2.5 ml-auto">
        <a
          href="/login"
          onClick={signOut}
          className="hidden sm:block text-xs text-white/45 hover:text-white/80 transition-colors"
          title="Abmelden"
        >
          {username || 'Abmelden'}
        </a>
        <Avatar username={username} />
      </div>
    </header>
  )
}
