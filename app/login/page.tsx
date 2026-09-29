'use client';

// Login screen — presentational.
//
// The real screen POSTs to /api/auth/login, which binds against LDAP and sets an
// HttpOnly JWT cookie. There is no server here and nothing to verify against, so this
// records the choice in localStorage and lets the visitor in.
//
// The note under the heading is not branding: without it a visitor has no way to know
// what credentials to type, and a login screen that silently accepts anything reads as
// broken. Keep the affordance even if the wording changes.

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/demoSession';

const FACHSCHALEN = [
  { value: 'kanal', label: 'Abwasser (Kanal)' },
  { value: 'wasser', label: 'Wasser' },
  { value: 'beleuchtung', label: 'Beleuchtung' },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fachschale, setFachschale] = useState('kanal');
  const [projectNumber, setProjectNumber] = useState('054');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Only the username is required — there is no password to check. Demanding one
    // would imply a verification step that does not exist.
    if (!username.trim()) {
      setError('Benutzername erforderlich');
      return;
    }

    setLoading(true);
    setError('');

    signIn({
      username:   username.trim(),
      fachschale,
      community:  projectNumber.trim() || '054',
    });

    // Only kanal has a frontend module; the other two are in the select because the
    // real login has them, but they would land on an empty map.
    if (fachschale !== 'kanal') {
      setLoading(false);
      setError('Derzeit ist nur die Fachschale Abwasser (Kanal) verfügbar.');
      return;
    }

    router.replace('/');
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        {/* Logo / branding */}
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
            Hydro IT
          </p>
          <h1 className="text-2xl font-bold text-gray-900">Spider GIS</h1>
          <p className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-900 border border-amber-300">
            Anmeldung mit beliebigem Benutzernamen
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Benutzername
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Benutzername"
              autoFocus
            />
          </div>

          {/* Password — kept for visual parity, not checked */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
              placeholder="(nicht erforderlich)"
            />
          </div>

          {/* Fachschale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fachschale
            </label>
            <select
              value={fachschale}
              onChange={e => setFachschale(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {FACHSCHALEN.map(f => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Project number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Projektnummer
            </label>
            <input
              type="text"
              value={projectNumber}
              onChange={e => setProjectNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="054"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors"
          >
            {loading ? 'Anmelden …' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  );
}
