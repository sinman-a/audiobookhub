'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Globe, Music } from 'lucide-react';
import { Header } from '@/components/Header';
import { YoutubePlayer } from '@/components/YoutubePlayer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';

interface Track {
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
}

export default function MusicTrackPage({ params }: { params: { id: string } }) {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session } = useSession();
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetch(`/api/music/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setTrack)
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
        </main>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="min-h-screen">
        <Header showAdminLink={isAdmin} />
        <main className="container mx-auto px-4 py-8 text-center">
          <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">Track not found</p>
          <Link href={`/${locale}/music`} className="mt-4 inline-block">
            <Button variant="outline">{t('back_to_music')}</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header showAdminLink={isAdmin} />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href={`/${locale}/music`}>
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back_to_music')}
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-1">
            <div className="relative aspect-square rounded-xl overflow-hidden shadow-lg">
              <Image
                src={track.imageUrl}
                alt={track.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <h1 className="text-3xl font-bold leading-tight">{track.title}</h1>
            <p className="text-xl text-muted-foreground">{track.author}</p>

            <div className="flex flex-wrap gap-2">
              {track.genre && <Badge>{track.genre}</Badge>}
              {track.language && (
                <Badge variant="outline">
                  <Globe className="h-3 w-3 mr-1" />
                  {track.language}
                </Badge>
              )}
              {track.duration && (
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {track.duration}
                </Badge>
              )}
              {track.year && <Badge variant="outline">{track.year}</Badge>}
            </div>

            <p className="text-muted-foreground leading-relaxed">{track.descriptionShort}</p>
          </div>
        </div>

        <div className="mb-8">
          <YoutubePlayer
            youtubeId={track.youtubeId}
            bookId={track.id}
            bookTitle={track.title}
            bookAuthor={track.author}
            imageUrl={track.imageUrl}
          />
        </div>

        {track.descriptionLong && (
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {track.descriptionLong}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
