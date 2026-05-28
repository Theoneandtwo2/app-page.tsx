import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gol: {
          green: "#1a6b47",
          "green-dark": "#145538",
          "green-light": "#e8f5ee",
          dark: "#0f1a14",
          soft: "#f4f5f2",
          muted: "#6b7280",
          border: "#e5e7eb",
          surface: "#ffffff",
        },
      },
      fontFamily: {
        sans: [
          "Geist",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        mono: ["Geist Mono", "Menlo", "Monaco", "Courier New", "monospace"],
      },
      borderRadius: {
        card: "1.5rem",
        "card-sm": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 20px rgba(0,0,0,0.06)",
      },
      fontSize: {
        "2xs": "0.625rem",
      },
      letterSpacing: {
        eyebrow: "0.12em",
      },
    },
  },
  plugins: [],
};

export default config;
