/**
 * Kanal module — TypeScript types.
 *
 * These map directly to DB column names as returned by the Flask API
 * (/db/table/kanal.*). Snake_case matches the PostgreSQL column names.
 * The prototype used camelCase friendly names; adapters live in api.ts.
 */

export interface KanalHaltung {
  id:                    number
  bezeichnung?:          string | null   // e.g. "HA054-002085"
  name?:                 string | null
  strang?:               string | null
  gemeinde_nummer?:      number
  gesamtschadensklasse?: number | null   // 1–5 (GSK)
  leitungsart?:          string | null
  entwasserungssystem?:  string | null
  material?:             string | null
  nennweite?:            number | null   // DN
  laenge?:               number | null
  gefaelle?:             number | null
  abwasserart?:          string | null
  letzte_ueberpruefung?: string | null
  anmerkung?:            string | null
  [key: string]: unknown
}

export interface KanalSchacht {
  id:                  number
  bezeichnung?:        string | null   // e.g. "SA054-001433"
  deckel_nr?:          string | null
  gemeinde_nummer?:    number
  sbz?:                number | null   // 1–5 (SBZ)
  schachtart?:         string | null
  material?:           string | null
  nennweite?:          number | null
  tiefe?:              number | null
  soh?:                number | null   // Sohle Oberkante Höhe
  dok?:                number | null   // Deckel Oberkante
  abdecktyp?:          string | null
  schachtform?:        string | null
  schachtbauzustand?:  number | null   // 1–5
  letzte_ueberpruefung?: string | null
  ueberprufer?:        string | null
  art_der_ueberpruefung?: string | null
  [key: string]: unknown
}

export interface KanalReinigung {
  id:              number
  haltung_id?:     string | null
  object_id?:      string | null
  laenge?:         number | null
  letzte_reinigung?: string | null
  geplant_datum?:  string | null
  gemeinde_nummer?: number
  [key: string]: unknown
}

export interface KanalWartung {
  id:            number
  objekt_name?:  string | null
  wartungstyp?:  string | null
  status?:       number          // 0 = offen, 1 = abgeschlossen
  beschreibung?: string | null
  eingabedatum?: string | null
  gemeinde_nummer?: number
  [key: string]: unknown
}
