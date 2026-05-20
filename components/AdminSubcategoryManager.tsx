'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface Category {
  id: string;
  nameUk: string;
  nameEn: string;
}

interface Subcategory {
  id: string;
  nameUk: string;
  nameEn: string;
  categoryId: string;
  category: Category;
  _count: { genres: number };
}

export function AdminSubcategoryManager() {
  const t = useTranslations();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nameUk: '', nameEn: '', categoryId: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [s, c] = await Promise.all([
      fetch('/api/admin/subcategories').then((r) => r.json()),
      fetch('/api/admin/categories').then((r) => r.json()),
    ]);
    setSubcategories(Array.isArray(s) ? s : []);
    setCategories(Array.isArray(c) ? c : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ nameUk: '', nameEn: '', categoryId: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.nameUk.trim() || !form.categoryId) return;
    setSaving(true);
    const url = editingId ? `/api/admin/subcategories/${editingId}` : '/api/admin/subcategories';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nameUk: form.nameUk.trim(),
        nameEn: form.nameEn.trim(),
        categoryId: form.categoryId,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(t('subcategory_saved'));
      resetForm();
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? 'Error');
    }
  };

  const handleEdit = (s: Subcategory) => {
    setForm({ nameUk: s.nameUk, nameEn: s.nameEn, categoryId: s.categoryId });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleDelete = async (s: Subcategory) => {
    if (!window.confirm(t('confirm_delete_subcategory'))) return;
    const res = await fetch(`/api/admin/subcategories/${s.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success(t('subcategory_deleted'));
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
        <h2 className="text-xl font-semibold">{t('admin_tab_subcategories')}</h2>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" />
          {t('add_subcategory')}
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
              placeholder={t('subcategory_name')}
              autoFocus
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <p className="text-xs text-muted-foreground mb-1">{t('name_en')}</p>
            <Input
              value={form.nameEn}
              onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={t('subcategory_name')}
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <p className="text-xs text-muted-foreground mb-1">{t('admin_tab_categories')}</p>
            <Select
              value={form.categoryId || '__none__'}
              onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v === '__none__' ? '' : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('no_category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('no_category')}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nameUk}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !form.nameUk.trim() || !form.categoryId}
            >
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
      ) : subcategories.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">{t('no_books_yet')}</p>
      ) : (
        <div className="rounded-lg border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">{t('name_uk')}</th>
                <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">{t('name_en')}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t('admin_tab_categories')}</th>
                <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">{t('genre_count')}</th>
                <th className="w-20 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {subcategories.map((s) => (
                <tr key={s.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium">{s.nameUk}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {s.nameEn || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.category.nameUk}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {s._count.genres}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleEdit(s)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(s)}
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
