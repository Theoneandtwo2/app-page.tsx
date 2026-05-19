import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: { colors: { gol: { dark: "#111827", green: "#0f6e56", soft: "#f6f7f4" } } } },
  plugins: [],
};
export default config;
