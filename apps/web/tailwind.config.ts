import type { Config } from 'tailwindcss';

/**
 * Design tokens from the approved Architecture Document (Section 18 — UI Design System).
 * The school identity colors are applied here as tokens; they are not changed.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#1B5E43', // primary — brand, primary actions, active nav
          'green-hover': '#17503A',
          orange: '#E8833A', // attention, pending / needs-action
          gold: '#C9A227', // achievement accents — awards, certificates
        },
        sky: { DEFAULT: '#DCEBFB', tint: '#EAF2FB' },
        'soft-yellow': '#FBF6E9',
        surface: '#FFFFFF',
        background: '#F7F8FA',
        border: '#E7EBF0',
        heading: '#0F172A',
        body: '#475569',
        muted: '#94A3B8',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)',
        md: '0 4px 12px rgba(15,23,42,0.06), 0 2px 4px rgba(15,23,42,0.04)',
      },
    },
  },
  plugins: [],
} satisfies Config;
