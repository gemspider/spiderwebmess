'use client'

// Registers public/sw.js.
//
// Written by hand rather than via next-pwa: the caching rules are five lines of
// policy  and a plugin whose normal target is a server
// build is a poor trade for that. No dependency, no build step, full control over
// what is precached — which matters here because the snapshot is 11 MB and must
// *not* be.

import { useEffect } from 'react'

export function ServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    // next dev serves an unbundled app; a worker caching it makes hot reload lie.
    if (process.env.NODE_ENV !== 'production') return

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration fails on http:// origins other than localhost, and in some
        // private modes. The app works fine without it — only offline support is lost.
      })
    }

    // Registering after load keeps the worker off the critical path for first paint.
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
  }, [])

  return null
}
