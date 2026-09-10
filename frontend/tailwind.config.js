import { palette } from "./src/theme.js";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // Aliases for the three surface tokens used by the shared PageShell and Card.
      // Values are imported from src/theme.js so CSS and chart colours cannot drift
      // apart. They match slate-950/900/800 exactly, so nothing renders differently.
      colors: {
        surface: palette.surface,
        panel: palette.panel,
        edge: palette.edge,
      },
    },
  },
  plugins: [],
};
