'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const urlSchema = z.string().url();

interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ id: string; message: string }>;
}

export default function ImportPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session } = useSession();
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

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

  const handleImport = async () => {
    setUrlError('');
    const trimmed = url.trim();
    if (!urlSchema.safeParse(trimmed).success) {
      setUrlError(t('import_invalid_url'));
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? t('import_error'));
        return;
      }

      setResult(data as ImportResult);
      if (data.imported > 0) {
        toast.success(t('import_success', { count: data.imported }));
      } else if (data.skipped > 0 && data.imported === 0) {
        toast.info(t('import_all_skipped'));
      }
    } catch {
      toast.error(t('import_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showAdminLink />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <a href={`/${locale}/admin`}>
              <ArrowLeft className="h-4 w-4" />
            </a>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('import_title')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t('import_subtitle')}</p>
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium">{t('import_url_label')}</label>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('import_url_placeholder')}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleImport()}
              disabled={loading}
            />
            <Button onClick={handleImport} disabled={loading || !url.trim()}>
              {loading ? t('loading') : t('import_btn')}
            </Button>
          </div>
          {urlError && <p className="text-xs text-destructive">{urlError}</p>}
        </div>

        {/* Hint chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">{t('import_hint_video')}</span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">{t('import_hint_playlist')}</span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">{t('import_hint_channel')}</span>
        </div>

        {/* Results */}
        {result && (
          <div className="rounded-lg border p-5 space-y-4 bg-card">
            <h2 className="font-semibold">{t('import_result_title')}</h2>
            <div className="flex gap-5 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="tabular-nums">{result.imported}</Badge>
                <span className="text-sm text-muted-foreground">{t('import_result_imported')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="tabular-nums">{result.skipped}</Badge>
                <span className="text-sm text-muted-foreground">{t('import_result_skipped')}</span>
              </div>
              {result.errors.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="tabular-nums">{result.errors.length}</Badge>
                  <span className="text-sm text-muted-foreground">{t('import_result_errors')}</span>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <details className="text-xs">
                <summary className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  {t('import_show_errors')}
                </summary>
                <ul className="mt-2 space-y-1 pl-2 border-l border-destructive/30">
                  {result.errors.map((e) => (
                    <li key={e.id} className="text-destructive">
                      <span className="font-mono">{e.id}</span>: {e.message}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {result.imported > 0 && (
              <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                {t('import_draft_notice')}
                {' '}
                <a href={`/${locale}/admin`} className="underline hover:text-foreground">
                  {t('admin_panel')} →
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
