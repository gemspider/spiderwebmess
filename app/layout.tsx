import type { Metadata, Viewport } from 'next'
import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { DemoGate } from '@/components/providers/DemoGate'
import { DemoSessionAttrs } from '@/components/providers/DemoSessionAttrs'
import { ServiceWorker } from '@/components/providers/ServiceWorker'

export const metadata: Metadata = {
  title:       'Spider GIS',
  description: 'Kanalnetz — AWV Mittleres Schwarzatal',
  manifest:    '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Spider GIS' },
  icons: {
    icon:  [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export const viewport: Viewport = {
  themeColor:   '#2563eb',
  width:        'device-width',
  initialScale: 1,
  // The map should reach the screen edges on a notched phone; the top inset is
  // absorbed by the TopBar via a rule in globals.css, not by padding the whole page.
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="flex flex-col h-screen overflow-hidden bg-surface text-ink antialiased">
        <QueryProvider>
          {/*
            The real app decodes a JWT server-side via cookies() and writes the username
            into these data attributes, which TopBar reads off the DOM. cookies() is a
            dynamic server API and cannot run in a static export, so DemoSessionAttrs
            fills the same attributes on the client — keeping TopBar unmodified.
          */}
          <DemoSessionAttrs>
            <DemoGate>{children}</DemoGate>
          </DemoSessionAttrs>
        </QueryProvider>
        <ServiceWorker />
      </body>
    </html>
  )
}
