// Tasks raised in the demo: the date arithmetic, the catalogue, and the feature shape
// the map depends on.
//
// The feature shape is the part worth guarding. A created task is drawn by the same
// layer code as the snapshot's 329, which filters on `typ` and `status` — get either
// wrong and the pin is simply absent, with nothing in the console to say why.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  nextDue, INTERVALLE, STANDARD_PARAMETER,
  createTask, listTasks, getTask, deleteTask, taskAsFeature,
  getAnswers, setAnswer, resetTasks,
} from '../lib/demoTasks'
import { imagesFor, DEMO_IMAGES } from '../lib/demoImages'
import { ISYBAU_LEVELS } from '../lib/palettes'
import { zoomWeight } from '../lib/mapScale'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

// jsdom is not configured for this suite, so stand in for localStorage.
const store = new Map<string, string>()
beforeEach(() => {
  store.clear()
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage
})

const BASE = {
  wartungsart: 'Sichtkontrolle',
  aufgabe: 'Sichtkontrolle',
  intervall: 'einmalig' as const,
  datum: '2026-09-30',
  naechste: '2026-09-30',
  objektname: 'H132011',
  objekt_id: '169790',
  objekt_typ: 'haltung' as const,
  parameter: ['test', 'Reinigung OK'],
  lat: 47.7038,
  lng: 15.9985,
}

describe('nextDue', () => {
  it('leaves a one-off on its own date', () => {
    expect(nextDue('2026-09-30', 'einmalig')).toBe('2026-09-30')
  })

  it('adds the interval', () => {
    expect(nextDue('2026-09-30', 'woechentlich')).toBe('2026-10-07')
    expect(nextDue('2026-09-30', 'monatlich')).toBe('2026-10-30')
    expect(nextDue('2026-09-30', 'vierteljaehrlich')).toBe('2026-12-30')
  })

  it('crosses a year end', () => {
    expect(nextDue('2026-11-15', 'vierteljaehrlich')).toBe('2027-02-15')
  })

  it('clamps rather than rolling over a short month', () => {
    // 31 January plus one month is what an operator calls the end of February, not
    // the 3rd of March, which is where naive date arithmetic lands.
    expect(nextDue('2026-01-31', 'monatlich')).toBe('2026-02-28')
    expect(nextDue('2028-01-31', 'monatlich')).toBe('2028-02-29')  // leap year
  })

  it('survives a malformed date rather than throwing', () => {
    expect(nextDue('', 'monatlich')).toBe('')
  })

  it('covers every interval the dialog offers', () => {
    for (const i of INTERVALLE) expect(typeof nextDue('2026-09-30', i.id)).toBe('string')
  })
})

describe('the parameter catalogue', () => {
  it('is exactly the four the original offers, and nothing is added to it', () => {
    // A check item typed into the dialog goes on that task, not into this list — a
    // catalogue that grows with every demo run buries the four that matter.
    expect(STANDARD_PARAMETER).toEqual(['Baulich OK', 'Betrieblich OK', 'Funktion OK', 'Reinigung OK'])
  })

  it('is not written to storage at all', () => {
    createTask({ ...BASE, parameter: ['Deckel dicht'] })
    expect([...store.keys()]).not.toContain('spiderweb:demo-parameter')
  })

  it('still carries an ad-hoc item on the task that was raised with it', () => {
    const t = createTask({ ...BASE, parameter: ['Deckel dicht', 'Baulich OK'] })
    expect(getTask(t.id)?.parameter).toEqual(['Deckel dicht', 'Baulich OK'])
  })
})

describe('createTask', () => {
  it('assigns descending negative ids so they cannot collide with the snapshot', () => {
    expect(createTask(BASE).id).toBe(-1)
    expect(createTask(BASE).id).toBe(-2)
    expect(listTasks()).toHaveLength(2)
  })

  it('round-trips through storage', () => {
    const t = createTask(BASE)
    expect(getTask(t.id)?.parameter).toEqual(['test', 'Reinigung OK'])
    expect(getTask(String(t.id))?.objektname).toBe('H132011')
  })

  it('deletes', () => {
    const t = createTask(BASE)
    deleteTask(t.id)
    expect(getTask(t.id)).toBeNull()
  })
})

