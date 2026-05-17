import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from '@ducanh2912/next-pwa';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: { document: '/offline.html' },
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/img\.youtube\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'youtube-images',
          expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /^https?:\/\/.*\.(?:jpg|jpeg|png|gif|webp|svg)/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'book-covers',
          expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/api\/audiobooks/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-audiobooks',
          expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
          networkTimeoutSeconds: 10,
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

export default withPWA(withNextIntl(nextConfig));
