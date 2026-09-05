import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#134577",
          800: "#195C9F",
          600: "#2178CF",
        },
        gold: {
          500: "#D7A935",
          300: "#E4C679",
        },
        ground: "#F4F6F8",
      },
      fontFamily: {
        display: ["Anton", "Impact", "Haettenschweiler", "'Arial Narrow Bold'", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
