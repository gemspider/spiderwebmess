import { BerichtTab }       from '@/components/feature/tabs/shared/BerichtTab'
import { ReinigungTab }     from '@/components/feature/tabs/shared/ReinigungTab'
import { HaltungInfoTab }   from './forms/HaltungInfoTab'
import { SchachtInfoTab }   from './forms/SchachtInfoTab'
import { WartungAllgemeinTab }     from './forms/WartungAllgemeinTab'
import { WartungBeobachtungenTab } from './forms/WartungBeobachtungenTab'
import { WartungFolgeTab }         from './forms/WartungFolgeTab'
import { WartungGalerieTab }       from './forms/WartungGalerieTab'
import { CircleDot, Droplets, GitCommitHorizontal, Waves, Wrench } from 'lucide-react'
import { LEVEL_COLORS }     from '@/lib/registry'
import type { ModuleConfig } from '@/lib/registry'

export const KanalModule: ModuleConfig = {
  id:         'kanal',
  label:      'Kanal',
  icon:       Waves,
  color:      '#2563eb',
  fachschale: 'kanal',

  layerTree: [
    {
      id: 'kanal-wartung', label: 'Wartung & Kontrolle', color: '#26a69a',
      defaultVisible: true,
      children: [
        {
          id: 'kanal-wartungen', label: 'Wartungen', color: '#26a69a', defaultVisible: true,
          children: [
            // Wording follows the original application: a task is 'in Bearbeitung'
            // until it is 'fertig'. 'Offen' / 'Abgeschlossen' was our invention.
            { id: 'kanal-wart-offen',  label: 'in Bearbeitung', color: '#0070ff', defaultVisible: true, symbol: 'pin' },
            { id: 'kanal-wart-fertig', label: 'fertig',         color: '#4ce600', defaultVisible: true, symbol: 'pin' },
          ],
        },
        {
          id: 'kanal-kontrolle', label: 'Kontrolle', color: '#26a69a', defaultVisible: true,
          children: [
            { id: 'kanal-kont-offen',  label: 'in Bearbeitung', color: '#e60000', defaultVisible: true, symbol: 'pin' },
            { id: 'kanal-kont-fertig', label: 'fertig',         color: '#ffaa00', defaultVisible: true, symbol: 'pin' },
          ],
        },
      ],
    },
    {
      id: 'kanal-netz', label: 'Netz', color: '#1565c0', defaultVisible: true,
      children: [
        {
          id: 'kanal-abwasser', label: 'Abwasser', color: '#1565c0', defaultVisible: true,
          children: [
            {
              id: 'kanal-schaechte', label: 'Schächte', color: '#94a3b8',
              defaultVisible: true, symbol: 'circle',
              legendType: 'dot',
              legendItems: Object.entries(LEVEL_COLORS).map(([k, c]) => ({
                label: `SBZ ${k}`, color: c,
              })),
            },
            {
              id: 'kanal-haltungen', label: 'Haltungen', color: '#94a3b8',
              defaultVisible: true, symbol: 'line',
              legendType: 'bar',
              legendItems: Object.entries(LEVEL_COLORS).map(([k, c]) => ({
                label: `GSK ${k}`, color: c,
              })),
            },
            {
              id: 'kanal-reinigungen', label: 'Reinigungen', color: '#ffaa00',
              defaultVisible: false, symbol: 'dashed-line',
            },
          ],
        },
      ],
    },
  ],

  featureTypes: {
    haltung: {
      label:          'Haltung',
      icon:           GitCommitHorizontal,
      symbolType:     'line',
      color:          '#3b82f6',
      conditionField: 'gesamtschadensklasse',
      apiTable:       'kanal.haltungen',
      geoserverLayer: 'WS_awvms:kanal_haltungen',
      // One list, no tab strip. Aufgabe, Beobachtungen and Bericht are a later piece of
      // work; their forms are still in components/feature/tabs/shared/ for then.
      tabs: { info: HaltungInfoTab },
    },
    schacht: {
      label:          'Schacht',
      icon:           CircleDot,
      symbolType:     'circle',
      color:          '#10b981',
      conditionField: 'sbz',
      apiTable:       'kanal.schaechte',
      geoserverLayer: 'WS_awvms:kanal_schaechte',
      tabs: { info: SchachtInfoTab },
    },
    reinigung: {
      label:          'Reinigung',
      icon:           Droplets,
      symbolType:     'dashed-line',
      color:          '#10b981',
      apiTable:       'kanal.reinigungen',
      geoserverLayer: 'WS_awvms:kanal_reinigungen',
      tabs: {
        info:    HaltungInfoTab,  // reuse haltung info until dedicated form is built
        reinigung: ReinigungTab,
        bericht: BerichtTab,
      },
    },
    wartung: {
      label:          'Wartung',
      icon:           Wrench,
      symbolType:     'pin',
      color:          '#f59e0b',
      conditionField: 'status',
      apiTable:       'kanal.wartungen',
      geoserverLayer: 'WS_awvms:kanal_wartungen',
      // The original's three tabs, plus its Galerie window as a fourth. Bericht and the
      // Datenblatt belong to the Schacht or Haltung the task was raised on, not to the
      // task — the Allgemein tab links through to the object instead of duplicating
      // its reports here.
      tabs: {
        allgemein:     WartungAllgemeinTab,
        beobachtungen: WartungBeobachtungenTab,
        folge:         WartungFolgeTab,
        bilder:        WartungGalerieTab,
      },
    },
  },
}
