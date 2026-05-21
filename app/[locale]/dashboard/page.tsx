'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { BookOpen, ChevronDown, Folder, Search, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { BookGlowCard } from '@/components/BookGlowCard';
import { parseDurationSeconds } from '@/lib/playback';
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

interface CategoryInfo {
  id: string;
  nameUk: string;
  nameEn: string;
}

interface Audiobook {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  descriptionShort: string;
  duration: string;
  genre: string;
  language: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  category?: CategoryInfo | null;
  subcategory?: CategoryInfo | null;
}

type SubGroup = { id: string | null; name: string | null; books: Audiobook[] };
type CatGroup = { id: string | null; name: string; subGroups: SubGroup[] };

function parseDurationHours(duration: string): number {
  return parseDurationSeconds(duration) / 3600;
}

export default function DashboardPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session } = useSession();
  const [books, setBooks] = useState<Audiobook[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [durationFilter, setDurationFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const inputRef = useRef<HTMLInputElement>(null);
  const isAdmin = session?.user?.role === 'ADMIN';

  const localeName = (uk: string, en: string) => locale === 'en' && en ? en : uk;

  useEffect(() => {
    Promise.all([
      fetch('/api/audiobooks').then((r) => r.json()),
      fetch('/api/progress').then((r): Promise<Record<string, number>> => r.ok ? r.json() : Promise.resolve({})),
      fetch('/api/library').then((r) => r.ok ? r.json() : Promise.resolve({ favorites: [] })),
    ])
      .then(([booksData, progressData, libraryData]) => {
        setBooks(Array.isArray(booksData) ? booksData : []);
        setProgressMap(progressData ?? {});
        setFavoriteIds(new Set<string>((libraryData?.favorites ?? []).map((b: { id: string }) => b.id)));
      })
      .catch(() => { setBooks([]); setProgressMap({}); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const authors = useMemo(
    () => Array.from(new Set(books.map((b) => b.author).filter(Boolean))).sort(),
    [books],
  );

  const availableCategories = useMemo(() => {
    const seen = new Map<string, CategoryInfo>();
    for (const b of books) {
      if (b.category && !seen.has(b.category.id)) seen.set(b.category.id, b.category);
    }
    return Array.from(seen.values()).sort((a, b) => a.nameUk.localeCompare(b.nameUk));
  }, [books]);

  const availableSubcategories = useMemo(() => {
    const seen = new Map<string, CategoryInfo>();
    for (const b of books) {
      if (!b.subcategory) continue;
      if (categoryFilter && b.categoryId !== categoryFilter) continue;
      if (!seen.has(b.subcategory.id)) seen.set(b.subcategory.id, b.subcategory);
    }
    return Array.from(seen.values()).sort((a, b) => a.nameUk.localeCompare(b.nameUk));
  }, [books, categoryFilter]);

  const filteredBooks = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    let result = books.filter((book) => {
      const matchesQuery =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.descriptionShort.toLowerCase().includes(q);
      const matchesCategory    = !categoryFilter    || book.categoryId    === categoryFilter;
      const matchesSubcategory = !subcategoryFilter || book.subcategoryId === subcategoryFilter;
      const matchesAuthor   = !authorFilter   || book.author   === authorFilter;
      const matchesLanguage = !languageFilter || book.language === languageFilter;
      const hours = parseDurationHours(book.duration);
      const matchesDuration =
        !durationFilter ||
        (durationFilter === '<4' && hours < 4) ||
        (durationFilter === '4-8' && hours >= 4 && hours <= 8) ||
        (durationFilter === '>8' && hours > 8);
      return matchesQuery && matchesCategory && matchesSubcategory && matchesAuthor && matchesLanguage && matchesDuration;
    });

    if (sortBy === 'alpha') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'longest') {
      result = [...result].sort(
        (a, b) => parseDurationHours(b.duration) - parseDurationHours(a.duration),
      );
    }

    return result;
  }, [books, debouncedQuery, categoryFilter, subcategoryFilter, authorFilter, languageFilter, durationFilter, sortBy]);

  const booksByCategory = useMemo<CatGroup[]>(() => {
    const catMap = new Map<string, CatGroup>();

    for (const book of filteredBooks) {
      const catKey  = book.categoryId ?? '__none__';
      const catName = book.category
        ? localeName(book.category.nameUk, book.category.nameEn)
        : t('no_category');

      if (!catMap.has(catKey)) {
        catMap.set(catKey, { id: book.categoryId ?? null, name: catName, subGroups: [] });
      }

      const cat    = catMap.get(catKey)!;
      const subKey = book.subcategoryId ?? '__nosub__';
      let subGroup = cat.subGroups.find((s) => (s.id ?? '__nosub__') === subKey);

      if (!subGroup) {
        subGroup = {
          id:    book.subcategoryId ?? null,
          name:  book.subcategory ? localeName(book.subcategory.nameUk, book.subcategory.nameEn) : null,
          books: [],
        };
        cat.subGroups.push(subGroup);
      }
      subGroup.books.push(book);
    }

    const groups = Array.from(catMap.values());
    groups.sort((a, b) => {
      if (!a.id) return 1;
      if (!b.id) return -1;
      return a.name.localeCompare(b.name);
    });
    for (const cat of groups) {
      cat.subGroups.sort((a, b) => {
        if (!a.id) return 1;
        if (!b.id) return -1;
        return (a.name ?? '').localeCompare(b.name ?? '');
      });
    }
    return groups;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredBooks, locale]);

  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [collapsedSubs, setCollapsedSubs] = useState<Set<string>>(new Set());

  const toggleCat = (key: string) =>
    setCollapsedCats((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const toggleSub = (key: string) =>
    setCollapsedSubs((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const isFiltered =
    debouncedQuery || categoryFilter || subcategoryFilter || authorFilter || languageFilter || durationFilter || sortBy !== 'newest';

  const handleSearch = () => setDebouncedQuery(query);
  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setCategoryFilter('');
    setSubcategoryFilter('');
    setAuthorFilter('');
    setLanguageFilter('');
    setDurationFilter('');
    setSortBy('newest');
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
            {/* Category filter */}
            <Select
              value={categoryFilter || '__all__'}
              onValueChange={(v) => {
                setCategoryFilter(v === '__all__' ? '' : v);
                setSubcategoryFilter('');
              }}
            >
              <SelectTrigger className="w-48" aria-label={t('category')}>
                <SelectValue placeholder={t('filter_all_categories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('filter_all_categories')}</SelectItem>
                {availableCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {localeName(c.nameUk, c.nameEn)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Subcategory filter */}
            <Select
              value={subcategoryFilter || '__all__'}
              onValueChange={(v) => setSubcategoryFilter(v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="w-52" aria-label={t('subcategory')}>
                <SelectValue placeholder={t('filter_all_subcategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('filter_all_subcategories')}</SelectItem>
                {availableSubcategories.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {localeName(s.nameUk, s.nameEn)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={authorFilter || '__all__'}
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

            <Select
              value={languageFilter || '__all__'}
              onValueChange={(val) => setLanguageFilter(val === '__all__' ? '' : val)}
            >
              <SelectTrigger className="w-44" aria-label={t('language')}>
                <SelectValue placeholder={t('filter_all_languages')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('filter_all_languages')}</SelectItem>
                <SelectItem value="UA">🇺🇦 UA</SelectItem>
                <SelectItem value="EN">🇬🇧 EN</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={durationFilter || '__all__'}
              onValueChange={(val) => setDurationFilter(val === '__all__' ? '' : val)}
            >
              <SelectTrigger className="w-48" aria-label={t('duration')}>
                <SelectValue placeholder={t('filter_duration_all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('filter_duration_all')}</SelectItem>
                <SelectItem value="<4">{t('filter_duration_short')}</SelectItem>
                <SelectItem value="4-8">{t('filter_duration_medium')}</SelectItem>
                <SelectItem value=">8">{t('filter_duration_long')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48" aria-label={t('sort_by')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('sort_newest')}</SelectItem>
                <SelectItem value="alpha">{t('sort_alpha')}</SelectItem>
                <SelectItem value="longest">{t('sort_longest')}</SelectItem>
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
            {booksByCategory.map((cat) => {
              const catKey   = cat.id ?? '__none__';
              const catOpen  = !collapsedCats.has(catKey);
              const totalBooks = cat.subGroups.reduce((s, sg) => s + sg.books.length, 0);

              return (
                <section key={catKey} aria-label={cat.name}>
                  {/* Category folder header */}
                  <button
                    onClick={() => toggleCat(catKey)}
                    className="flex w-full items-center gap-3 mb-0 group"
                    aria-expanded={catOpen}
                  >
                    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm group-hover:border-white/20 group-hover:bg-white/8 transition-colors">
                      <Folder className="h-4 w-4 text-amber-400 fill-amber-400/20" />
                      <span className="font-semibold text-sm text-white">{cat.name}</span>
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {totalBooks}
                      </Badge>
                      <ChevronDown
                        className="h-3.5 w-3.5 text-white/40 transition-transform duration-300"
                        style={{ transform: catOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                      />
                    </div>
                    <div className="flex-1 h-px bg-white/8" />
                  </button>

                  {/* Animated category container */}
                  <div
                    className="grid overflow-hidden"
                    style={{
                      gridTemplateRows: catOpen ? '1fr' : '0fr',
                      transition: 'grid-template-rows 0.35s ease',
                    }}
                  >
                    <div className="min-h-0">
                      <div className="pl-4 space-y-3 pt-3">
                        {cat.subGroups.map((sg) => {
                          const subKey  = `${catKey}_${sg.id ?? '__nosub__'}`;
                          const subOpen = !collapsedSubs.has(subKey);

                          // No subcategory — render cards directly without inner folder
                          if (!sg.name) {
                            return (
                              <div
                                key={subKey}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                              >
                                {sg.books.map((book) => (
                                  <BookGlowCard
                                    key={book.id}
                                    book={book}
                                    progressSeconds={progressMap[book.id]}
                                    totalSeconds={parseDurationSeconds(book.duration)}
                                    isFavorite={favoriteIds.has(book.id)}
                                  />
                                ))}
                              </div>
                            );
                          }

                          return (
                            <section key={subKey} aria-label={sg.name}>
                              {/* Subcategory folder header */}
                              <button
                                onClick={() => toggleSub(subKey)}
                                className="flex w-full items-center gap-3 mb-0 group"
                                aria-expanded={subOpen}
                              >
                                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-sm group-hover:border-white/20 group-hover:bg-white/8 transition-colors">
                                  <Folder className="h-3.5 w-3.5 text-blue-400 fill-blue-400/20" />
                                  <span className="font-medium text-sm text-white/90">{sg.name}</span>
                                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                                    {sg.books.length}
                                  </Badge>
                                  <ChevronDown
                                    className="h-3 w-3 text-white/40 transition-transform duration-300"
                                    style={{ transform: subOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                                  />
                                </div>
                                <div className="flex-1 h-px bg-white/8" />
                              </button>

                              {/* Animated subcategory books */}
                              <div
                                className="grid overflow-hidden"
                                style={{
                                  gridTemplateRows: subOpen ? '1fr' : '0fr',
                                  transition: 'grid-template-rows 0.35s ease',
                                }}
                              >
                                <div className="min-h-0">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-4 pb-1">
                                    {sg.books.map((book) => (
                                      <BookGlowCard
                                        key={book.id}
                                        book={book}
                                        progressSeconds={progressMap[book.id]}
                                        totalSeconds={parseDurationSeconds(book.duration)}
                                        isFavorite={favoriteIds.has(book.id)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </section>
                          );
                        })}
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
