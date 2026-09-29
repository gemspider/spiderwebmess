// Demo session — replaces the JWT + HttpOnly cookie flow.
//
// The real app stores a signed JWT in an HttpOnly cookie set by a Next.js route
// handler, reads it in middleware, and decodes it server-side in app/layout.tsx.
// None of that works in a static export and none of it means anything without a
// backend to verify against, so the demo keeps a plain localStorage record of what
// the visitor typed on the login screen.
//
// This is display state, not authentication. See components/providers/DemoGate.tsx.

const KEY = 'spiderweb:demo-session'

export interface DemoSession {
  username:   string
  fachschale: string
  community:  string
}

export function readSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as DemoSession) : null
  } catch {
    return null
  }
}

export function signIn(session: DemoSession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    // Private mode — the gate will bounce back to /login. Nothing better to do
    // without a server, and the demo is not worth a cookie-consent dialog.
  }
}

export function signOut(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // already gone
  }
}

export function isSignedIn(): boolean {
  return readSession() !== null
}
