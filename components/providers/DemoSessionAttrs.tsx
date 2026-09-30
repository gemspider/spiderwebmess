'use client'

// Fills the data attributes TopBar reads off the DOM.
//
// In the real app app/layout.tsx does this server-side: it reads the spider_access
// cookie, decodes the JWT payload and renders data-username / data-fachschale. A
// static export has no request context, so the same attributes are set on the client
// from the demo session. TopBar stays byte-identical to spider-gis.

import { useEffect, useState } from 'react'
import { readSession } from '@/lib/demoSession'
import { useMapStore } from '@/lib/store/mapStore'
import { hydrateStyle } from '@/lib/store/styleStore'

export function DemoSessionAttrs({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ username: string; fachschale: string }>({
    username:   '',
    fachschale: '',
  })
  // data-module drives the accent colour (see globals.css): the Fachschale you are
  // working in should be legible from the chrome, not just the breadcrumb.
  const activeModule = useMapStore(s => s.activeModule)

  useEffect(() => {
    const s = readSession()
    if (s) setSession({ username: s.username, fachschale: s.fachschale })
    // Reading localStorage during render would desync hydration; do it after mount.
    hydrateStyle()
  }, [])

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      data-module={activeModule}
      data-username={session.username}
      data-fachschale={session.fachschale}
    >
      {children}
    </div>
  )
}
