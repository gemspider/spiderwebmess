// Snapshot loader — the demo's entire network layer.
//
// In the real app this role is split between next.config.js rewrites (GeoServer,
// FastAPI) and middleware.ts (Bearer token injection). Here there is no server:
// every byte comes from web/public/data/, committed at build time.

export interface SnapshotManifest {
  generated_at: string
  source:       string
  community_id: number
  srid:         number
  anonymised:   number
  layers:       string[]
  details:      string[]
}

const DATA_ROOT = '/data'

// Memoise the in-flight promise, not just the result, so concurrent callers share
// one request. The four Wartung sub-layers in layers/kanal.tsx mount at the same
// time and React Query dedupes them, but lib/api.ts reads the same files on its
// own path — without this, a first feature click would refetch 3.4 MB.
const inflight = new Map<string, Promise<unknown>>()

export function loadJSON<T>(path: string): Promise<T> {
  let p = inflight.get(path)

  if (!p) {
    // force-cache: snapshot files are immutable per deploy (vercel.json sets
    // max-age=31536000, immutable), so let the HTTP cache and service worker serve them.
    p = fetch(path, { cache: 'force-cache' }).then(res => {
      if (!res.ok) throw new Error(`snapshot ${path}: HTTP ${res.status}`)
      return res.json()
    })

    // A failed load must not be cached — a flaky first request would otherwise
    // poison the layer for the rest of the session.
    p.catch(() => inflight.delete(path))
    inflight.set(path, p)
  }

  return p as Promise<T>
}

export function loadManifest(): Promise<SnapshotManifest> {
  return loadJSON<SnapshotManifest>(`${DATA_ROOT}/manifest.json`)
}

export function layerPath(name: string): string {
  return `${DATA_ROOT}/layers/${name}.json`
}

export function detailPath(table: string): string {
  return `${DATA_ROOT}/details/${table}.json`
}
