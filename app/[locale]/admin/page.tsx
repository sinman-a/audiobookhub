'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { PlusCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { AdminBookTable } from '@/components/AdminBookTable';
import { AdminBookForm } from '@/components/AdminBookForm';
import { AdminGenreManager } from '@/components/AdminGenreManager';
import { AdminCategoryManager } from '@/components/AdminCategoryManager';
import { AdminLandingManager } from '@/components/AdminLandingManager';
import { Skeleton } from '@/components/ui/skeleton';

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
  views?: number;
  avgCompletion?: number;
}

interface GenreOption {
  id: string;
  name: string;
}

type Tab = 'books' | 'genres' | 'categories' | 'landing';

export default function AdminPage() {
  const t = useTranslations();
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>('books');
  const [books, setBooks] = useState<Audiobook[]>([]);
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const fetchBooks = () => {
    setLoading(true);
    fetch('/api/admin/audiobooks')
      .then((r) => r.json())
      .then((data) => setBooks(Array.isArray(data) ? data : []))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  };

  const fetchGenres = () => {
    fetch('/api/admin/genres')
      .then((r) => r.json())
      .then((data) => setGenres(Array.isArray(data) ? data : []))
      .catch(() => setGenres([]));
  };

  useEffect(() => {
    fetchBooks();
    fetchGenres();
  }, []);

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen">
        <Header showAdminLink />
        <main className="container mx-auto px-4 py-16 text-center">
          <p className="text-xl text-muted-foreground">{t('no_access')}</p>
        </main>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'books',      label: t('admin_tab_books') },
    { id: 'genres',     label: t('admin_tab_genres') },
    { id: 'categories', label: t('admin_tab_categories') },
    { id: 'landing',    label: t('admin_tab_landing') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header showAdminLink />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{t('admin_panel')}</h1>
          {tab === 'books' && (
            <Button onClick={() => setAddOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('add_book')}
            </Button>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border-b border-white/10 pb-0">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${
                tab === id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Books tab */}
        {tab === 'books' && (
          <>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <AdminBookTable books={books} onRefresh={fetchBooks} genres={genres} allBooks={books.map(b => ({ id: b.id, title: b.title }))} />
            )}
            <AdminBookForm
              open={addOpen}
              onClose={() => setAddOpen(false)}
              onSuccess={fetchBooks}
              genres={genres}
              allBooks={books.map(b => ({ id: b.id, title: b.title }))}
            />
          </>
        )}

        {/* Genres tab */}
        {tab === 'genres' && <AdminGenreManager />}

        {/* Categories tab */}
        {tab === 'categories' && <AdminCategoryManager />}

        {/* Landing tab */}
        {tab === 'landing' && <AdminLandingManager />}
      </main>
    </div>
  );
}
