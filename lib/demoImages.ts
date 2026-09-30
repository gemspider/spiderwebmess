// Pictures for the demo.
//
// The database stores photo *references* only — kanal.externedateien has the filename
// and a GUID, and the files themselves live on the inspection contractor's media. The
// original application therefore renders empty tiles, and so did this: a sheet that
// says "3 Bilder" and shows three grey boxes.
//
// For a stakeholder walkthrough that is the wrong kind of honest. A handful of real
// inspection frames ship with the app instead, and every reference resolves to one of
// them — deterministically, by filename, so the same Schacht shows the same picture on
// every visit and two different objects do not look like the same survey.
//
// They are illustrative, not the object's own photographs. Anything that displays them
// says so; see `ILLUSTRATIVE` below, which is the text to use.

export interface DemoImage {
  src:     string
  /** What is actually in the frame, for alt text and the caption. */
  caption: string
  kind:    'kanal' | 'schacht'
}

export const DEMO_IMAGES: DemoImage[] = [
  {
    src: '/demo/inspektion/kanal-01.jpg',
    caption: 'Kamerabefahrung — Anfangsknoten',
    kind: 'kanal',
  },
  {
    src: '/demo/inspektion/kanal-02.jpg',
    caption: 'Kamerabefahrung — Endknoten mit Zulauf',
    kind: 'kanal',
  },
  {
    src: '/demo/inspektion/schacht-01.jpg',
    caption: 'Schachtdeckel geöffnet',
    kind: 'schacht',
  },
  {
    src: '/demo/inspektion/schacht-02.jpg',
    caption: 'Schachtdeckel — Aufsicht',
    kind: 'schacht',
  },
]

export const ILLUSTRATIVE =
  'Beispielaufnahmen — die Originaldateien liegen nicht in der Datenbank, nur die Referenz.'

/**
 * Stable hash of a reference, so the same filename always maps to the same picture.
 *
 * djb2. It only has to spread a few thousand filenames over four buckets without
 * clumping, and a hash that changes between runs would make the demo look like the
 * photographs move around.
 */
function hash(value: string): number {
  let h = 5381
  for (let i = 0; i < value.length; i++) h = ((h << 5) + h + value.charCodeAt(i)) >>> 0
  return h
}

/**
 * The pool for a set, with the right sort of frame first.
 *
 * `prefer` puts the matching kind at the front — a Schacht sheet leading with a pipe
 * interior reads as the wrong photograph, even when the caption says illustrative — but
 * the rest stay available, because a set longer than the preferred kind has to keep
 * going somewhere.
 */
function pool(prefer?: 'kanal' | 'schacht'): DemoImage[] {
  if (!prefer) return DEMO_IMAGES
  const first = DEMO_IMAGES.filter(i => i.kind === prefer)
  return [...first, ...DEMO_IMAGES.filter(i => i.kind !== prefer)]
}

/**
 * Pictures for a list of references, in the list's own order.
 *
 * Hashing each reference independently put the same picture on two adjacent tiles often
 * enough to look like a bug — with a two-image pool a collision is a coin flip. So the
 * set picks a starting point from its first filename and then walks the pool, which
 * gives a stable assignment per object and never repeats until the pool is exhausted.
 */
export function imagesFor(
  references: { id: number; name: string }[],
  prefer?: 'kanal' | 'schacht',
): { id: number; name: string; image: DemoImage }[] {
  const list = pool(prefer)
  if (!references.length) return []
  const start = hash(references[0].name || String(references[0].id)) % list.length
  return references.map((r, i) => ({ ...r, image: list[(start + i) % list.length] }))
}

/** One picture, for a single reference with no set around it. */
export function imageFor(reference: string, prefer?: 'kanal' | 'schacht'): DemoImage {
  const list = pool(prefer)
  return list[hash(reference) % list.length]
}
