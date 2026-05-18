'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { BookOpen, ChevronDown, Folder, Search, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { BookGlowCard } from '@/components/BookGlowCard';
import { BookCardSkeleton } from '@/components/BookCardSkeleton';
import { ContinueListening } from '@/components/ContinueListening';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  // Group filtered books by genre, sorted alphabetically
  const booksByGenre = useMemo(() => {
    const groups = new Map<string, Audiobook[]>();
    for (const book of filteredBooks) {
      const genre = book.genre || 'Other';
      if (!groups.has(genre)) groups.set(genre, []);
      groups.get(genre)!.push(book);
    }
    return new Map(Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b)));
  }, [filteredBooks]);

  // Accordion: tracks which genres are collapsed (default: all expanded)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleGenre = (genre: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(genre) ? next.delete(genre) : next.add(genre);
      return next;
    });

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
        <div className="mb-8 space-y-3">
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
              value={authorFilter}
              onValueChange={(val) => setAuthorFilter(val === '__all__' ? '' : val)}
            >
              <SelectTrigger className="w-52" aria-label={t('author')}>
                <SelectValue placeholder={t('filter_all_authors')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('filter_all_authors')}</SelectItem>
                {authors.map((a) => (
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
                {t('results_count', { count: filteredBooks.length })}
              </span>
            )}
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────── */}
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
          <div className="space-y-4">
            {Array.from(booksByGenre.entries()).map(([genre, genreBooks]) => {
              const isOpen = !collapsed.has(genre);
              return (
              <section key={genre} aria-label={genre}>
                {/* Folder header — clickable accordion trigger */}
                <button
                  onClick={() => toggleGenre(genre)}
                  className="flex w-full items-center gap-3 mb-0 group"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm group-hover:border-white/20 group-hover:bg-white/8 transition-colors">
                    <Folder className="h-4 w-4 text-blue-400 fill-blue-400/20" />
                    <span className="font-semibold text-sm text-white">{genre}</span>
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {genreBooks.length}
                    </Badge>
                    <ChevronDown
                      className="h-3.5 w-3.5 text-white/40 transition-transform duration-300"
                      style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                    />
                  </div>
                  <div className="flex-1 h-px bg-white/8" />
                </button>

                {/* Animated cards container — grid-rows trick for smooth height */}
                <div
                  className="grid overflow-hidden"
                  style={{
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    transition: 'grid-template-rows 0.35s ease',
                  }}
                >
                  <div className="min-h-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-5">
                      {genreBooks.map((book) => (
                        <BookGlowCard key={book.id} book={book} />
                      ))}
                    </div>
                  </div>
                </div>
              </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
