import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#14274E",
          800: "#1E3E7E",
          600: "#3566B0",
        },
        gold: {
          500: "#F5B800",
          300: "#FFDD55",
        },
        ground: "#F4F6F8",
      },
      fontFamily: {
        display: ["Impact", "Haettenschweiler", "'Arial Narrow Bold'", "'Archivo Black'", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
