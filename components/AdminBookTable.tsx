'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminBookForm } from './AdminBookForm';

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
  relatedIds?: string[];
}

interface GenreOption {
  id: string;
  name: string;
}

interface Props {
  books: Audiobook[];
  onRefresh: () => void;
  genres?: GenreOption[];
  allBooks?: { id: string; title: string }[];
}

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

  const handleTogglePublish = async (book: Audiobook) => {
    setTogglingId(book.id);
    try {
      const res = await fetch(`/api/admin/audiobooks/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !book.isPublished }),
      });
      if (!res.ok) throw new Error();
      toast.success(book.isPublished ? t('draft') : t('published'));
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
              <th className="text-left p-3 font-medium">{t('status')}</th>
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
                <td className="p-3">
                  <Badge variant={book.isPublished ? 'default' : 'secondary'}>
                    {book.isPublished ? t('published') : t('draft')}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    {/* Quick publish/unpublish toggle */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTogglePublish(book)}
                      disabled={togglingId === book.id}
                      aria-label={book.isPublished ? t('draft') : t('published')}
                      className={book.isPublished ? 'text-green-500 hover:text-green-600' : 'text-muted-foreground'}
                    >
                      {book.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
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

      {/* key forces remount when editing a different book, so useState re-initializes with correct values */}
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
