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

export default async function LandingPage() {
  const books = await prisma.audiobook.findMany({
    where: {
      isPublished: true,
      OR: [
        { title: { contains: '1984' } },
        { title: { contains: '451' } },
        { title: { contains: 'Шоушенк' } },
      ],
    },
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
  });

  return <LandingContent books={books} />;
}
