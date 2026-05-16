'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { BookHeadphones, Headphones, BookOpen, Play } from 'lucide-react';
import HeroWave from '@/components/ui/dynamic-wave-canvas-background';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LandingPage() {
  const locale = useLocale();
  const t = useTranslations();

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <HeroWave />

      {/* Header */}
      <header className="relative flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-white">
          <BookHeadphones className="h-7 w-7 text-blue-400" />
          <span className="text-xl font-bold tracking-tight">AudioBook Hub</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link href={`/${locale}/login`}>
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 border border-white/20">
              {t('login')}
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative flex flex-1 flex-col items-center justify-center text-center px-4 py-20">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm text-white/70 backdrop-blur-sm">
          <Headphones className="h-4 w-4 text-blue-400" />
          {t('landing_badge')}
        </div>

        {/* Title */}
        <h1 className="mb-4 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
          {t('landing_title')}
          <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            {t('landing_title_accent')}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mb-10 max-w-xl text-lg text-white/60 sm:text-xl">
          {t('landing_subtitle')}
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href={`/${locale}/register`}>
            <Button
              size="lg"
              className="gap-2 bg-blue-500 px-8 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30"
            >
              <Play className="h-5 w-5" />
              {t('landing_cta_primary')}
            </Button>
          </Link>
          <Link href={`/${locale}/login`}>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-white/20 bg-white/5 px-8 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm"
            >
              <BookOpen className="h-5 w-5" />
              {t('landing_cta_secondary')}
            </Button>
          </Link>
        </div>

        {/* Feature pills */}
        <div className="mt-16 flex flex-wrap justify-center gap-3">
          {(['landing_feature_1', 'landing_feature_2', 'landing_feature_3'] as const).map((key) => (
            <span
              key={key}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/50 backdrop-blur-sm"
            >
              {t(key)}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
