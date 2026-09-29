// Field aliases — Finding 1 from.
//
// The Info tabs were written against column names that mostly do not exist on the
// kanal base tables. The populated values live in the GeoServer views under
// different names. Rather than edit the copied components (which would make the
// diff against spider-gis unreadable), the data layer renames the fields the
// components already ask for.
//
// Left side  = what the component reads   (e.g. SchachtInfoTab's s.tiefe)
// Right side = where the value actually is (e.g. schaechte_app.abstich)
//
// An alias only fills a field that is empty after the base+view merge, so a real
// column always wins over an aliased one.

// A bare string renames a field only when the target is empty. The object form adds:
//   format    — transform the value (used for display-only dates)
//   override  — replace the target even when it already has a value. Needed where the
//               base table holds a technically-correct but useless value, e.g.
//               schaechte.bezeichnung is the import transfer id ('H400012') while the
//               view's name is the identifier used everywhere else ('SA054-000353').
export type Alias =
  | string
  | { from: string; format?: (value: unknown) => unknown; override?: boolean }

const deAT = (value: unknown): unknown => {
  if (typeof value !== 'string') return value
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('de-AT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(d)
}

// Display-only date: safe to reformat for a German audience because nothing
// feeds it back into an <input type="date">.
const displayDate = (from: string): Alias => ({ from, format: deAT })

const SCHACHT: Record<string, Alias> = {
  // The base table's bezeichnung is the import transfer id; the view's name is the
  // Schacht number the operators actually use, and matches the Haltung convention.
  bezeichnung:          { from: 'name', override: true },
  deckel_nr:            'schacht_nr',
  tiefe:                'abstich',
  soh:                  'sohle',
  nennweite:            'durchmesser',
  schachtform:          'querschnitt',
  abdecktyp:            'schachtart',
  ueberprufer:          'inspekteur',   // vermesser is empty throughout the dump
  letzte_ueberpruefung: displayDate('letzte_ueb'),
  // art_der_ueberpruefung has no counterpart in the view — renders as '—'
}

const HALTUNG: Record<string, Alias> = {
  entwasserungssystem:  'entw_system',
  nennweite:            'breite',
  letzte_ueberpruefung: displayDate('letzte_ueb'),
}

const WARTUNG: Record<string, Alias> = {
  bezeichnung:  'objektname',   // the object the task is on, not its deckel nr
  eingabedatum: 'datum',        // feeds <input type="date"> — must stay YYYY-MM-DD
  beschreibung: 'aufgabe',
}

const REINIGUNG: Record<string, Alias> = {
  bezeichnung:      'name',
  letzte_reinigung: 'datum',    // feeds <input type="date">
  rv:               'reinigungsvorgang',
  zf:               'zufahrtschacht',
  vs:               'verschmutzungsgrad',
  anmerkung:        'reinigungshaltung_anmerkung',
}

export const ALIASES: Record<string, Record<string, Alias>> = {
  schaechte:   SCHACHT,
  haltungen:   HALTUNG,
  wartungen:   WARTUNG,
  reinigungen: REINIGUNG,
}

// Second-choice sources, tried when both the real field and its primary alias are
// empty. Keeps the panel populated without inventing values.
const FALLBACKS: Record<string, Record<string, string[]>> = {
  wartungen:   { beschreibung: ['taetigkeit', 'wartungsart', 'anmerkung'] },
  reinigungen: { anmerkung: ['reinigungstage_anmerkung', 'von_schacht_anmerkung'] },
}

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}

/**
 * Fills the field names the components expect from wherever the value really is.
 * Never overwrites a value the row already has.
 */
export function applyAliases(
  table: string,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const aliases = ALIASES[table]
  if (!aliases) return row

  const out = { ...row }

  for (const [target, alias] of Object.entries(aliases)) {
    const spec = typeof alias === 'string' ? { from: alias } : alias

    if (!spec.override && !isEmpty(out[target])) continue

    const value = row[spec.from]
    if (isEmpty(value)) continue

    out[target] = spec.format ? spec.format(value) : value
  }

  for (const [target, sources] of Object.entries(FALLBACKS[table] ?? {})) {
    if (!isEmpty(out[target])) continue
    for (const source of sources) {
      if (!isEmpty(row[source])) {
        out[target] = row[source]
        break
      }
    }
  }

  return out
}
