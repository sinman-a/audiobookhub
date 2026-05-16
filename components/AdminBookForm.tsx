'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

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
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  book?: Audiobook | null;
}

const formSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  imageUrl: z.string().optional(),
  youtubeUrl: z.string().min(1),
  descriptionShort: z.string().min(1),
  descriptionLong: z.string().min(1),
  duration: z.string().optional(),
  genre: z.string().min(1),
  language: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  isPublished: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

export function AdminBookForm({ open, onClose, onSuccess, book }: Props) {
  const t = useTranslations();
  const isEdit = !!book;

  const [form, setForm] = useState<FormData>({
    title: book?.title || '',
    author: book?.author || '',
    imageUrl: book?.imageUrl || '',
    youtubeUrl: book ? `https://www.youtube.com/watch?v=${book.youtubeId}` : '',
    descriptionShort: book?.descriptionShort || '',
    descriptionLong: book?.descriptionLong || '',
    duration: book?.duration || '',
    genre: book?.genre || '',
    language: book?.language || '',
    year: book?.year || new Date().getFullYear(),
    isPublished: book?.isPublished ?? false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);

  const set = (field: keyof FormData, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    try {
      formSchema.parse(form);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errs: typeof errors = {};
        err.errors.forEach((e) => {
          if (e.path[0]) errs[e.path[0] as keyof FormData] = t('field_required');
        });
        setErrors(errs);
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const url = isEdit
        ? `/api/admin/audiobooks/${book!.id}`
        : '/api/admin/audiobooks';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'invalid_youtube_url') {
          setErrors({ youtubeUrl: t('invalid_youtube_url') });
          return;
        }
        throw new Error(data.error);
      }

      toast.success(isEdit ? t('book_updated') : t('book_added'));
      onSuccess();
      onClose();
    } catch {
      toast.error('Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('edit_book_title') : t('add_book_title')}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('title')} error={errors.title}>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label={t('author')} error={errors.author}>
            <Input value={form.author} onChange={(e) => set('author', e.target.value)} />
          </Field>
          <Field label={t('youtube_url')} error={errors.youtubeUrl} className="sm:col-span-2">
            <Input
              value={form.youtubeUrl}
              onChange={(e) => set('youtubeUrl', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </Field>
          <Field label={t('image_url')} error={errors.imageUrl} className="sm:col-span-2">
            <Input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." />
          </Field>
          <Field label={t('short_description')} error={errors.descriptionShort} className="sm:col-span-2">
            <Textarea
              value={form.descriptionShort}
              onChange={(e) => set('descriptionShort', e.target.value)}
              rows={3}
            />
          </Field>
          <Field label={t('full_description')} error={errors.descriptionLong} className="sm:col-span-2">
            <Textarea
              value={form.descriptionLong}
              onChange={(e) => set('descriptionLong', e.target.value)}
              rows={5}
            />
          </Field>
          <Field label={t('genre')} error={errors.genre}>
            <Select value={form.genre} onValueChange={(v) => set('genre', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Fantasy">Fantasy / Фантастика</SelectItem>
                <SelectItem value="Non-fiction">Non-fiction / Нон-фікшн</SelectItem>
                <SelectItem value="Detective">Detective / Детектив</SelectItem>
                <SelectItem value="Classic">Classic / Класика</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t('language')} error={errors.language}>
            <Select value={form.language} onValueChange={(v) => set('language', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="UA">🇺🇦 UA</SelectItem>
                <SelectItem value="EN">🇬🇧 EN</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t('duration')} error={errors.duration}>
            <Input
              value={form.duration}
              onChange={(e) => set('duration', e.target.value)}
              placeholder="5:30:00"
            />
          </Field>
          <Field label={t('year')} error={errors.year}>
            <Input
              type="number"
              value={form.year}
              onChange={(e) => set('year', parseInt(e.target.value))}
              min={1900}
              max={2100}
            />
          </Field>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Switch
              checked={form.isPublished}
              onCheckedChange={(v) => set('isPublished', v)}
              id="isPublished"
            />
            <Label htmlFor="isPublished">
              {form.isPublished ? t('published') : t('draft')}
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? t('loading') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className || ''}`}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
