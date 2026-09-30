'use client'

// Datenblatt route — /datenblatt/?id=180330
//
// A route rather than a modal so a sheet can be linked to and sent to a colleague, and
// so the browser's own print produces a clean page with no map behind it.
//
// The id travels as a query parameter rather than a path segment because this is a
// static export: a dynamic segment would need generateStaticParams to prerender all
// 5 918 Schächte, which is ~50 MB of near-identical HTML. One page reading the id on
// the client is deep-linkable in exactly the same way and ships a single file.
//
// `typ` selects the sheet. Ids are unique per table, not across tables, so the type has
// to travel with the id — Schacht 169897 and Haltung 169897 both exist.

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import '@/modules/index'
import { DatenblattView } from '@/components/datenblatt/DatenblattView'
import { HaltungDatenblattView } from '@/components/datenblatt/HaltungDatenblattView'

function DatenblattRoute() {
  const params = useSearchParams()
  const id = params.get('id')
  const typ = params.get('typ')

  if (!id) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold text-ink">Kein Objekt gewählt</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Ein Datenblatt wird über die Karte geöffnet.
        </p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
          Zurück zur Karte
        </Link>
      </div>
    )
  }

  return typ === 'haltung' ? <HaltungDatenblattView id={id} /> : <DatenblattView id={id} />
}

export default function Page() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense fallback={<p className="p-6 text-sm text-ink-dim">Datenblatt wird geladen…</p>}>
      <DatenblattRoute />
    </Suspense>
  )
}
