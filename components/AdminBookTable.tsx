'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Pencil, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminBookForm } from './AdminBookForm';

type AudiobookStatus = 'Draft' | 'Review' | 'Published' | 'Unavailable';

interface Audiobook {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  youtubeId: string | null;
  descriptionShort: string;
  descriptionLong: string;
  duration: string;
  genre: string;
  language: string;
  year: number;
  status: AudiobookStatus;
  rightsHolder?: string | null;
  permissionStatus?: string;
  relatedIds?: string[];
  views?: number;
  avgCompletion?: number;
  categoryId?: string;
  subcategoryId?: string;
  category?:    { nameUk: string; nameEn: string } | null;
  subcategory?: { nameUk: string; nameEn: string } | null;
}

interface GenreOption {
  id: string;
  nameUk: string;
  nameEn: string;
}

interface Props {
  books: Audiobook[];
  onRefresh: () => void;
  genres?: GenreOption[];
  allBooks?: { id: string; title: string }[];
}

const STATUS_VARIANT: Record<AudiobookStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Draft:       'secondary',
  Review:      'outline',
  Published:   'default',
  Unavailable: 'destructive',
};

const NEXT_STATUS: Record<AudiobookStatus, AudiobookStatus> = {
  Draft:       'Review',
  Review:      'Published',
  Published:   'Draft',
  Unavailable: 'Draft',
};

export function AdminBookTable({ books, onRefresh, genres = [], allBooks = [] }: Props) {
  const t = useTranslations();
  const [editBook, setEditBook] = useState<Audiobook | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirm_delete'))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/audiobooks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success(t('book_deleted'));
      onRefresh();
    } catch {
      toast.error('Error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCycleStatus = async (book: Audiobook) => {
    setTogglingId(book.id);
    const nextStatus = NEXT_STATUS[book.status] ?? 'Draft';
    try {
      const res = await fetch(`/api/admin/audiobooks/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(t(`status_${nextStatus.toLowerCase()}`));
      onRefresh();
    } catch {
      toast.error('Error');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">{t('title')}</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">{t('author')}</th>
              <th className="text-left p-3 font-medium hidden sm:table-cell">{t('genre')}</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">{t('category')}</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">{t('subcategory')}</th>
              <th className="text-left p-3 font-medium">{t('status')}</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">{t('views')}</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">{t('avg_completion')}</th>
              <th className="text-right p-3 font-medium">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-medium max-w-[200px] truncate">{book.title}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">{book.author}</td>
                <td className="p-3 hidden sm:table-cell">
                  {book.genre && <Badge variant="outline">{book.genre}</Badge>}
                </td>
                <td className="p-3 hidden md:table-cell text-sm">
                  {book.category
                    ? book.category.nameUk
                    : <span className="text-muted-foreground/50">—</span>}
                </td>
                <td className="p-3 hidden lg:table-cell text-sm">
                  {book.subcategory
                    ? book.subcategory.nameUk
                    : <span className="text-muted-foreground/50">—</span>}
                </td>
                <td className="p-3">
                  <Badge variant={STATUS_VARIANT[book.status] ?? 'secondary'}>
                    {t(`status_${book.status.toLowerCase()}`)}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground hidden lg:table-cell tabular-nums">
                  {book.views ?? '—'}
                </td>
                <td className="p-3 hidden lg:table-cell">
                  {book.avgCompletion ? (
                    <span className={`text-sm font-medium tabular-nums ${
                      book.avgCompletion >= 75 ? 'text-green-400' :
                      book.avgCompletion >= 50 ? 'text-yellow-400' : 'text-white/50'
                    }`}>{book.avgCompletion}%</span>
                  ) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    {/* Cycle status: Draft → Review → Published → Draft */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCycleStatus(book)}
                      disabled={togglingId === book.id}
                      aria-label={t('status')}
                      className={book.status === 'Published' ? 'text-green-500 hover:text-green-600' : 'text-muted-foreground'}
                      title={`→ ${NEXT_STATUS[book.status]}`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditBook(book)}
                      aria-label={t('edit_book_title')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(book.id)}
                      disabled={deletingId === book.id}
                      aria-label={t('confirm_delete')}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminBookForm
        key={editBook?.id ?? 'new'}
        open={!!editBook}
        onClose={() => setEditBook(null)}
        onSuccess={() => { setEditBook(null); onRefresh(); }}
        book={editBook}
        genres={genres}
        allBooks={allBooks}
      />
    </>
  );
}
