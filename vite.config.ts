import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Off by default in `vite dev` — without this, `npm run dev` never registers a service
      // worker at all, so runtime caching (below) only ever activates on a production build.
      devOptions: { enabled: true },
      includeAssets: ['github-mark.svg'],
      manifest: {
        name: 'Calculadora de Salario',
        short_name: 'Salario',
        description: 'Calculadora de salario neto mensual en Colombia (COP/USD), con retenciones y retención en la fuente.',
        theme_color: '#ea580c',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'icon.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Official TRM dataset (Banco de la República, via datos.gov.co) — published once per day,
        // so cache-first with a short expiry avoids re-fetching it on every Settings save
        // (previously every stored USD month's TRM was re-fetched from the network each time).
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.datos\.gov\.co\/resource\/32sa-8pi3\.json/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'trm-official-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
