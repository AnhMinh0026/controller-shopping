/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Color values live in src/styles/theme.css as CSS variables.
      colors: {
        brand: "rgb(var(--color-brand) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
      },
      keyframes: {
        // One soft "breath" of the glow: rest -> swell -> rest.
        // --glow (0..1) is set per slide by the carousel (see orbit.ts).
        breathe: {
          "0%, 100%": {
            filter:
              "drop-shadow(0 0 16px rgb(var(--color-brand) / calc(var(--glow, 1) * 0.25)))",
          },
          "50%": {
            filter:
              "drop-shadow(0 0 50px rgb(var(--color-brand) / calc(var(--glow, 1) * 0.85)))",
          },
        },
      },
      animation: {
        // Plays once, 0.5s after the carousel has come to rest.
        breathe: "breathe 2.8s ease-in-out 0.5s 1 both",
      },
    },
  },
  plugins: [],
};
