'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Clock, Heart, PlayCircle } from 'lucide-react';
import { GlowCard } from '@/components/ui/spotlight-card';
import { formatTime } from '@/lib/playback';

interface Audiobook {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  descriptionShort: string;
  duration: string;
  genre: string;
}

const GENRE_COLOR: Record<string, 'blue' | 'purple' | 'green' | 'red' | 'orange'> = {
  Adventure:     'orange',
  Fantasy:       'purple',
  'Non-fiction': 'blue',
  Detective:     'red',
  Classic:       'green',
  Romance:       'red',
  Biography:     'blue',
  Music:         'purple',
};

function glowFor(genre: string): 'blue' | 'purple' | 'green' | 'red' | 'orange' {
  return GENRE_COLOR[genre] ?? 'blue';
}

interface Props {
  book: Audiobook;
  progressSeconds?: number;
  totalSeconds?: number;
  isFavorite?: boolean;
}

export function BookGlowCard({ book, progressSeconds, totalSeconds, isFavorite }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const [fav, setFav] = useState(!!isFavorite);

  const hasProgress = !!progressSeconds && progressSeconds > 30;
  const progressPct =
    hasProgress && totalSeconds && totalSeconds > 0
      ? Math.min(100, (progressSeconds! / totalSeconds) * 100)
      : 0;

  const handleToggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    const next = !fav;
    setFav(next);
    const res = await fetch('/api/library', {
      method: next ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audiobookId: book.id }),
    });
    if (!res.ok) setFav(!next);
  };

  return (
    <Link href={`/${locale}/book/${book.id}`} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl">
      <GlowCard
        customSize
        className="w-full h-80 cursor-pointer transition-transform duration-200 hover:-translate-y-1"
        glowColor={glowFor(book.genre)}
      >
        {/* Heart button */}
        <button
          onClick={handleToggleFav}
          className="absolute top-2 right-2 z-10 rounded-full p-1.5 bg-black/40 hover:bg-black/60 transition-colors"
          aria-label={fav ? t('remove_from_favorites') : t('add_to_favorites')}
        >
          <Heart
            className={`h-3.5 w-3.5 transition-colors ${fav ? 'fill-pink-400 text-pink-400' : 'text-white/50'}`}
          />
        </button>

        {/* Row 1 (1fr) — cover image */}
        <div className="relative overflow-hidden rounded-xl min-h-0">
          <Image
            src={book.imageUrl || '/placeholder.jpg'}
            alt={book.title}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </div>

        {/* Row 2 (auto) — info */}
        <div className="space-y-1.5">
          <h3 className="font-semibold text-sm text-white leading-tight line-clamp-2 min-h-[2.5em]">
            {book.title}
          </h3>
          <p className="text-xs text-white/55 truncate">{book.author}</p>
          <div className="flex items-center justify-between pt-0.5">
            {hasProgress ? (
              <span className="flex items-center gap-1 text-xs text-blue-400">
                <PlayCircle className="h-3 w-3" />
                {formatTime(progressSeconds!)}
              </span>
            ) : book.duration ? (
              <span className="flex items-center gap-1 text-xs text-white/40">
                <Clock className="h-3 w-3" />
                {book.duration}
              </span>
            ) : (
              <span />
            )}
            <span className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300">
              <PlayCircle className="h-3.5 w-3.5" />
              {t('listen')}
            </span>
          </div>
        </div>

        {/* Progress bar — shown at bottom of card when progress > 30s */}
        {progressPct > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10 rounded-b-2xl overflow-hidden pointer-events-none">
            <div
              className="h-full bg-blue-500/80"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </GlowCard>
    </Link>
  );
}
