'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import { BookMarked, LogOut, BookHeadphones, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { InstallPWA } from './InstallPWA';

interface HeaderProps {
  showAdminLink?: boolean;
}

export function Header({ showAdminLink }: HeaderProps) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded focus:shadow-lg"
      >
        Skip to content
      </a>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-md">
            <Image
              src="/logo.png"
              alt="AudioBook Hub"
              fill
              className="object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <span className="hidden font-bold sm:inline-block text-lg">
            AudioBook Hub
          </span>
          <BookHeadphones className="h-5 w-5 sm:hidden" />
        </Link>

        <nav className="flex items-center gap-2">
          <Link href={`/${locale}/library`}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <BookMarked className="h-4 w-4" />
              <span className="hidden sm:inline">{t('library')}</span>
            </Button>
          </Link>
          {showAdminLink && (
            <>
              <Link href={`/${locale}/admin/analytics`}>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <BarChart2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('analytics')}</span>
                </Button>
              </Link>
              <Link href={`/${locale}/admin`}>
                <Button variant="ghost" size="sm">
                  {t('admin_panel')}
                </Button>
              </Link>
            </>
          )}
          <InstallPWA />
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => { await signOut({ redirect: false }); window.location.href = '/'; }}
            aria-label={t('logout')}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
