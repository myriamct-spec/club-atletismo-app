import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#0A1B33",
          800: "#123258",
          600: "#1B4B8F",
        },
        gold: {
          500: "#D89A1F",
          300: "#F2C94C",
        },
        ground: "#F7F4EC",
      },
      fontFamily: {
        display: ["'Arial Black'", "'Archivo Black'", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
