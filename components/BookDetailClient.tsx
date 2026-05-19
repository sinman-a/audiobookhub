'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { ArrowLeft, ArrowRight, Clock, Globe } from 'lucide-react';
import { Header } from '@/components/Header';
import { YoutubePlayer } from '@/components/YoutubePlayer';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

interface Props {
  book: Audiobook;
  isAuthenticated: boolean;
}

export function BookDetailClient({ book, isAuthenticated }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session } = useSession();
  const [modalOpen, setModalOpen] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN';

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

        {/* Player or register CTA */}
        <div className="mb-8">
          {isAuthenticated ? (
            <YoutubePlayer
              youtubeId={book.youtubeId}
              bookId={book.id}
              bookTitle={book.title}
              bookAuthor={book.author}
              imageUrl={book.imageUrl}
            />
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="text-white/60 mb-4">{t('register_to_listen')}</p>
              <Button
                onClick={() => setModalOpen(true)}
                className="gap-2 bg-blue-500 hover:bg-blue-400 text-white"
              >
                {t('listen_free')}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <AuthModal open={modalOpen} onOpenChange={setModalOpen} defaultMode="register" />
            </div>
          )}
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
            {book.descriptionLong}
          </p>
        </div>
      </main>
    </div>
  );
}
