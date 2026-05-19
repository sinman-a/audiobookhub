import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { BookDetailClient } from '@/components/BookDetailClient';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const book = await prisma.audiobook.findFirst({
    where: { id: params.id, isPublished: true },
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
    where: { id: params.id, isPublished: true },
  });
  if (!book) notFound();

  const session = await getServerSession(authOptions);
  return <BookDetailClient book={book} isAuthenticated={!!session} />;
}
