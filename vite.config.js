import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['offline.html', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-192.svg', 'icons/icon-512.svg'],
      manifest: {
        name: 'Thread & Co.',
        short_name: 'Thread & Co.',
        description: 'Modern wardrobe essentials shopping PWA',
        theme_color: '#f3e9dc',
        background_color: '#f8f4ee',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          // 1. Static Asset Caching (Cache-First for Images)
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'thread-images-v2',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          // 2. App Shell Static Assets (Cache-First for Styles, Scripts, Fonts)
          {
            urlPattern: ({ request }) => ['style', 'script', 'font'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'thread-static-v2',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          // 3. Dynamic API Caching (Network-First strategy for Express API GET requests)
          {
            urlPattern: ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'thread-api-cache-v1',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: { port: 5173, host: '0.0.0.0' }
});
