// Wartung detail — the data behind the task dialog's tabs.
//
// Two of the three tabs live outside kanal.wartungen, which is what made this look
// thinner than it is:
//
//   Beobachtungen      kanal.wartungsparameterwerte → the observation name and a
//                      boolean `wert` (the Ja/Nein toggle in the original)
//   Folgetätigkeiten   `folgetaetigkeit` sits on wartungsparameterwerte, *not* on the
//                      task — plus erfuellt_am / erfuellt_von from the task itself
//   Bilder             kanal.externedateien by wartung_id, filenames only

import { loadJSON } from '@/lib/staticData'
import { loadLayerNameIndex } from '@/lib/snapshot'
import { getTask, getAnswers } from '@/lib/demoTasks'

export interface Beobachtung {
  name:   string
  /** true = Ja. Absent means the observation was not confirmed. */
  wert?:  boolean
  folge?: string
}

export interface WartungBild {
  id:   number
  name: string
}

export interface WartungDetail {
  beobachtungen?: Beobachtung[]
  bilder?:        WartungBild[]
}

/**
 * Inspection frames for the object a task was raised on.
 *
 * Only 1 of the 329 tasks in this snapshot carries a photo reference of its own, so a
 * gallery built from the task alone is empty everywhere. The *object* is a different
 * story: every task names a Schacht in `objektname`, all 329 resolve, and 298 of those
 * Schächte have references on them. Those are what an operator opening a task expects
 * to see — the pictures of the manhole the task is about.
 *
 * They are the object's, not the task's, and the gallery labels them that way.
 */
export async function fetchObjektBilder(objektname?: string): Promise<WartungBild[]> {
  if (!objektname) return []
  try {
    const [byName, sheets] = await Promise.all([
      loadLayerNameIndex('schaechte'),
      loadJSON<Record<string, { fotos?: WartungBild[] }>>('/data/details/datenblatt.json'),
    ])
    const id = byName.get(objektname)
    return id ? (sheets[id]?.fotos ?? []) : []
  } catch {
    return []
  }
}

export async function fetchWartungDetail(id: number | string): Promise<WartungDetail | null> {
  // A task raised in this demo carries its check items instead of a snapshot row.
  const task = getTask(id)
  if (task) {
    const answers = getAnswers(id)
    return { beobachtungen: task.parameter.map(name => ({ name, wert: answers[name] })) }
  }

  try {
    const all = await loadJSON<Record<string, WartungDetail>>('/data/details/wartung_detail.json')
    const row = all[String(id)] ?? null
    if (!row) return null
    // Answers given in the demo win over the snapshot's, so a toggle sticks.
    const answers = getAnswers(id)
    if (!Object.keys(answers).length) return row
    return {
      ...row,
      beobachtungen: (row.beobachtungen ?? []).map(b =>
        b.name in answers ? { ...b, wert: answers[b.name] } : b),
    }
  } catch {
    return null
  }
}
