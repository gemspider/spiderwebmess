'use client';

// Custom layer control panel — mirrors App2's L.control.layers HTML structure exactly.
// Groups: Hintergrund (base tiles), Wartung & Kontrolle, Netz > Abwasser > Reinigungen.

import { useState } from 'react';
import type { BaseTile } from '@/lib/tiles';

export type { BaseTile };

export interface LayerState {
  baseTile: BaseTile;
  // Wartung & Kontrolle
  wartungenOffen: boolean;
  wartungenFertig: boolean;
  kontrolleOffen: boolean;
  kontrolleFertig: boolean;
  // Netz > Abwasser
  schachte: boolean;
  haltungen: boolean;
  // Netz > Abwasser > Reinigungen
  reinigungenHaltungen: boolean;
  reinigungenSchachte: boolean;
}

export const DEFAULT_LAYER_STATE: LayerState = {
  baseTile: 'orthofoto',
  wartungenOffen: true,
  wartungenFertig: true,
  kontrolleOffen: true,
  kontrolleFertig: true,
  schachte: true,
  haltungen: true,
  reinigungenHaltungen: true,
  reinigungenSchachte: true,
};

interface Props {
  state: LayerState;
  onChange: (next: LayerState) => void;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function GroupHeader({
  color,
  label,
  open,
  onToggle,
  indent = false,
}: {
  color: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  indent?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 w-full text-left py-0.5 ${indent ? '' : ''}`}
    >
      <span
        className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs font-semibold text-gray-800 flex-1">{label}</span>
      <span className="text-gray-400 text-[10px]">{open ? '▼' : '▶'}</span>
    </button>
  );
}

function HideAllBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[10px] text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded w-full text-center transition-colors mb-1"
    >
      Alle ausblenden
    </button>
  );
}

function CheckRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 py-0.5 cursor-pointer hover:bg-gray-50 rounded px-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="accent-blue-600 w-3.5 h-3.5 flex-shrink-0"
      />
      {children}
    </label>
  );
}

// Small marker pin icon using the actual PNG from App2
function MarkerIcon({ color }: { color: 'blue' | 'green' | 'red' | 'yellow' }) {
  // basePath /spider is prepended automatically by next/image, but for plain img we use process.env
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/spider/images/marker-icon-${color}.png`}
      alt={color}
      width={10}
      height={16}
      className="flex-shrink-0"
    />
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function LayerControlPanel({ state, onChange }: Props) {
  const [hintergrundOpen, setHintergrundOpen] = useState(true);
  const [wartungOpen, setWartungOpen] = useState(true);
  const [wartungenSubOpen, setWartungenSubOpen] = useState(true);
  const [kontrolleSubOpen, setKontrolleSubOpen] = useState(true);
  const [netzOpen, setNetzOpen] = useState(true);
  const [abwasserSubOpen, setAbwasserSubOpen] = useState(true);
  const [reinigungenSubOpen, setReinigungenSubOpen] = useState(true);

  function set(patch: Partial<LayerState>) {
    onChange({ ...state, ...patch });
  }

  function hideAllWartung() {
    set({ wartungenOffen: false, wartungenFertig: false, kontrolleOffen: false, kontrolleFertig: false });
  }

  return (
    <div className="absolute top-2 right-2 z-[1000] bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-52 text-xs select-none">

      {/* ── Hintergrund ──────────────────────────────────────────────────── */}
      <HideAllBtn onClick={() => {}} />
      <GroupHeader color="#00bcd4" label="Hintergrund" open={hintergrundOpen} onToggle={() => setHintergrundOpen(v => !v)} />
      {hintergrundOpen && (
        <div className="ml-4 mt-0.5 space-y-0.5">
          {(
            [
              { value: 'orthofoto', label: 'Orthofoto' },
              { value: 'osm', label: 'OSM' },
              { value: 'openstreetmap', label: 'OpenStreetMap' },
            ] as { value: BaseTile; label: string }[]
          ).map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 py-0.5 cursor-pointer hover:bg-gray-50 rounded px-1">
              <input
                type="radio"
                name="baseTile"
                value={value}
                checked={state.baseTile === value}
                onChange={() => set({ baseTile: value })}
                className="accent-blue-600 w-3.5 h-3.5 flex-shrink-0"
              />
              <span className="text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      )}

      <div className="border-t border-gray-100 my-1.5" />

      {/* ── Wartung & Kontrolle ──────────────────────────────────────────── */}
      <HideAllBtn onClick={hideAllWartung} />
      <GroupHeader color="#26a69a" label="Wartung & Kontrolle" open={wartungOpen} onToggle={() => setWartungOpen(v => !v)} />
      {wartungOpen && (
        <div className="ml-2 mt-0.5">
          {/* Wartungen sub-group */}
          <GroupHeader color="#26a69a" label="Wartungen" open={wartungenSubOpen} onToggle={() => setWartungenSubOpen(v => !v)} />
          {wartungenSubOpen && (
            <div className="ml-4 space-y-0.5">
              <CheckRow checked={state.wartungenOffen} onChange={v => set({ wartungenOffen: v })}>
                <MarkerIcon color="blue" />
                <span className="text-gray-700">in Bearbeitung</span>
              </CheckRow>
              <CheckRow checked={state.wartungenFertig} onChange={v => set({ wartungenFertig: v })}>
                <MarkerIcon color="green" />
                <span className="text-gray-700">fertig</span>
              </CheckRow>
            </div>
          )}

          {/* Kontrolle sub-group */}
          <GroupHeader color="#26a69a" label="Kontrolle" open={kontrolleSubOpen} onToggle={() => setKontrolleSubOpen(v => !v)} />
          {kontrolleSubOpen && (
            <div className="ml-4 space-y-0.5">
              <CheckRow checked={state.kontrolleOffen} onChange={v => set({ kontrolleOffen: v })}>
                <MarkerIcon color="red" />
                <span className="text-gray-700">in Bearbeitung</span>
              </CheckRow>
              <CheckRow checked={state.kontrolleFertig} onChange={v => set({ kontrolleFertig: v })}>
                <MarkerIcon color="yellow" />
                <span className="text-gray-700">fertig</span>
              </CheckRow>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-gray-100 my-1.5" />

      {/* ── Netz ─────────────────────────────────────────────────────────── */}
      <GroupHeader color="#1565c0" label="Netz" open={netzOpen} onToggle={() => setNetzOpen(v => !v)} />
      {netzOpen && (
        <div className="ml-2 mt-0.5">
          <GroupHeader color="#1565c0" label="Abwasser" open={abwasserSubOpen} onToggle={() => setAbwasserSubOpen(v => !v)} />
          {abwasserSubOpen && (
            <div className="ml-4 space-y-0.5">
              {/* Schachte */}
              <CheckRow checked={state.schachte} onChange={v => set({ schachte: v })}>
                <span className="inline-block w-3 h-3 rounded-full border-2 border-black bg-white flex-shrink-0" />
                <span className="text-gray-700">Schachte</span>
              </CheckRow>

              {/* Haltung */}
              <CheckRow checked={state.haltungen} onChange={v => set({ haltungen: v })}>
                <span className="inline-block w-4 h-[3px] bg-[#e4b0b6] flex-shrink-0" />
                <span className="text-gray-700">Haltung</span>
              </CheckRow>

              {/* Reinigungen (collapsible sub-group) */}
              <div>
                <GroupHeader
                  color="#26a69a"
                  label="Reinigungen"
                  open={reinigungenSubOpen}
                  onToggle={() => setReinigungenSubOpen(v => !v)}
                />
                {reinigungenSubOpen && (
                  <div className="ml-4 space-y-0.5">
                    {/* Reinigungen Schaechte — circles */}
                    <CheckRow checked={state.reinigungenSchachte} onChange={v => set({ reinigungenSchachte: v })}>
                      <span className="inline-block w-3 h-3 rounded-full border-2 flex-shrink-0" style={{ borderColor: '#FFC300', backgroundColor: 'white' }} />
                      <span className="text-gray-700">Reinigungen Schaechte</span>
                    </CheckRow>

                    {/* Reinigungen Haltungen — lines */}
                    <CheckRow checked={state.reinigungenHaltungen} onChange={v => set({ reinigungenHaltungen: v })}>
                      <span className="inline-block w-4 h-[3px] flex-shrink-0" style={{ backgroundColor: '#FFC300' }} />
                      <span className="text-gray-700">Reinigungen Haltungen</span>
                    </CheckRow>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="ml-4 mt-0.5 text-gray-400 text-[10px] py-0.5">Andere Ebenen</div>
        </div>
      )}
    </div>
  );
}
