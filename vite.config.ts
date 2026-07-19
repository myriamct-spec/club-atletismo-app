import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: "Club Atletismo Veloz Runners",
        short_name: "Veloz Runners",
        description: "Gestión deportiva del Club Atletismo Veloz Runners",
        theme_color: "#14274E",
        background_color: "#14274E",
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
