/**
 * Active modules — the only file you touch to add a new GIS domain.
 *
 * To add Wasser:
 *   1. Create modules/wasser/ (index.ts, types.ts, api.ts, forms/)
 *   2. Import WasserModule below and add it to the array
 */

import { registerModules } from '@/lib/registry'
import { KanalModule }     from './kanal'

// ─── Register all active modules ─────────────────────────────────────────────

registerModules([
  KanalModule,
  // WasserModule,
  // BrueckeModule,
])

// Re-export for convenience
export { KanalModule }
