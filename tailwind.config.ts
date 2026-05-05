import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#060612',
        surface: '#0C0C20',
        foreground: '#F0F0F0',
        // HUD accent colors — match CSS variable updates in globals.css
        synapse: '#5B8FFF',
        rim: '#9966FF',
        // Neural category colours — must match CATEGORY_COLORS in src/data/types.ts
        'neural-core':       '#FFD700',
        'neural-about':      '#00F0FF',
        'neural-skills':     '#FF00E5',
        'neural-projects':   '#4D7CFF',
        'neural-experience': '#14B8A6',  // was #00FF88 — corrected to match types.ts
        'neural-education':  '#F59E0B',  // was #FFB800 — corrected to match types.ts
        'neural-contact':    '#FFFFFF',
        'neural-tools':      '#8B5CF6',
      },
      fontFamily: {
        display: ['var(--font-syne)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
