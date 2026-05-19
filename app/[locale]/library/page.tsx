'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { BookOpen } from 'lucide-react';
import { Header } from '@/components/Header';
import { BookGlowCard } from '@/components/BookGlowCard';
import { BookCardSkeleton } from '@/components/BookCardSkeleton';
import { parseDurationSeconds } from '@/lib/playback';

interface LibraryBook {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  duration: string;
  genre: string;
  descriptionShort: string;
  language: string;
  progressSeconds?: number;
}

interface LibraryData {
  favorites: LibraryBook[];
  in_progress: LibraryBook[];
  finished: LibraryBook[];
}

type Tab = 'in_progress' | 'favorites' | 'finished';

export default function LibraryPage() {
  const t = useTranslations();
  const { data: session } = useSession();
  const [data, setData] = useState<LibraryData>({ favorites: [], in_progress: [], finished: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('in_progress');

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetch('/api/library')
      .then((r) => r.ok ? r.json() : { favorites: [], in_progress: [], finished: [] })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'in_progress', label: t('library_in_progress'), count: data.in_progress.length },
    { key: 'favorites',   label: t('library_favorites'),   count: data.favorites.length },
    { key: 'finished',    label: t('library_finished'),    count: data.finished.length },
  ];

  const emptyKey: Record<Tab, string> = {
    in_progress: 'library_empty_in_progress',
    favorites:   'library_empty_favorites',
    finished:    'library_empty_finished',
  };

  const activeBooks =
    activeTab === 'in_progress' ? data.in_progress :
    activeTab === 'favorites'   ? data.favorites :
    data.finished;

  return (
    <div className="min-h-screen">
      <Header showAdminLink={isAdmin} />
      <main id="main-content" className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('library')}</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-white/10">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === key
                  ? 'border-blue-400 text-white'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              {label}
              {!loading && count > 0 && (
                <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                  activeTab === key ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/40'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <BookCardSkeleton key={i} />)}
          </div>
        ) : activeBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">{t(emptyKey[activeTab])}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeBooks.map((book) => (
              <BookGlowCard
                key={book.id}
                book={book}
                progressSeconds={book.progressSeconds}
                totalSeconds={parseDurationSeconds(book.duration)}
                isFavorite={
                  activeTab === 'favorites' ||
                  data.favorites.some((f) => f.id === book.id)
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
