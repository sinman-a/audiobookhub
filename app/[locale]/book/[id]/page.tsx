'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, BookOpen, Globe } from 'lucide-react';
import { Header } from '@/components/Header';
import { YoutubePlayer } from '@/components/YoutubePlayer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';

interface Audiobook {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  youtubeId: string;
  descriptionShort: string;
  descriptionLong: string;
  duration: string;
  genre: string;
  language: string;
  year: number;
  isPublished: boolean;
}

export default function BookPage({ params }: { params: { id: string; locale: string } }) {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session } = useSession();
  const [book, setBook] = useState<Audiobook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetch(`/api/audiobooks/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setBook)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header showAdminLink={isAdmin} />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-10 w-32 mb-6" />
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="aspect-video w-full mb-8 rounded-xl" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-2" />
          <Skeleton className="h-4 w-4/6" />
        </main>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen">
        <Header showAdminLink={isAdmin} />
        <main className="container mx-auto px-4 py-8 text-center">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">Book not found</p>
          <Link href={`/${locale}/dashboard`} className="mt-4 inline-block">
            <Button variant="outline">{t('back_to_catalog')}</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header showAdminLink={isAdmin} />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href={`/${locale}/dashboard`}>
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back_to_catalog')}
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-1">
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg">
              <Image
                src={book.imageUrl}
                alt={book.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <h1 className="text-3xl font-bold leading-tight">{book.title}</h1>
            <p className="text-xl text-muted-foreground">{book.author}</p>

            <div className="flex flex-wrap gap-2">
              <Badge>{book.genre}</Badge>
              <Badge variant="outline">
                <Globe className="h-3 w-3 mr-1" />
                {book.language}
              </Badge>
              {book.duration && (
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {book.duration}
                </Badge>
              )}
              <Badge variant="outline">{book.year}</Badge>
            </div>

            <p className="text-muted-foreground leading-relaxed">{book.descriptionShort}</p>
          </div>
        </div>

        {/* YouTube player with progress tracking */}
        <div className="mb-8">
          <YoutubePlayer
            youtubeId={book.youtubeId}
            bookId={book.id}
            bookTitle={book.title}
            bookAuthor={book.author}
            imageUrl={book.imageUrl}
          />
        </div>

        {/* Full description */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
            {book.descriptionLong}
          </p>
        </div>
      </main>
    </div>
  );
}
