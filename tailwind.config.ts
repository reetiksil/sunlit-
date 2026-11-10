import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-soft": "var(--surface-soft)",
        primary: {
          DEFAULT: "var(--primary)",
          fg: "var(--primary-fg)",
        },
        accent: {
          sky: "var(--accent-sky)",
          "sky-fg": "var(--accent-sky-fg)",
          mint: "var(--accent-mint)",
          "mint-fg": "var(--accent-mint-fg)",
          blush: "var(--accent-blush)",
          "blush-fg": "var(--accent-blush-fg)",
        },
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
        },
        border: "var(--border)",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        "reader-serif": ["var(--font-lora)", "Georgia", "serif"],
        "reader-modern": ["var(--font-merriweather)", "Georgia", "serif"],
        "reader-dyslexic": ["var(--font-atkinson)", "sans-serif"],
        "reader-mono": ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.375rem",
      },
      boxShadow: {
        calm: "0 8px 28px -6px rgba(47, 59, 74, 0.06), 0 2px 6px -1px rgba(47, 59, 74, 0.03)",
        "calm-hover": "0 14px 34px -6px rgba(47, 59, 74, 0.11), 0 4px 10px -2px rgba(47, 59, 74, 0.05)",
      },
      fontSize: {
        "fluid-h1": "clamp(1.85rem, 3.2vw + 1rem, 3rem)",
        "fluid-h2": "clamp(1.4rem, 2.2vw + 0.8rem, 2.1rem)",
        "fluid-h3": "clamp(1.15rem, 1.5vw + 0.7rem, 1.5rem)",
      },
    },
  },
  plugins: [],
};

export default config;