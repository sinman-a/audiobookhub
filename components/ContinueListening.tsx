'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Play, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getRecentProgress, formatTime, type PlaybackProgress } from '@/lib/playback';

export function ContinueListening() {
  const [progress, setProgress] = useState<PlaybackProgress | null>(null);
  const locale = useLocale();
  const t = useTranslations();

  useEffect(() => {
    const p = getRecentProgress();
    if (p && p.timestamp > 10) setProgress(p);
  }, []);

  if (!progress) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <History className="h-5 w-5" />
        {t('continue_listening')}
      </h2>
      <Card className="flex items-center gap-4 p-4 bg-card/60 backdrop-blur-sm border-white/10">
        <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-md">
          <Image
            src={progress.imageUrl}
            alt={progress.bookTitle}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{progress.bookTitle}</p>
          <p className="text-sm text-muted-foreground truncate">{progress.bookAuthor}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('resume_from')} {formatTime(progress.timestamp)}
          </p>
        </div>
        <Link href={`/${locale}/book/${progress.bookId}`}>
          <Button size="sm" className="gap-1.5 bg-blue-500 hover:bg-blue-600 text-white shrink-0">
            <Play className="h-3.5 w-3.5" />
            {t('continue')}
          </Button>
        </Link>
      </Card>
    </div>
  );
}
