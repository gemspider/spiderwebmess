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
    //
    // Unregister rather than just skip: a worker registered by an earlier production
    // preview on the same origin keeps control and keeps serving its cached chunks,
    // which looks exactly like the dev server ignoring your edits. Preview now runs on
    // a different port so this cannot recur, but existing registrations still need
    // clearing.
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then(regs => {
        for (const reg of regs) reg.unregister()
        if (regs.length) {
          caches?.keys().then(keys => keys.forEach(k => caches.delete(k)))
          console.info('[dev] Removed a stale service worker and its caches. Reload once.')
        }
      }).catch(() => {})
      return
    }

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
