import { prisma } from '@/lib/prisma';
import { LandingContent } from '@/components/LandingContent';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const isUk = params.locale === 'uk';
  return {
    title: isUk
      ? 'AudioBook Hub — Слухай аудіокниги українською'
      : 'AudioBook Hub — Listen to Audiobooks',
    description: isUk
      ? 'Безкоштовна бібліотека аудіокниг з YouTube. Слухай класику, детективи, фантастику.'
      : 'Free audiobook library powered by YouTube. Listen to classics, detectives, fantasy.',
    openGraph: {
      title: 'AudioBook Hub',
      description: isUk
        ? 'Безкоштовна бібліотека аудіокниг з YouTube.'
        : 'Free audiobook library powered by YouTube.',
      images: [{ url: '/logo.png' }],
    },
  };
}

export default async function LandingPage({ params }: { params: { locale: string } }) {
  const [books, config] = await Promise.all([
    prisma.audiobook.findMany({
      where: { status: 'Published', isFeatured: true },
      take: 3,
      select: {
        id: true,
        title: true,
        author: true,
        imageUrl: true,
        descriptionShort: true,
        genre: true,
        duration: true,
      },
    }),
    prisma.landingConfig.findUnique({ where: { locale: params.locale } }).catch(() => null),
  ]);

  const overrides = (config?.content ?? {}) as Record<string, string>;

  return <LandingContent books={books} overrides={overrides} />;
}
