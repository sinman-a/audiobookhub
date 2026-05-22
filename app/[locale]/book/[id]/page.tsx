import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { BookDetailClient } from '@/components/BookDetailClient';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const book = await prisma.audiobook.findFirst({
    where: { id: params.id, status: 'Published' },
    select: { title: true, author: true, descriptionShort: true, imageUrl: true },
  });
  if (!book) return { title: 'AudioBook Hub' };
  return {
    title: `${book.title} — AudioBook Hub`,
    description: `${book.author} · ${book.descriptionShort}`,
    openGraph: {
      title: book.title,
      description: `${book.author} · ${book.descriptionShort}`,
      images: [{ url: book.imageUrl, width: 1200, height: 630, alt: book.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: book.title,
      description: book.descriptionShort,
      images: [book.imageUrl],
    },
  };
}

export default async function BookPage({ params }: { params: { id: string } }) {
  const book = await prisma.audiobook.findFirst({
    where: { id: params.id, status: 'Published' },
  });
  if (!book) notFound();

  const similarBooksQuery =
    book.relatedIds.length > 0
      ? prisma.audiobook.findMany({
          where: { id: { in: book.relatedIds }, status: 'Published' },
          select: { id: true, title: true, author: true, imageUrl: true, genre: true, duration: true },
        })
      : prisma.audiobook.findMany({
          where: {
            genre: book.genre,
            language: book.language,
            status: 'Published',
            NOT: { id: book.id },
          },
          take: 4,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, author: true, imageUrl: true, genre: true, duration: true },
        });

  const [session, similarBooks, ratingAgg] = await Promise.all([
    getServerSession(authOptions),
    similarBooksQuery,
    prisma.rating.aggregate({
      where: { audiobookId: params.id },
      _avg: { stars: true },
      _count: { stars: true },
    }),
  ]);

  return (
    <BookDetailClient
      book={book}
      isAuthenticated={!!session}
      similarBooks={similarBooks}
      avgRating={ratingAgg._avg.stars}
      ratingCount={ratingAgg._count.stars}
    />
  );
}
