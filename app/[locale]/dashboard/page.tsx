'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { BookOpen, Search, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { BookCard } from '@/components/BookCard';
import { BookCardSkeleton } from '@/components/BookCardSkeleton';
import { ContinueListening } from '@/components/ContinueListening';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Audiobook {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  descriptionShort: string;
  duration: string;
  genre: string;
}

export default function DashboardPage() {
  const t = useTranslations();
  const { data: session } = useSession();
  const [books, setBooks] = useState<Audiobook[]>([]);
  const [loading, setLoading] = useState(true);

  // search state: query is the live input value, appliedQuery triggers filtering
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetch('/api/audiobooks')
      .then((r) => r.json())
      .then((data) => setBooks(Array.isArray(data) ? data : []))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, []);

  // Unique sorted genre / author lists derived from loaded books
  const genres = useMemo(
    () => Array.from(new Set(books.map((b) => b.genre).filter(Boolean))).sort(),
    [books],
  );
  const authors = useMemo(
    () => Array.from(new Set(books.map((b) => b.author).filter(Boolean))).sort(),
    [books],
  );

  const filteredBooks = useMemo(() => {
    const q = appliedQuery.toLowerCase().trim();
    return books.filter((book) => {
      const matchesQuery =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.descriptionShort.toLowerCase().includes(q);
      const matchesGenre = !genreFilter || book.genre === genreFilter;
      const matchesAuthor = !authorFilter || book.author === authorFilter;
      return matchesQuery && matchesGenre && matchesAuthor;
    });
  }, [books, appliedQuery, genreFilter, authorFilter]);

  const isFiltered = appliedQuery || genreFilter || authorFilter;

  const handleSearch = () => setAppliedQuery(query);

  const handleClear = () => {
    setQuery('');
    setAppliedQuery('');
    setGenreFilter('');
    setAuthorFilter('');
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen">
      <Header showAdminLink={isAdmin} />
      <main id="main-content" className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('dashboard')}</h1>
        <ContinueListening />

        {/* ── Search & Filters ─────────────────────────────── */}
        <div className="mb-6 space-y-3">
          {/* Search row */}
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

          {/* Filters row */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Genre filter */}
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
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Author filter */}
            <Select
              value={authorFilter}
              onValueChange={(val) => setAuthorFilter(val === '__all__' ? '' : val)}
            >
              <SelectTrigger className="w-52" aria-label={t('author')}>
                <SelectValue placeholder={t('filter_all_authors')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('filter_all_authors')}</SelectItem>
                {authors.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear button — only when a filter is active */}
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

            {/* Results count — only when a filter is active and books are loaded */}
            {isFiltered && !loading && (
              <span className="ml-auto text-sm text-muted-foreground">
                {t('results_count', { count: filteredBooks.length })}
              </span>
            )}
          </div>
        </div>

        {/* ── Book grid ────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">
              {isFiltered ? t('no_results') : t('no_books_yet')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
