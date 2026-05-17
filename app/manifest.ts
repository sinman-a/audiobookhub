import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AudioBook Hub',
    short_name: 'AudioBook Hub',
    description: 'Твоя особиста бібліотека аудіокниг',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#04071a',
    theme_color: '#04071a',
    categories: ['books', 'education', 'entertainment'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-icon-180.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [],
  };
}