describe('taskAsFeature', () => {
  it('lands in the red "Kontrolle, in Bearbeitung" sub-layer', () => {
    // layers/kanal.tsx filters typ==='Aufgabe' && status===0 for that sub-layer. If
    // either changes the pin vanishes silently, which is why this is asserted.
    const f = taskAsFeature(createTask(BASE))
    expect(f.properties!.typ).toBe('Aufgabe')
    expect(Number(f.properties!.status)).toBe(0)
  })

  it('is GeoJSON in lng/lat order', () => {
    const f = taskAsFeature(createTask(BASE))
    expect(f.geometry.type).toBe('Point')
    expect(f.geometry.coordinates).toEqual([15.9985, 47.7038])
  })

  it('carries what the popup and the panel read', () => {
    const f = taskAsFeature(createTask(BASE))
    expect(f.properties!.wartungsart).toBe('Sichtkontrolle')
    expect(f.properties!.objektname).toBe('H132011')
    expect(f.properties!.id).toBeLessThan(0)
  })
})

describe('observation answers', () => {
  it('are per task and per parameter', () => {
    setAnswer(-1, 'test', true)
    setAnswer(-1, 'Reinigung OK', false)
    setAnswer(-2, 'test', false)
    expect(getAnswers(-1)).toEqual({ test: true, 'Reinigung OK': false })
    expect(getAnswers(-2)).toEqual({ test: false })
    expect(getAnswers(-3)).toEqual({})
  })

  it('distinguish "not answered" from "No"', () => {
    // An open task's unanswered item must not read as a No — that is the difference
    // between a check that failed and one nobody has done.
    setAnswer(-1, 'test', false)
    expect(getAnswers(-1).test).toBe(false)
    expect(getAnswers(-1)['Reinigung OK']).toBeUndefined()
  })
})

describe('resetTasks', () => {
  it('clears tasks and answers together', () => {
    createTask(BASE)
    setAnswer(-1, 'test', true)
    resetTasks()
    expect(listTasks()).toEqual([])
    expect(getAnswers(-1)).toEqual({})
  })
})

describe('demo images', () => {
  it('never repeats within a set until the pool is exhausted', () => {
    // Hashing each filename on its own put the same picture on two adjacent tiles
    // often enough to look like a bug — with a two-image pool that is a coin flip.
    for (const prefer of ['schacht', 'kanal', undefined] as const) {
      const refs = Array.from({ length: DEMO_IMAGES.length }, (_, i) => ({ id: i, name: `f${i}.jpg` }))
      const got = imagesFor(refs, prefer).map(r => r.image.src)
      expect(new Set(got).size).toBe(DEMO_IMAGES.length)
    }
  })

  it('leads with the preferred kind', () => {
    expect(imagesFor([{ id: 1, name: 'a.jpg' }], 'schacht')[0].image.kind).toBe('schacht')
    expect(imagesFor([{ id: 1, name: 'a.jpg' }], 'kanal')[0].image.kind).toBe('kanal')
  })

  it('is stable for the same object across visits', () => {
    const refs = [{ id: 1, name: 'Lage VSA 46.JPG' }, { id: 2, name: 'VSA 46 i.JPG' }]
    expect(imagesFor(refs, 'schacht').map(r => r.image.src))
      .toEqual(imagesFor(refs, 'schacht').map(r => r.image.src))
  })

  it('handles an empty set', () => {
    expect(imagesFor([], 'kanal')).toEqual([])
  })
})

describe('the condition ramp has one definition', () => {
  it('is what the existing application draws', () => {
    // Sampled from its legend and its map strokes. Not the nominal standard values —
    // it renders a softened set, and a map here has to look like a map there.
    expect(Object.values(ISYBAU_LEVELS))
      .toEqual(['#7ce345', '#2f6ef6', '#ffff55', '#f3ae3d', '#ea3323'])
  })

  it('is the same list Tailwind carries', async () => {
    // Tailwind's config is loaded in its own build context and cannot import the
    // palette, so it holds the only legitimate copy. This is the guard on that copy —
    // the values used to live in five places and correcting them missed three.
    const src = await readFile(path.resolve(__dirname, '..', 'tailwind.config.ts'), 'utf8')
    const block = src.slice(src.indexOf('level:'), src.indexOf('level:') + 500)
    for (const [level, hex] of Object.entries(ISYBAU_LEVELS)) {
      expect(block).toContain(`${level}: '${hex}'`)
    }
  })
})

describe('zoomWeight', () => {
  it('holds at 1 until the working zooms', () => {
    expect(zoomWeight(13)).toBe(1)
    expect(zoomWeight(16)).toBe(1)
  })

  it('grows as you approach, which is the whole point', () => {
    // A constant weight is why a line that read well at z16 became a thread at z20.
    expect(zoomWeight(18)).toBeGreaterThan(zoomWeight(16))
    expect(zoomWeight(20)).toBeGreaterThan(zoomWeight(18))
  })

  it('stops, so a DN 150 never covers the street it runs under', () => {
    expect(zoomWeight(22)).toBeLessThanOrEqual(3)
    expect(zoomWeight(30)).toBe(3)
  })
})
