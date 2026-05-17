'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Music2, Search, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { BookCardSkeleton } from '@/components/BookCardSkeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MusicCard } from '@/components/MusicCard';

interface Track {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  descriptionShort: string;
  duration: string;
  genre: string;
}

export default function MusicPage() {
  const t = useTranslations();
  const { data: session } = useSession();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [artistFilter, setArtistFilter] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetch('/api/music')
      .then((r) => r.json())
      .then((data) => setTracks(Array.isArray(data) ? data : []))
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, []);

  const genres = useMemo(
    () => Array.from(new Set(tracks.map((t) => t.genre).filter(Boolean))).sort(),
    [tracks],
  );
  const artists = useMemo(
    () => Array.from(new Set(tracks.map((t) => t.author).filter(Boolean))).sort(),
    [tracks],
  );

  const filteredTracks = useMemo(() => {
    const q = appliedQuery.toLowerCase().trim();
    return tracks.filter((track) => {
      const matchesQuery =
        !q ||
        track.title.toLowerCase().includes(q) ||
        track.author.toLowerCase().includes(q) ||
        track.descriptionShort.toLowerCase().includes(q);
      const matchesGenre = !genreFilter || track.genre === genreFilter;
      const matchesArtist = !artistFilter || track.author === artistFilter;
      return matchesQuery && matchesGenre && matchesArtist;
    });
  }, [tracks, appliedQuery, genreFilter, artistFilter]);

  const isFiltered = appliedQuery || genreFilter || artistFilter;

  const handleSearch = () => setAppliedQuery(query);
  const handleClear = () => {
    setQuery('');
    setAppliedQuery('');
    setGenreFilter('');
    setArtistFilter('');
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen">
      <Header showAdminLink={isAdmin} />
      <main id="main-content" className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('music_catalog')}</h1>

        {/* ── Search & Filters ─────────────────────────────── */}
        <div className="mb-6 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('search_placeholder')}
                className="pl-9"
                aria-label={t('search_placeholder')}
              />
            </div>
            <Button onClick={handleSearch} className="shrink-0">
              {t('search_btn')}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Select
              value={genreFilter}
              onValueChange={(val) => setGenreFilter(val === '__all__' ? '' : val)}
            >
              <SelectTrigger className="w-48" aria-label={t('genre')}>
                <SelectValue placeholder={t('filter_all_genres')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('filter_all_genres')}</SelectItem>
                {genres.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={artistFilter}
              onValueChange={(val) => setArtistFilter(val === '__all__' ? '' : val)}
            >
              <SelectTrigger className="w-52" aria-label={t('artist')}>
                <SelectValue placeholder={t('filter_all_authors')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('filter_all_authors')}</SelectItem>
                {artists.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
                aria-label={t('clear_filters')}
              >
                <X className="h-3.5 w-3.5" />
                {t('clear_filters')}
              </Button>
            )}

            {isFiltered && !loading && (
              <span className="ml-auto text-sm text-muted-foreground">
                {t('results_count', { count: filteredTracks.length })}
              </span>
            )}
          </div>
        </div>

        {/* ── Track grid ───────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Music2 className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">
              {isFiltered ? t('no_results') : t('no_books_yet')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTracks.map((track) => (
              <MusicCard key={track.id} track={track} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
