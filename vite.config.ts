import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "Farbduell – das entspannte Kartenspiel",
        short_name: "Farbduell",
        description:
          "Kostenlos, werbefrei und ohne Zeitlimit gegen Bots spielen.",
        lang: "de",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#e6e1d3",
        theme_color: "#e6e1d3",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Alles Statische cachen – das Spiel läuft komplett offline
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
    }),
  ],
});
