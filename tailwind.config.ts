import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        // Brand primitives (OKLCH via CSS custom props)
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        muted: "var(--muted)",
        rule: "var(--rule)",
        paper: "var(--paper)",
        "paper-2": "var(--paper-2)",
        "paper-3": "var(--paper-3)",
        mint: "var(--mint)",
        "mint-soft": "var(--mint-soft)",
        "mint-ink": "var(--mint-ink)",
        "mint-deep": "var(--mint-deep)",

        // Back-compat aliases mapped to the new palette.
        background: "var(--paper)",
        foreground: "var(--paper-2)",
        primary: "var(--ink)",
        secondary: "var(--mint-soft)",
        textprimary: "var(--ink)",
        textsecondary: "var(--ink-soft)",
        bordercolor: "var(--rule)",
        iconcolor: "var(--muted)",
      },
      borderRadius: {
        sm: "0.25rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      boxShadow: {
        page:
          "0 1px 0 0 color-mix(in oklch, var(--ink) 6%, transparent), 0 24px 48px -24px color-mix(in oklch, var(--ink) 18%, transparent)",
        "page-soft":
          "0 1px 0 0 color-mix(in oklch, var(--ink) 4%, transparent), 0 16px 32px -28px color-mix(in oklch, var(--ink) 14%, transparent)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 320ms cubic-bezier(0.22, 0.61, 0.36, 1)",
      },
    },
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;
