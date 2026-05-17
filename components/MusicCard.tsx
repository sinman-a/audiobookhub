'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Track {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  descriptionShort: string;
  duration: string;
  genre: string;
}

export function MusicCard({ track }: { track: Track }) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Card className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
      <div className="relative h-56 w-full bg-muted overflow-hidden">
        <Image
          src={track.imageUrl || '/placeholder.jpg'}
          alt={track.title}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <CardContent className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-base leading-tight line-clamp-2">{track.title}</h3>
          {track.genre && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {track.genre}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-2">{track.author}</p>
        <p className="text-sm line-clamp-3 text-foreground/80">{track.descriptionShort}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        {track.duration && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {track.duration}
          </span>
        )}
        <Link href={`/${locale}/music/${track.id}`} className="ml-auto">
          <Button size="sm">{t('listen')}</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
