'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { PlusCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { AdminBookTable } from '@/components/AdminBookTable';
import { AdminBookForm } from '@/components/AdminBookForm';
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
}

export default function AdminPage() {
  const t = useTranslations();
  const { data: session } = useSession();
  const [books, setBooks] = useState<Audiobook[]>([]);
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

  useEffect(() => {
    fetchBooks();
  }, []);

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-background">
        <Header showAdminLink />
        <main className="container mx-auto px-4 py-16 text-center">
          <p className="text-xl text-muted-foreground">{t('no_access')}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showAdminLink />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t('admin_panel')}</h1>
          <Button onClick={() => setAddOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {t('add_book')}
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <AdminBookTable books={books} onRefresh={fetchBooks} />
        )}

        <AdminBookForm
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSuccess={fetchBooks}
        />
      </main>
    </div>
  );
}
