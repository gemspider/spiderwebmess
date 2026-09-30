import type { Config } from 'tailwindcss'

// ── Feldbuch ────────────────────────────────────────────────────────────────
// Design direction B. The person opening this is standing over an open manhole, so
// the palette stays quiet and the condition colours do the shouting.
//
// The neutral ramp is warm (stone, not slate): the app sits on aerial imagery, which
// is overwhelmingly green and grey, and a cool grey chrome disappears into it.
//
// The accent is a CSS variable, not a fixed colour — each Fachschale carries its own
// (see globals.css). Defaults to the deep blue of the Kanal module.
//
// On blue and the condition ramp: ISYBAU level 2 is #2f6ef6, a bright saturated azure.
// The chrome blue is deliberately much darker and less saturated (#0f4c81) so the two
// do not read as the same signal. Belt and braces, a condition chip always shows its
// number as well as its colour, so hue is never the only thing carrying the meaning.

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
      animation: {
        'slide-up':       'slide-up 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in':        'fade-in 0.2s ease-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
      colors: {
        // Per-module accent. Values live in globals.css under [data-module].
        brand: {
          DEFAULT: 'var(--brand)',
          hover:   'var(--brand-hover)',
          light:   'var(--brand-light)',
          border:  'var(--brand-border)',
          ink:     'var(--brand-ink)',
        },
        // Warm neutrals — stone, so the chrome separates from the aerial basemap.
        surface: { DEFAULT: '#ffffff', soft: '#fbfafa', muted: '#f5f4f3', sunken: '#efedec' },
        border:  { DEFAULT: '#e7e5e4', strong: '#d6d3d1' },
        ink:     { DEFAULT: '#1c1917', muted: '#44403c', dim: '#78716c', faint: '#a8a29e' },

        // ISYBAU condition levels. Domain-mandated — these are not ours to restyle.
        level: {
          // Mirrors ISYBAU_LEVELS in lib/palettes. A Tailwind config is loaded in its
          // own build context, so it cannot import it; __tests__ asserts they agree.
          1: '#7ce345',
          2: '#2f6ef6',
          3: '#ffff55',
          4: '#f3ae3d',
          5: '#ea3323',
        },
      },
      width: {
        sidebar: '280px',
        panel:   '380px',
      },
      boxShadow: {
        card:  '0 1px 2px rgb(28 25 23 / 0.04), 0 1px 3px rgb(28 25 23 / 0.06)',
        sheet: '0 -2px 24px rgb(28 25 23 / 0.12)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
