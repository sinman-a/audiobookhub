'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
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
}

interface Props {
  books: Audiobook[];
  onRefresh: () => void;
}

export function AdminBookTable({ books, onRefresh }: Props) {
  const t = useTranslations();
  const [editBook, setEditBook] = useState<Audiobook | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
                  <Badge variant="outline">{book.genre}</Badge>
                </td>
                <td className="p-3">
                  <Badge variant={book.isPublished ? 'default' : 'secondary'}>
                    {book.isPublished ? t('published') : t('draft')}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditBook(book)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(book.id)}
                      disabled={deletingId === book.id}
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
        open={!!editBook}
        onClose={() => setEditBook(null)}
        onSuccess={onRefresh}
        book={editBook}
      />
    </>
  );
}
