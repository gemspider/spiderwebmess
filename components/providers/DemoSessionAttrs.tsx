'use client'

// Fills the data attributes TopBar reads off the DOM.
//
// In the real app app/layout.tsx does this server-side: it reads the spider_access
// cookie, decodes the JWT payload and renders data-username / data-fachschale. A
// static export has no request context, so the same attributes are set on the client
// from the demo session. TopBar stays byte-identical to spider-gis.

import { useEffect, useState } from 'react'
import { readSession } from '@/lib/demoSession'

export function DemoSessionAttrs({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ username: string; fachschale: string }>({
    username:   '',
    fachschale: '',
  })

  useEffect(() => {
    const s = readSession()
    if (s) setSession({ username: s.username, fachschale: s.fachschale })
  }, [])

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      data-username={session.username}
      data-fachschale={session.fachschale}
    >
      {children}
    </div>
  )
}
