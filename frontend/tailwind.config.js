/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171923",
        inksoft: "#22252F",
        paper: "#FFFFFF",
        panel: "#F7F7F5",
        border: "#E5E3DD",
        accent: "#D97757",
        accentdeep: "#B65C3E",
        inktext: "#1F2124",
        muted: "#6B7076",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'IBM Plex Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
