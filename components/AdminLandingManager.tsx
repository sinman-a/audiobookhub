'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { X, Plus } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface BookSummary {
  id: string;
  title: string;
  author: string;
  imageUrl?: string;
  status?: string;
}

type LocaleContent = Record<string, string>;

interface LandingData {
  featuredBooks: BookSummary[];
  allBooks: BookSummary[];
  configs: { uk: LocaleContent | null; en: LocaleContent | null };
}

const TEXT_SECTIONS = [
  {
    section: 'hero',
    labelKey: 'landing_section_hero',
    fields: [
      { key: 'landing_badge',        label: 'Badge (зверху)', multiline: false },
      { key: 'landing_title',        label: 'Заголовок',       multiline: false },
      { key: 'landing_title_accent', label: 'Акцент заголовку',multiline: false },
      { key: 'landing_subtitle',     label: 'Підзаголовок',    multiline: true  },
      { key: 'landing_cta_primary',  label: 'CTA кнопка (основна)', multiline: false },
      { key: 'landing_cta_secondary',label: 'CTA кнопка (вторинна)',multiline: false },
      { key: 'landing_no_cc',        label: 'Примітка під кнопками', multiline: false },
    ],
  },
  {
    section: 'popular_books',
    labelKey: 'landing_section_popular',
    fields: [
      { key: 'popular_books', label: 'Заголовок секції', multiline: false },
    ],
  },
  {
    section: 'why_us',
    labelKey: 'landing_section_why',
    fields: [
      { key: 'why_us_title', label: 'Заголовок секції', multiline: false },
      { key: 'why_1_title',  label: 'Карта 1 — назва',  multiline: false },
      { key: 'why_1_desc',   label: 'Карта 1 — опис',   multiline: true  },
      { key: 'why_2_title',  label: 'Карта 2 — назва',  multiline: false },
      { key: 'why_2_desc',   label: 'Карта 2 — опис',   multiline: true  },
      { key: 'why_3_title',  label: 'Карта 3 — назва',  multiline: false },
      { key: 'why_3_desc',   label: 'Карта 3 — опис',   multiline: true  },
    ],
  },
  {
    section: 'final_cta',
    labelKey: 'landing_section_cta',
    fields: [
      { key: 'final_cta_title', label: 'Заголовок',  multiline: false },
      { key: 'final_cta_desc',  label: 'Опис',        multiline: true  },
      { key: 'final_cta_btn',   label: 'Текст кнопки',multiline: false },
    ],
  },
];

export function AdminLandingManager() {
  const t = useTranslations();
  const [data, setData] = useState<LandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addBookId, setAddBookId] = useState('');
  const [textLocale, setTextLocale] = useState<'uk' | 'en'>('uk');
  const [drafts, setDrafts] = useState<{ uk: LocaleContent; en: LocaleContent }>({ uk: {}, en: {} });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/landing');
    if (res.ok) {
      const d: LandingData = await res.json();
      setData(d);
      setDrafts({
        uk: (d.configs.uk as LocaleContent) ?? {},
        en: (d.configs.en as LocaleContent) ?? {},
      });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggleFeatured = async (bookId: string, featured: boolean) => {
    const res = await fetch('/api/admin/landing/featured', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, featured }),
    });
    if (res.ok) {
      toast.success(featured ? t('landing_book_added') : t('landing_book_removed'));
      load();
      setAddBookId('');
    } else {
      toast.error('Error');
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    const content = drafts[textLocale];
    const res = await fetch('/api/admin/landing/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: textLocale, content }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(t('landing_config_saved'));
    } else {
      toast.error('Error');
    }
  };

  const setField = (key: string, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [textLocale]: { ...prev[textLocale], [key]: value },
    }));
  };

  const featuredIds = new Set(data?.featuredBooks.map((b) => b.id) ?? []);
  const availableToAdd = data?.allBooks.filter((b) => !featuredIds.has(b.id)) ?? [];

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* ── Section 1: Featured Books ─────────────────────── */}
      <div>
        <h2 className="text-xl font-semibold mb-1">{t('landing_featured_books')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t('landing_featured_hint')}</p>

        {/* Current featured list */}
        <div className="space-y-2 mb-4">
          {(data?.featuredBooks ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">{t('landing_no_featured')}</p>
          )}
          {(data?.featuredBooks ?? []).map((book) => (
            <div
              key={book.id}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
            >
              <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded">
                <Image
                  src={book.imageUrl || '/placeholder.jpg'}
                  alt={book.title}
                  fill
                  className="object-contain"
                  sizes="28px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{book.title}</p>
                <p className="text-xs text-muted-foreground truncate">{book.author}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                onClick={() => handleToggleFeatured(book.id, false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add book */}
        <div className="flex gap-2">
          <Select value={addBookId} onValueChange={setAddBookId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={t('landing_select_book')} />
            </SelectTrigger>
            <SelectContent>
              {availableToAdd.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.title} — {b.author}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!addBookId}
            onClick={() => addBookId && handleToggleFeatured(addBookId, true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('add')}
          </Button>
        </div>
      </div>

      {/* ── Section 2: Text Content ───────────────────────── */}
      <div>
        <h2 className="text-xl font-semibold mb-1">{t('landing_text_content')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t('landing_text_hint')}</p>

        {/* Locale sub-tabs */}
        <div className="flex gap-1 mb-6 border-b border-white/10">
          {(['uk', 'en'] as const).map((loc) => (
            <button
              key={loc}
              onClick={() => setTextLocale(loc)}
              className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
                textLocale === loc
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {loc === 'uk' ? '🇺🇦 Українська' : '🇬🇧 English'}
            </button>
          ))}
        </div>

        {/* Text fields per section */}
        <div className="space-y-8">
          {TEXT_SECTIONS.map(({ section, fields }) => (
            <div key={section}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {t(`landing_section_${section}` as Parameters<typeof t>[0])}
              </h3>
              <div className="space-y-3">
                {fields.map(({ key, label, multiline }) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                    {multiline ? (
                      <Textarea
                        value={drafts[textLocale][key] ?? ''}
                        onChange={(e) => setField(key, e.target.value)}
                        rows={3}
                        placeholder={`(${t('landing_placeholder_hint')})`}
                      />
                    ) : (
                      <Input
                        value={drafts[textLocale][key] ?? ''}
                        onChange={(e) => setField(key, e.target.value)}
                        placeholder={`(${t('landing_placeholder_hint')})`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveConfig} disabled={saving}>
            {saving ? t('loading') : t('save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
