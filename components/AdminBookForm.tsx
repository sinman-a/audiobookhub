'use client';

import React, { useState, useEffect, useId } from 'react';
import { useTranslations, useLocale } from 'next-intl';
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
  relatedIds?: string[];
  categoryId?: string;
  subcategoryId?: string;
}

interface GenreOption {
  id: string;
  nameUk: string;
  nameEn: string;
}

interface CategoryOption {
  id: string;
  nameUk: string;
  nameEn: string;
}

interface SubcategoryOption {
  id: string;
  nameUk: string;
  nameEn: string;
  categoryId: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  book?: Audiobook | null;
  genres?: GenreOption[];
  allBooks?: { id: string; title: string }[];
}

const formSchema = z.object({
  title: z.string().min(1),
  author: z.string().optional().or(z.literal('')),
  imageUrl: z.string().optional().or(z.literal('')),
  youtubeUrl: z.string().min(1),
  descriptionShort: z.string().optional().or(z.literal('')),
  descriptionLong: z.string().optional().or(z.literal('')),
  duration: z.string().optional().or(z.literal('')),
  genre: z.string().optional().or(z.literal('')),
  language: z.string().optional().or(z.literal('')),
  year: z.number().int().min(1900).max(2100),
  isPublished: z.boolean(),
  relatedIds: z.string().array().default([]),
  categoryId: z.string().optional().or(z.literal('')),
  subcategoryId: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

export function AdminBookForm({ open, onClose, onSuccess, book, genres = [], allBooks = [] }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const isEdit = !!book;

  const [form, setForm] = useState<FormData>({
    title: book?.title ?? '',
    author: book?.author ?? '',
    imageUrl: book?.imageUrl ?? '',
    youtubeUrl: book ? `https://www.youtube.com/watch?v=${book.youtubeId}` : '',
    descriptionShort: book?.descriptionShort ?? '',
    descriptionLong: book?.descriptionLong ?? '',
    duration: book?.duration ?? '',
    genre: book?.genre ?? '',
    language: book?.language ?? '',
    year: book?.year ?? new Date().getFullYear(),
    isPublished: book?.isPublished ?? false,
    relatedIds: book?.relatedIds ?? [],
    categoryId: book?.categoryId ?? '',
    subcategoryId: book?.subcategoryId ?? '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [fetchedGenres, setFetchedGenres] = useState<GenreOption[]>(genres);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch('/api/admin/genres').then((r) => r.json()),
      fetch('/api/admin/categories').then((r) => r.json()),
      fetch('/api/admin/subcategories').then((r) => r.json()),
    ]).then(([g, c, s]) => {
      if (Array.isArray(g)) setFetchedGenres(g);
      if (Array.isArray(c)) setCategories(c);
      if (Array.isArray(s)) setSubcategories(s);
    }).catch(() => {});
  }, [open]);

  const set = <K extends keyof FormData>(field: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setRelated = (idx: number, bookId: string) => {
    setForm((prev) => {
      const next = ['', '', '', ''].map((_, i) => prev.relatedIds[i] ?? '');
      next[idx] = bookId;
      return { ...prev, relatedIds: next.filter(Boolean) };
    });
  };

  const localeName = (uk: string, en: string) =>
    locale === 'en' && en ? en : uk;

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
      const url = isEdit ? `/api/admin/audiobooks/${book!.id}` : '/api/admin/audiobooks';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        if (errData.error === 'invalid_youtube_url') {
          setErrors({ youtubeUrl: t('invalid_youtube_url') });
          return;
        }
        throw new Error(`${res.status}: ${errData.error ?? 'unknown'}`);
      }

      toast.success(isEdit ? t('book_updated') : t('book_added'));
      onSuccess();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubcategories = form.categoryId
    ? subcategories.filter((s) => s.categoryId === form.categoryId)
    : subcategories;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('edit_book_title') : t('add_book_title')}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={`${t('title')} *`} error={errors.title}>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label={t('author')} error={errors.author}>
            <Input value={form.author ?? ''} onChange={(e) => set('author', e.target.value)} />
          </Field>
          <Field label={`${t('youtube_url')} *`} error={errors.youtubeUrl} className="sm:col-span-2">
            <Input
              value={form.youtubeUrl}
              onChange={(e) => set('youtubeUrl', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </Field>
          <Field label={t('image_url')} error={errors.imageUrl} className="sm:col-span-2">
            <Input
              value={form.imageUrl ?? ''}
              onChange={(e) => set('imageUrl', e.target.value)}
              placeholder="https://... (залишіть порожнім — використаємо YouTube thumbnail)"
            />
          </Field>
          <Field label={t('short_description')} error={errors.descriptionShort} className="sm:col-span-2">
            <Textarea
              value={form.descriptionShort ?? ''}
              onChange={(e) => set('descriptionShort', e.target.value)}
              rows={3}
            />
          </Field>
          <Field label={t('full_description')} error={errors.descriptionLong} className="sm:col-span-2">
            <Textarea
              value={form.descriptionLong ?? ''}
              onChange={(e) => set('descriptionLong', e.target.value)}
              rows={5}
            />
          </Field>

          {/* Category */}
          <Field label={t('category')} error={errors.categoryId}>
            <Select
              value={form.categoryId || '__none__'}
              onValueChange={(v) => {
                const val = v === '__none__' ? '' : v;
                set('categoryId', val);
                set('subcategoryId', '');
              }}
            >
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {localeName(c.nameUk, c.nameEn)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Subcategory — filtered by selected category */}
          <Field label={t('subcategory')} error={errors.subcategoryId}>
            <Select
              value={form.subcategoryId || '__none__'}
              onValueChange={(v) => set('subcategoryId', v === '__none__' ? '' : v)}
            >
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                {filteredSubcategories.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {localeName(s.nameUk, s.nameEn)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Genre */}
          <Field label={t('genre')} error={errors.genre}>
            <Select value={form.genre ?? ''} onValueChange={(v) => set('genre', v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {fetchedGenres.length > 0 ? (
                  fetchedGenres.map((g) => (
                    <SelectItem key={g.id} value={g.nameUk}>
                      {localeName(g.nameUk, g.nameEn)}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__none__" disabled>{t('no_books_yet')}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </Field>

          <Field label={t('language')} error={errors.language}>
            <Select value={form.language ?? ''} onValueChange={(v) => set('language', v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="UA">🇺🇦 UA</SelectItem>
                <SelectItem value="EN">🇬🇧 EN</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t('duration')} error={errors.duration}>
            <Input
              value={form.duration ?? ''}
              onChange={(e) => set('duration', e.target.value)}
              placeholder="5:30:00"
            />
          </Field>
          <Field label={t('year')} error={errors.year}>
            <Input
              type="number"
              value={form.year}
              onChange={(e) => set('year', parseInt(e.target.value) || new Date().getFullYear())}
              min={1900}
              max={2100}
            />
          </Field>

          {/* Related books for "Similar" block */}
          {allBooks.length > 0 && (
            <div className="sm:col-span-2 space-y-2">
              <Label>{t('related_books')}</Label>
              <p className="text-xs text-muted-foreground">{t('related_books_hint')}</p>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((idx) => (
                  <Select
                    key={idx}
                    value={form.relatedIds[idx] || '__none__'}
                    onValueChange={(v) => setRelated(idx, v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`— ${idx + 1}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">—</SelectItem>
                      {allBooks
                        .filter(
                          (b) =>
                            b.id !== book?.id &&
                            !form.relatedIds.filter((_, i) => i !== idx).includes(b.id),
                        )
                        .map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ))}
              </div>
            </div>
          )}

          {/* Publish toggle */}
          <div className="sm:col-span-2 flex items-center justify-between rounded-lg border p-3 bg-muted/30">
            <div>
              <p className="font-medium text-sm">{form.isPublished ? t('published') : t('draft')}</p>
              <p className="text-xs text-muted-foreground">
                {form.isPublished
                  ? 'Книга видима у каталозі'
                  : 'Книга прихована від користувачів'}
              </p>
            </div>
            <Switch
              checked={form.isPublished}
              onCheckedChange={(v) => set('isPublished', v)}
              id="isPublished"
            />
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
  const id = useId();
  const child = children as React.ReactElement<{ id?: string }>;
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label htmlFor={id}>{label}</Label>
      {React.cloneElement(child, { id })}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
