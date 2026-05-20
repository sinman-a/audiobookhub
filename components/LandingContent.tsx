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
        <div className="space-y-1.5 overflow-hidden">
          <h3 className="font-semibold text-sm text-white leading-tight line-clamp-2 min-h-[2.5em]">{book.title}</h3>
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
              {t('listen')}
            </button>
          </div>
        </div>
      </GlowCard>
    </Link>
  );
}

/* ─── Page ─────────────────────────────────────────────── */
export function LandingContent({
  books,
  overrides = {},
}: {
  books: BookData[];
  overrides?: Record<string, string>;
}) {
  const t = useTranslations();
  const text = (key: string) => overrides[key] || t(key as Parameters<typeof t>[0]);
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
          {text('landing_badge')}
        </div>

        <h1 className="animate-fade-in-up delay-100 mb-6 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          {text('landing_title')}{' '}
          <span className="animate-fade-in-up delay-200 block text-gradient-animate">
            {text('landing_title_accent')}
          </span>
        </h1>

        <p className="animate-fade-in-up delay-300 mb-10 max-w-2xl text-lg text-white/60 sm:text-xl leading-relaxed">
          {text('landing_subtitle')}
        </p>

        <div className="animate-fade-in-up delay-400 flex flex-wrap items-center justify-center gap-3 mb-4">
          <LiquidBorder>
            <Button
              size="lg"
              onClick={() => openModal('register')}
              className="gap-2 bg-blue-500 px-8 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/40 transition-all duration-300 text-base font-semibold rounded-full"
            >
              {text('landing_cta_primary')}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </LiquidBorder>
          <LiquidBorder>
            <Button
              size="lg"
              onClick={() => openModal('login')}
              className="gap-2 bg-[#020617] px-8 text-white hover:bg-[#0a1628] transition-all duration-300 text-base rounded-full"
            >
              {text('landing_cta_secondary')}
            </Button>
          </LiquidBorder>
        </div>

        <p className="animate-fade-in-up delay-500 text-xs text-white/30 flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-green-400" />
          {text('landing_no_cc')}
        </p>
      </section>

      {/* ── Popular Books ─────────────────────────────────── */}
      {books.length > 0 && (
        <section className="relative py-16 px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-center text-2xl font-bold text-white sm:text-3xl">
              {text('popular_books')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
            {text('why_us_title')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon={<Library className="h-6 w-6" />}
              title={text('why_1_title')}
              desc={text('why_1_desc')}
            />
            <FeatureCard
              icon={<Play className="h-6 w-6" />}
              title={text('why_2_title')}
              desc={text('why_2_desc')}
            />
            <FeatureCard
              icon={<Languages className="h-6 w-6" />}
              title={text('why_3_title')}
              desc={text('why_3_desc')}
            />
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
            {text('final_cta_title')}
          </h2>
          <p className="mb-8 text-white/55 text-lg">
            {text('final_cta_desc')}
          </p>
          <LiquidBorder>
            <Button
              size="lg"
              onClick={() => openModal('register')}
              className="gap-2 bg-blue-500 px-10 text-white hover:bg-blue-400 shadow-xl shadow-blue-500/30 transition-all duration-300 text-base font-semibold rounded-full"
            >
              {text('final_cta_btn')}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </LiquidBorder>
          <p className="mt-4 text-xs text-white/30 flex items-center justify-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-green-400" />
            {text('landing_no_cc')}
          </p>
        </div>
      </section>

      <AuthModal open={modalOpen} onOpenChange={setModalOpen} defaultMode={modalMode} />
    </div>
  );
}
