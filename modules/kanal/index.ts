import { AufgabeTab }       from '@/components/feature/tabs/shared/AufgabeTab'
import { BeobachtungenTab } from '@/components/feature/tabs/shared/BeobachtungenTab'
import { BerichtTab }       from '@/components/feature/tabs/shared/BerichtTab'
import { ReinigungTab }     from '@/components/feature/tabs/shared/ReinigungTab'
import { HaltungInfoTab }   from './forms/HaltungInfoTab'
import { SchachtInfoTab }   from './forms/SchachtInfoTab'
import { LEVEL_COLORS }     from '@/lib/registry'
import type { ModuleConfig } from '@/lib/registry'

export const KanalModule: ModuleConfig = {
  id:         'kanal',
  label:      'Kanal',
  icon:       '💧',
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
            { id: 'kanal-wart-offen',  label: 'Offen',          color: '#0070ff', defaultVisible: true, symbol: 'pin' },
            { id: 'kanal-wart-fertig', label: 'Abgeschlossen',   color: '#4ce600', defaultVisible: true, symbol: 'pin' },
          ],
        },
        {
          id: 'kanal-kontrolle', label: 'Kontrolle', color: '#26a69a', defaultVisible: true,
          children: [
            { id: 'kanal-kont-offen',  label: 'Offen',          color: '#e60000', defaultVisible: true, symbol: 'pin' },
            { id: 'kanal-kont-fertig', label: 'Abgeschlossen',   color: '#ffaa00', defaultVisible: true, symbol: 'pin' },
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
      icon:           '〰',
      symbolType:     'line',
      color:          '#3b82f6',
      conditionField: 'gesamtschadensklasse',
      apiTable:       'kanal.haltungen',
      geoserverLayer: 'WS_awvms:kanal_haltungen',
      tabs: {
        info:          HaltungInfoTab,
        aufgabe:       AufgabeTab,
        beobachtungen: BeobachtungenTab,
        bericht:       BerichtTab,
      },
    },
    schacht: {
      label:          'Schacht',
      icon:           '⭕',
      symbolType:     'circle',
      color:          '#10b981',
      conditionField: 'sbz',
      apiTable:       'kanal.schaechte',
      geoserverLayer: 'WS_awvms:kanal_schaechte',
      tabs: {
        info:          SchachtInfoTab,
        aufgabe:       AufgabeTab,
        beobachtungen: BeobachtungenTab,
        bericht:       BerichtTab,
      },
    },
    reinigung: {
      label:          'Reinigung',
      icon:           '🧹',
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
      icon:           '🔔',
      symbolType:     'pin',
      color:          '#f59e0b',
      conditionField: 'status',
      apiTable:       'kanal.wartungen',
      geoserverLayer: 'WS_awvms:kanal_wartungen',
      tabs: {
        info:    AufgabeTab,   // wartung detail IS the aufgabe form
        bericht: BerichtTab,
      },
    },
  },
}
