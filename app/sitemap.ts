import { prisma } from '@/lib/prisma';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const books = await prisma.audiobook.findMany({
    where: { isPublished: true },
    select: { id: true, updatedAt: true },
  });

  const bookUrls = books.flatMap((book) =>
    (['uk', 'en'] as const).map((locale) => ({
      url: `https://audiobookhub.vercel.app/${locale}/book/${book.id}`,
      lastModified: book.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  );

  const staticUrls: MetadataRoute.Sitemap = [
    { url: 'https://audiobookhub.vercel.app/uk', lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: 'https://audiobookhub.vercel.app/en', lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
  ];

  return [...staticUrls, ...bookUrls];
}
