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
      screens: { "2xl": "1400px" },
    },

    extend: {
      // ── Colors ─────────────────────────────────────────────────────
      // CSS variables are hex/rgba (not hsl), so map them directly.
      // This makes Tailwind utilities like bg-card, text-brand, border-border
      // actually work — previously they produced invalid hsl(rgba(...)) values.
      colors: {
        // Semantic surfaces
        background:  "var(--background)",
        foreground:  "var(--foreground)",
        card:        "var(--card)",
        popover:     "var(--popover)",
        border:      "var(--border)",
        input:       "var(--input)",
        ring:        "var(--ring)",
        elevated:    "var(--elevated)",
        "surface-1": "var(--surface-1)",
        "surface-2": "var(--surface-2)",

        // Text shades
        "text-primary":   "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted":     "var(--text-muted)",
        "text-disabled":  "var(--text-disabled)",

        // Brand
        brand:        "var(--brand)",
        "brand-hover":"var(--brand-hover)",
        "brand-purple":"var(--brand-purple)",
        "brand-pink":  "var(--brand-pink)",
        "brand-green": "var(--brand-green)",
        "brand-faint": "var(--brand-faint)",

        // Semantic actions
        primary: {
          DEFAULT:    "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT:    "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT:    "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT:    "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT:    "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },

        // Status
        success: "var(--success)",
        warning: "var(--warning)",
        info:    "var(--info)",

        // Sidebar tokens
        sidebar: {
          DEFAULT:            "var(--sidebar)",
          foreground:         "var(--sidebar-foreground)",
          primary:            "var(--sidebar-primary)",
          "primary-foreground":"var(--sidebar-primary-foreground)",
          accent:             "var(--sidebar-accent)",
          "accent-foreground":"var(--sidebar-accent-foreground)",
          border:             "var(--sidebar-border)",
          ring:               "var(--sidebar-ring)",
        },
      },

      // ── Typography ──────────────────────────────────────────────────
      fontFamily: {
        sans:    ["Satoshi", "-apple-system", "sans-serif"],
        display: ["Satoshi", "sans-serif"],
        mono:    ["DM Mono", "'Courier New'", "monospace"],
      },

      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
      },

      // ── Radius ──────────────────────────────────────────────────────
      borderRadius: {
        sm:  "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        md:  "var(--radius-md)",
        lg:  "var(--radius-lg)",
        xl:  "var(--radius-xl)",
        "2xl":"24px",
      },

      // ── Shadows ─────────────────────────────────────────────────────
      boxShadow: {
        card:        "var(--shadow-card)",
        "card-hover":"var(--shadow-card-hover)",
        brand:       "var(--shadow-brand)",
        purple:      "var(--shadow-purple)",
        sm:          "var(--shadow-sm)",
        md:          "var(--shadow-md)",
        lg:          "var(--shadow-lg)",
      },

      // ── Animations ──────────────────────────────────────────────────
      animation: {
        "fade-in":  "fadeIn 200ms ease-out forwards",
        "scale-in": "scaleIn 200ms ease-out forwards",
        "slide-up": "slideUp 250ms cubic-bezier(0.16,1,0.3,1) forwards",
        "slide-down":"slideDown 200ms ease-out forwards",
        shimmer:    "shimmer 1.5s infinite",
        pulse:      "pulse 2s ease-in-out infinite",
        spin:       "spin 1s linear infinite",
        blink:      "blink 2s infinite",
        ticker:     "ticker 30s linear infinite",
      },

      keyframes: {
        fadeIn:    { from: { opacity: "0" }, to: { opacity: "1" } },
        scaleIn:   { from: { transform: "scale(0.96)", opacity: "0" }, to: { transform: "scale(1)", opacity: "1" } },
        slideUp:   { from: { transform: "translateY(14px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
        slideDown: { from: { transform: "translateY(-8px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
        shimmer:   { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        pulse:     { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.35" } },
        blink:     { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.3" } },
        ticker:    { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
      },
    },
  },

  plugins: [require("tailwindcss-animate")],
}

export default config
