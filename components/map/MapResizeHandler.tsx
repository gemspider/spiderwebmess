'use client'

// Keeps Leaflet's idea of the viewport in sync with the actual container size.
//
// Leaflet caches the container size and only recomputes it on window 'resize'. Several
// things change the size without firing that event, and each one leaves the map
// rendering into a stale viewport — tiles and vectors stop at the old edge and the rest
// of the container is blank grey:
//
//   · the layer sidebar animating between w-[280px] and w-0 (a flex sibling, so the
//     map's own width changes by 280px — on a 390px phone that is most of the screen)
//   · the mobile browser's address bar collapsing on scroll
//   · rotating the device
//   · launching from the home screen, where the PWA starts without browser chrome
//
// A ResizeObserver catches all of them, including the ones with no event at all.

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

export default function MapResizeHandler() {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()

    // Debounced: the sidebar transition is 200ms of continuous resizing, and
    // invalidateSize triggers a full tile + vector redraw each time it is called.
    let frame = 0
    const sync = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        // pan: false — recentring on every resize fights the user on a phone, where
        // the address bar collapses mid-gesture.
        map.invalidateSize({ animate: false, pan: false })
      })
    }

    const observer = new ResizeObserver(sync)
    observer.observe(container)

    // ResizeObserver covers container changes; these cover the cases where the
    // container keeps its size but the visual viewport does not.
    window.addEventListener('orientationchange', sync)
    document.addEventListener('visibilitychange', sync)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('orientationchange', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [map])

  return null
}
