import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

const secureHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-DNS-Prefetch-Control': 'off',
};

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: [
        'logo.png',
        'apple-touch-icon.png',
        'icons/favicon-32.png',
        'icons/pwa-192.png',
        'icons/pwa-512.png',
        'icons/maskable-192.png',
        'icons/maskable-512.png',
        'icons/apple-touch-icon.png',
      ],
      manifest: {
        id: '/',
        name: 'Quadrant Care',
        short_name: 'Quadrant Care',
        description: 'Quadrant Care Services Ltd staff timesheets',
        lang: 'en-GB',
        dir: 'ltr',
        start_url: '/?source=pwa',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui', 'browser'],
        orientation: 'any',
        background_color: '#065FDF',
        theme_color: '#065FDF',
        categories: ['business', 'productivity'],
        prefer_related_applications: false,
        launch_handler: { client_mode: ['navigate-existing', 'auto'] },
        handle_links: 'preferred',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        mode: 'development',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//, /^\/socket\.io/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-styles',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          ...(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'] as const).map((method) => ({
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly' as const,
            method,
          })),
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/uploads/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'uploads',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        suppressWarnings: true,
        type: 'module',
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    headers: secureHeaders,
    proxy: {
      '/api': 'http://127.0.0.1:5050',
      '/uploads': 'http://127.0.0.1:5050',
      '/socket.io': { target: 'http://127.0.0.1:5050', ws: true },
    },
  },
  preview: {
    port: 4173,
    headers: {
      ...secureHeaders,
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob:",
        "connect-src 'self' ws: wss:",
        "worker-src 'self'",
        "manifest-src 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        'upgrade-insecure-requests',
      ].join('; '),
    },
  },
});
