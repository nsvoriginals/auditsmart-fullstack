import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],

  content: [
    './app/**/*.{ts,tsx,js,jsx,mdx}',
    './components/**/*.{ts,tsx,js,jsx,mdx}',
    './pages/**/*.{ts,tsx,js,jsx,mdx}',
  ],

  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },

    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },

        plum: { DEFAULT: '#612D53', dark: '#4a2140', light: '#7a3868' },
        rose: { DEFAULT: '#853953', light: '#a04868' },
        obsidian: { DEFAULT: '#2C2C2C', 80: '#444444', 60: '#666666' },
        frost: { DEFAULT: '#F3F4F4', 80: '#e8e9e9', 60: '#d4d5d5' },
      },

      fontFamily: {
        display: ['DM Serif Display', 'Georgia', 'serif'],
        body: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'Courier New', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: '24px',
      },

      animation: {
        'fade-in': 'fadeIn 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-plum': 'pulse-plum 2s ease-in-out infinite',
        shimmer: 'shimmer 1.5s infinite',
        scanLine: 'scanLine 2s linear infinite',
      },

      keyframes: {
        // ✅ opacity must be a string in Tailwind keyframes types
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.96)', opacity: '0' },
          to:   { transform: 'scale(1)',    opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'pulse-plum': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(97, 45, 83, 0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(97, 45, 83, 0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scanLine: {
          '0%':   { top: '0%',   opacity: '0.8' },
          '100%': { top: '100%', opacity: '0' },
        },
      },
    },
  },

  plugins: [require("tailwindcss-animate")],
}

export default config