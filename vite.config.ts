import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Club Atletismo Aurora",
        short_name: "Aurora",
        description: "Gestión deportiva del Club Atletismo Aurora",
        theme_color: "#0A1B33",
        background_color: "#0A1B33",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icons/icon-placeholder.svg", sizes: "any", type: "image/svg+xml" },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
});
