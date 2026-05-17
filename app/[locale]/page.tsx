'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  Headphones,
  Library,
  Play,
  Languages,
  ArrowRight,
  Check,
} from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { LiquidBorder } from '@/components/ui/liquid-border';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

/* ─── tiny UI mockups ─────────────────────────────────── */
function MockCatalog() {
  const covers = [
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=80&h=110&fit=crop',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=80&h=110&fit=crop',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=80&h=110&fit=crop',
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=80&h=110&fit=crop',
  ];
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm w-full">
      <div className="mb-3 h-2 w-24 rounded bg-white/20" />
      <div className="grid grid-cols-2 gap-2">
        {covers.map((src, i) => (
          <div key={i} className="rounded-lg overflow-hidden bg-white/5">
            <img src={src} alt="" className="w-full h-16 object-cover opacity-80" />
            <div className="p-1.5 space-y-1">
              <div className="h-1.5 w-full rounded bg-white/20" />
              <div className="h-1.5 w-2/3 rounded bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockPlayer() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm w-full">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-red-400" />
        <div className="h-2 w-16 rounded bg-white/20" />
      </div>
      <div className="rounded-lg bg-black/40 aspect-video flex items-center justify-center mb-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Play className="h-5 w-5 text-white fill-white ml-0.5" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 w-3/4 rounded bg-white/20" />
        <div className="h-1.5 w-1/2 rounded bg-white/10" />
        <div className="mt-2 h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-2/5 rounded-full bg-blue-400/70" />
        </div>
      </div>
    </div>
  );
}

function MockMobile() {
  return (
    <div className="mx-auto w-28 rounded-[20px] border-2 border-white/15 bg-white/5 p-2 backdrop-blur-sm">
      <div className="rounded-[14px] bg-black/60 overflow-hidden">
        <div className="px-2 pt-2 pb-1">
          <div className="h-1.5 w-12 mx-auto rounded bg-white/20 mb-2" />
          <img
            src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=120&h=80&fit=crop"
            alt=""
            className="w-full rounded-lg opacity-70"
          />
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full rounded bg-white/20" />
            <div className="h-1.5 w-3/4 rounded bg-white/10" />
          </div>
          <div className="mt-2 h-5 w-full rounded-md bg-blue-500/50 flex items-center justify-center">
            <div className="h-1.5 w-10 rounded bg-white/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Feature card ─────────────────────────────────────── */
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-blue-400/30 hover:bg-white/8">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-white/55">{desc}</p>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────── */
export default function LandingPage() {
  const t = useTranslations();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'register'>('register');

  const openModal = (mode: 'login' | 'register') => {
    setModalMode(mode);
    setModalOpen(true);
  };

  return (
    <div className="relative flex flex-col text-white overflow-x-hidden">

      {/* ── Header ───────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-20 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="AudioBook Hub" width={36} height={36} className="object-contain" />
          <span className="text-lg font-bold tracking-tight">AudioBook Hub</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openModal('login')}
            className="text-white/70 hover:text-white hover:bg-white/10 border border-white/15"
          >
            {t('login')}
          </Button>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section id="main-content" className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-24 pb-16">
        {/* badge */}
        <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-400">
          <Headphones className="h-4 w-4" />
          {t('landing_badge')}
        </div>

        {/* title */}
        <h1 className="animate-fade-in-up delay-100 mb-6 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          {t('landing_title')}{' '}
          <span className="animate-fade-in-up delay-200 block text-gradient-animate">
            {t('landing_title_accent')}
          </span>
        </h1>

        {/* subtitle */}
        <p className="animate-fade-in-up delay-300 mb-10 max-w-2xl text-lg text-white/60 sm:text-xl leading-relaxed">
          {t('landing_subtitle')}
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up delay-400 flex flex-wrap items-center justify-center gap-3 mb-4">
          <LiquidBorder>
            <Button
              size="lg"
              onClick={() => openModal('register')}
              className="gap-2 bg-blue-500 px-8 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/40 transition-all duration-300 text-base font-semibold rounded-full"
            >
              {t('landing_cta_primary')}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </LiquidBorder>
          <Button
            size="lg"
            variant="outline"
            onClick={() => openModal('login')}
            className="gap-2 border-white/20 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white hover:border-white/40 transition-all duration-300 text-base"
          >
            {t('landing_cta_secondary')}
          </Button>
        </div>

        {/* no cc */}
        <p className="animate-fade-in-up delay-500 text-xs text-white/30 flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-green-400" />
          {t('landing_no_cc')}
        </p>
      </section>

      {/* ── Why Us ───────────────────────────────────────── */}
      <section className="relative py-24 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-white sm:text-4xl">
            {t('why_us_title')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon={<Library className="h-6 w-6" />}
              title={t('why_1_title')}
              desc={t('why_1_desc')}
            />
            <FeatureCard
              icon={<Play className="h-6 w-6" />}
              title={t('why_2_title')}
              desc={t('why_2_desc')}
            />
            <FeatureCard
              icon={<Languages className="h-6 w-6" />}
              title={t('why_3_title')}
              desc={t('why_3_desc')}
            />
          </div>
        </div>
      </section>

      {/* ── Mockups ──────────────────────────────────────── */}
      <section className="relative py-16 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="w-full sm:w-64 animate-fade-in-up delay-100">
              <MockCatalog />
              <p className="mt-2 text-center text-xs text-white/30">Каталог книг</p>
            </div>
            <div className="w-full sm:w-64 animate-fade-in-up delay-200">
              <MockPlayer />
              <p className="mt-2 text-center text-xs text-white/30">Сторінка з плеєром</p>
            </div>
            <div className="flex flex-col items-center animate-fade-in-up delay-300">
              <MockMobile />
              <p className="mt-2 text-center text-xs text-white/30">Мобільна версія</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="relative py-28 px-4">
        <div className="mx-auto max-w-xl text-center">
          {/* glow backdrop */}
          <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
            <div className="h-64 w-64 rounded-full bg-blue-600/15 blur-3xl" />
          </div>

          <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">
            {t('final_cta_title')}
          </h2>
          <p className="mb-8 text-white/55 text-lg">
            {t('final_cta_desc')}
          </p>
          <LiquidBorder>
            <Button
              size="lg"
              onClick={() => openModal('register')}
              className="gap-2 bg-blue-500 px-10 text-white hover:bg-blue-400 shadow-xl shadow-blue-500/30 transition-all duration-300 text-base font-semibold rounded-full"
            >
              {t('final_cta_btn')}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </LiquidBorder>
          <p className="mt-4 text-xs text-white/30 flex items-center justify-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-green-400" />
            {t('landing_no_cc')}
          </p>
        </div>
      </section>

      {/* Auth modal */}
      <AuthModal open={modalOpen} onOpenChange={setModalOpen} defaultMode={modalMode} />
    </div>
  );
}
