import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in':  'fade-in 0.2s ease-out',
      },
      colors: {
        brand:   { DEFAULT: '#1d4ed8', light: '#eff6ff', border: '#bfdbfe' },
        surface: { DEFAULT: '#ffffff', soft: '#f8fafc', muted: '#f0f4f8' },
        border:  { DEFAULT: '#e2e8f0', strong: '#c8d3df' },
        ink:     { DEFAULT: '#0d1b2e', muted: '#3d5166', dim: '#8fa3b8' },
        // ISYBAU condition levels — exact App2 values
        level: {
          1: '#4ce600',
          2: '#0070ff',
          3: '#ffff00',
          4: '#ffaa00',
          5: '#e60000',
        },
      },
      width: {
        sidebar: '280px',
        panel:   '380px',
      },
    },
  },
  plugins: [],
}

export default config
