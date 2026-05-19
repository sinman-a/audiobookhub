'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import {
  Headphones,
  Library,
  Play,
  Languages,
  ArrowRight,
  Check,
  Clock,
  PlayCircle,
} from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { LiquidBorder } from '@/components/ui/liquid-border';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { GlowCard } from '@/components/ui/spotlight-card';

interface BookData {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  descriptionShort: string;
  genre: string;
  duration: string;
}

/* ─── tiny UI mockups ─────────────────────────────────── */
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

const GENRE_COLOR: Record<string, 'blue' | 'purple' | 'green' | 'red' | 'orange'> = {
  Adventure:     'orange',
  Fantasy:       'purple',
  'Non-fiction': 'blue',
  Detective:     'red',
  Classic:       'green',
  Romance:       'red',
  Biography:     'blue',
  Music:         'purple',
};

function glowFor(genre: string): 'blue' | 'purple' | 'green' | 'red' | 'orange' {
  return GENRE_COLOR[genre] ?? 'blue';
}

/* ─── Public book card ──────────────────────────────────── */
function PublicBookCard({ book, onListen }: { book: BookData; onListen: () => void }) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Link
      href={`/${locale}/book/${book.id}`}
      className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
    >
      <GlowCard
        customSize
        className="w-full h-80 cursor-pointer transition-transform duration-200 hover:-translate-y-1"
        glowColor={glowFor(book.genre)}
      >
        {/* Row 1 — cover image */}
        <div className="relative overflow-hidden rounded-xl min-h-0">
          <Image
            src={book.imageUrl || '/placeholder.jpg'}
            alt={book.title}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        </div>

        {/* Row 2 — info */}
        <div className="space-y-1.5">
          <h3 className="font-semibold text-sm text-white leading-tight line-clamp-2">{book.title}</h3>
          <p className="text-xs text-white/55 truncate">{book.author}</p>
          <div className="flex items-center justify-between pt-0.5">
            {book.duration ? (
              <span className="flex items-center gap-1 text-xs text-white/40">
                <Clock className="h-3 w-3" />
                {book.duration}
              </span>
            ) : <span />}
            <button
              onClick={(e) => { e.preventDefault(); onListen(); }}
              className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              {t('listen_free')}
            </button>
          </div>
        </div>
      </GlowCard>
    </Link>
  );
}

/* ─── Page ─────────────────────────────────────────────── */
export function LandingContent({ books }: { books: BookData[] }) {
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
        <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-400">
          <Headphones className="h-4 w-4" />
          {t('landing_badge')}
        </div>

        <h1 className="animate-fade-in-up delay-100 mb-6 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          {t('landing_title')}{' '}
          <span className="animate-fade-in-up delay-200 block text-gradient-animate">
            {t('landing_title_accent')}
          </span>
        </h1>

        <p className="animate-fade-in-up delay-300 mb-10 max-w-2xl text-lg text-white/60 sm:text-xl leading-relaxed">
          {t('landing_subtitle')}
        </p>

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
          <LiquidBorder>
            <Button
              size="lg"
              onClick={() => openModal('login')}
              className="gap-2 bg-[#020617] px-8 text-white hover:bg-[#0a1628] transition-all duration-300 text-base rounded-full"
            >
              {t('landing_cta_secondary')}
            </Button>
          </LiquidBorder>
        </div>

        <p className="animate-fade-in-up delay-500 text-xs text-white/30 flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-green-400" />
          {t('landing_no_cc')}
        </p>
      </section>

      {/* ── Popular Books ─────────────────────────────────── */}
      {books.length > 0 && (
        <section className="relative py-16 px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-center text-2xl font-bold text-white sm:text-3xl">
              {t('popular_books')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {books.map((book) => (
                <PublicBookCard
                  key={book.id}
                  book={book}
                  onListen={() => openModal('register')}
                />
              ))}
            </div>
          </div>
        </section>
      )}

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

      <AuthModal open={modalOpen} onOpenChange={setModalOpen} defaultMode={modalMode} />
    </div>
  );
}
