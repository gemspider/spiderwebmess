'use client'

// Client-side route guard.
//
// The real app enforces auth in middleware.ts, which a static export cannot run.
// This is the presentational replacement: it checks a localStorage flag and sends
// unauthenticated visitors to /login. It is *not* a security boundary — anyone can
// set the flag from the console, and all the data is public anyway. The login screen
// exists because stakeholders expect to see it .

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isSignedIn } from '@/lib/demoSession'

const LOGIN_PATH = '/login'

export function DemoGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  const onLogin = pathname?.startsWith(LOGIN_PATH) ?? false

  useEffect(() => {
    const signedIn = isSignedIn()

    if (!signedIn && !onLogin) {
      router.replace(LOGIN_PATH)
      return
    }
    if (signedIn && onLogin) {
      router.replace('/')
      return
    }

    setChecked(true)
  }, [onLogin, router])

  // Render nothing until the check completes, otherwise the map mounts (and starts
  // pulling 5 MB of snapshot) for a fraction of a second before the redirect.
  if (!checked) return null

  return <>{children}</>
}
