'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
    // Replace current locale prefix in path
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={locale === 'uk' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => switchLocale('uk')}
        className="h-8 px-2 text-xs font-semibold"
      >
        UA
      </Button>
      <span className="text-muted-foreground text-xs">|</span>
      <Button
        variant={locale === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => switchLocale('en')}
        className="h-8 px-2 text-xs font-semibold"
      >
        EN
      </Button>
    </div>
  );
}
