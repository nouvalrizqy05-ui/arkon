import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        runtimeCaching: [
          {
            // ✅ FIXED: Dynamic URL pattern (works in production)
            urlPattern: ({ url }) => url.pathname.startsWith('/api/materials'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'materials-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 }
            }
          }
        ],
        // Offline fallback
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /model-viewer\.html/, /three-assembly\.html/],
      },
      manifest: {
        name: 'Arkon - Computer Architecture Learning',
        short_name: 'Arkon',
        description: 'AI-Powered Computer Architecture Learning Platform dengan IRT Rasch Model dan 3D Interactive Simulation',
        theme_color: '#6366f1',
        background_color: '#080C1A',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/arkon-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      }
    }),
    visualizer({
      filename: 'dist/bundle-stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'framer-motion': ['framer-motion'],
          'socket-io': ['socket.io-client']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  }
})
