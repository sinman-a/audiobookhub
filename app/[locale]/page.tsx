'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { BookHeadphones, Headphones, Sparkles } from 'lucide-react';
import HeroWave from '@/components/ui/dynamic-wave-canvas-background';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LandingPage() {
  const locale = useLocale();
  const t = useTranslations();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'register'>('register');

  const openModal = (mode: 'login' | 'register') => {
    setModalMode(mode);
    setModalOpen(true);
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-[#04071a]">
      <HeroWave />

      {/* Header */}
      <header className="relative flex items-center justify-between px-6 py-4 animate-fade-in">
        <div className="flex items-center gap-2.5 text-white">
          <BookHeadphones className="h-7 w-7 text-blue-400" />
          <span className="text-xl font-bold tracking-tight">AudioBook Hub</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button
            variant="ghost"
            onClick={() => openModal('login')}
            className="text-white/70 hover:text-white hover:bg-white/10 border border-white/15 text-sm"
          >
            {t('login')}
          </Button>
        </div>
      </header>

      {/* Hero section */}
      <main className="relative flex flex-1 flex-col items-center justify-center text-center px-4 py-16">

        {/* Badge */}
        <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300 backdrop-blur-sm">
          <Headphones className="h-4 w-4" />
          {t('landing_badge')}
        </div>

        {/* Title line 1 */}
        <h1 className="animate-fade-in-up delay-100 mb-2 max-w-4xl text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
          {t('landing_title')}
        </h1>

        {/* Title line 2 – animated gradient */}
        <h1 className="animate-fade-in-up delay-200 mb-6 max-w-4xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl text-gradient-animate">
          {t('landing_title_accent')}
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up delay-300 mb-10 max-w-xl text-lg text-white/55 sm:text-xl leading-relaxed">
          {t('landing_subtitle')}
        </p>

        {/* CTA buttons */}
        <div className="animate-fade-in-up delay-400 flex flex-wrap items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={() => openModal('register')}
            className="gap-2 bg-blue-500 px-8 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-105 hover:shadow-blue-400/40"
          >
            <Sparkles className="h-5 w-5" />
            {t('landing_cta_primary')}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => openModal('login')}
            className="gap-2 border-white/20 bg-white/5 px-8 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all duration-300 hover:border-white/40"
          >
            {t('landing_cta_secondary')}
          </Button>
        </div>

        {/* Feature pills */}
        <div className="animate-fade-in-up delay-500 mt-14 flex flex-wrap justify-center gap-3">
          {(['landing_feature_1', 'landing_feature_2', 'landing_feature_3'] as const).map((key) => (
            <span
              key={key}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/40 backdrop-blur-sm"
            >
              {t(key)}
            </span>
          ))}
        </div>
      </main>

      {/* Auth modal */}
      <AuthModal open={modalOpen} onOpenChange={setModalOpen} defaultMode={modalMode} />
    </div>
  );
}
