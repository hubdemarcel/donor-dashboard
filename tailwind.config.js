/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#005f64", hover: "#00474b", light: "#e0edee" },
        surface: { DEFAULT: "#fafaf8", 2: "#ffffff", offset: "#eeede9" },
        brand: { text: "#1e1c16", muted: "#72716b", faint: "#b8b7b2" },
      },
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
