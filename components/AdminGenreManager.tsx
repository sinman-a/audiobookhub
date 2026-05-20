'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface SubcategoryRef {
  id: string;
  nameUk: string;
  nameEn: string;
  category: { id: string; nameUk: string; nameEn: string } | null;
}

interface Genre {
  id: string;
  nameUk: string;
  nameEn: string;
  subcategory: SubcategoryRef | null;
}

interface SubcategoryOption {
  id: string;
  nameUk: string;
  nameEn: string;
  categoryId: string;
  category: { nameUk: string; nameEn: string };
}

export function AdminGenreManager() {
  const t = useTranslations();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nameUk: '', nameEn: '', subcategoryId: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [g, s] = await Promise.all([
      fetch('/api/admin/genres').then((r) => r.json()),
      fetch('/api/admin/subcategories').then((r) => r.json()),
    ]);
    setGenres(Array.isArray(g) ? g : []);
    setSubcategories(Array.isArray(s) ? s : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ nameUk: '', nameEn: '', subcategoryId: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.nameUk.trim()) return;
    setSaving(true);
    const url = editingId ? `/api/admin/genres/${editingId}` : '/api/admin/genres';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nameUk: form.nameUk.trim(),
        nameEn: form.nameEn.trim(),
        subcategoryId: form.subcategoryId || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(t('genre_saved'));
      resetForm();
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? 'Error');
    }
  };

  const handleEdit = (g: Genre) => {
    setForm({
      nameUk: g.nameUk,
      nameEn: g.nameEn,
      subcategoryId: g.subcategory?.id ?? '',
    });
    setEditingId(g.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirm_delete_genre'))) return;
    const res = await fetch(`/api/admin/genres/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success(t('genre_deleted'));
      load();
    } else {
      toast.error('Error');
    }
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{t('admin_tab_genres')}</h2>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" />
          {t('add_genre')}
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 border border-white/10 rounded-lg bg-white/5 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <p className="text-xs text-muted-foreground mb-1">{t('name_uk')}</p>
            <Input
              value={form.nameUk}
              onChange={(e) => setForm((f) => ({ ...f, nameUk: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={t('genre_name')}
              autoFocus
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <p className="text-xs text-muted-foreground mb-1">{t('name_en')}</p>
            <Input
              value={form.nameEn}
              onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={t('genre_name')}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs text-muted-foreground mb-1">{t('admin_tab_subcategories')}</p>
            <Select
              value={form.subcategoryId || '__none__'}
              onValueChange={(v) => setForm((f) => ({ ...f, subcategoryId: v === '__none__' ? '' : v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('no_subcategory')}</SelectItem>
                {subcategories.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nameUk}
                    <span className="text-white/40 ml-1.5 text-xs">/ {s.category.nameUk}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !form.nameUk.trim()}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : genres.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">{t('no_books_yet')}</p>
      ) : (
        <div className="rounded-lg border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">{t('name_uk')}</th>
                <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">{t('name_en')}</th>
                <th className="text-left px-4 py-2.5 font-medium hidden lg:table-cell">{t('admin_tab_subcategories')}</th>
                <th className="text-left px-4 py-2.5 font-medium hidden lg:table-cell">{t('admin_tab_categories')}</th>
                <th className="w-20 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {genres.map((g) => (
                <tr key={g.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium">{g.nameUk}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {g.nameEn || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {g.subcategory?.nameUk ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {g.subcategory?.category?.nameUk ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleEdit(g)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(g.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
