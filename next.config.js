/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export — no Node server. This is what makes the demo deployable to
  // Vercel (or any static host) with no backend at all.
  output: 'export',

  // basePath '/spider' is dropped: the real app is served under Apache at /spider/,
  // the demo is served at a domain root.

  // Without this, the export emits login.html and Vercel's clean-URL handling can
  // bounce /login → /login/ → 404. trailingSlash gives every route its own
  // <route>/index.html, which any static host serves directly.
  trailingSlash: true,

  // next/image's optimizer needs a server.
  images: { unoptimized: true },

  // No rewrites(): unsupported in an export, and there is nothing left to proxy —
  // GeoServer, FastAPI and legacy Flask are all replaced by public/data/.
}

module.exports = nextConfig
