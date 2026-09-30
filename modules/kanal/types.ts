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
  // The rest of the original's "Info : Haltungen" window. All come from the GeoServer
  // view — the base table holds *_id foreign keys, not these labels.
  hoehe?:                number | null   // DN/Höhe, for a non-circular profile
  ortsteil?:             string | null
  zone?:                 string | null
  inbetriebnahme?:       string | null
  inspekteur?:           string | null
  wr_bewill?:            string | null   // Wasserrecht, Bewilligungszahl
  wr_datum?:             string | null
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
  // The rest of the original's "Info : Schächte" window. These are the GeoServer view's
  // own names; lib/fieldAliases fills the app's spellings alongside them, never over.
  schacht_nr?:         string | null
  strang?:             string | null
  entw_system?:        string | null
  sohle?:              number | null   // the view's name for soh
  abstich?:            number | null   // the view's name for tiefe
  name?:               string | null
  anmerkung?:          string | null
  ortsteil?:           string | null
  zone?:               string | null
  zone_neu?:           string | null
  querschnitt?:        string | null
  vermesser?:          string | null
  inbetriebnahme?:     string | null
  inspekteur?:         string | null
  gbz?:                number | null   // Gerinnebauzustand 1–5
  ffk?:                number | null   // Funktionsfähigkeit 1–5
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
