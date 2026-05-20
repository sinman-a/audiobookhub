import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard', '/library', '/admin'] },
    sitemap: 'https://audiobookhub.vercel.app/sitemap.xml',
  };
}
