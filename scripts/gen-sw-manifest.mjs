// Build-time precache manifest for public/sw.js.
//
// Why this exists: on a visitor's very first load the browser fetches the HTML, CSS
// and JS chunks *before* the service worker has registered and activated, so those
// requests never pass through the worker and never land in its cache. A later offline
// reload then serves the cached HTML with no JS behind it, and the app does not boot.
//
// So the asset list is produced after `next build` (the filenames are content-hashed
// and unknowable before then) and precached explicitly on install.
//
// The list's own hash doubles as the cache version, which is what makes a redeploy
// evict the previous snapshot instead of serving stale data forever.
//
// Wired as `postbuild` in web/package.json — not something to run by hand.
//
// It lives under web/ rather than the repo-root scripts/ on purpose: Vercel's Root
// Directory is `web`, and by default the build step cannot see files outside it.

import { createHash } from 'node:crypto'
import { readdir, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// <repo>/web — resolved from this file, so it does not depend on the working directory.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'out')

// Everything needed to boot the app shell offline. Deliberately excludes /data/*:
// 11 MB of snapshot on install would make the first visit unusable, so those are
// runtime-cached by sw.js on first use instead.
const PRECACHE_DIRS = ['_next/static']
const PRECACHE_FILES = [
  '/',
  '/login/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/data/manifest.json',
]

async function walk(dir, base = dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full, base)))
    else out.push('/' + path.relative(OUT, full).split(path.sep).join('/'))
  }
  return out
}

async function main() {
  try {
    await stat(OUT)
  } catch {
    console.error('gen-sw-manifest: web/out/ not found — run next build first')
    process.exit(1)
  }

  const assets = [...PRECACHE_FILES]

  for (const dir of PRECACHE_DIRS) {
    const full = path.join(OUT, dir)
    try {
      const found = await walk(full)
      // Source maps are dead weight in a precache.
      assets.push(...found.filter(f => !f.endsWith('.map')))
    } catch {
      // Directory absent — nothing to add.
    }
  }

  const version = createHash('sha256').update(assets.sort().join('\n')).digest('hex').slice(0, 12)

  await writeFile(
    path.join(OUT, 'sw-assets.json'),
    JSON.stringify({ version, assets }, null, 2),
  )

  console.log(`  sw-assets.json  ${assets.length} files precached, version ${version}`)
}

await main()
