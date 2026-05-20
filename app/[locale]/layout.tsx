import type { Metadata } from 'next';
import { Rubik } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dynamic from 'next/dynamic';
import { Providers } from '@/components/Providers';
import { PostHogProvider } from '@/components/PostHogProvider';
import { OfflineBanner } from '@/components/OfflineBanner';

const AuroraBackground = dynamic(
  () => import('@/components/ui/aurora-background').then((m) => ({ default: m.AuroraBackground })),
  { ssr: false }
);
import '../globals.css';

const rubik = Rubik({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-rubik',
  display: 'swap',
});

const locales = ['uk', 'en'];

export const metadata: Metadata = {
  title: 'AudioBook Hub',
  description: 'Твоя особиста бібліотека аудіокниг',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AudioBook Hub',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale)) notFound();

  const messages = await getMessages();
  const session = await getServerSession(authOptions);

  return (
    <html lang={locale} className={`${rubik.variable} dark`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuroraBackground />
        <PostHogProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Providers session={session}>
              <OfflineBanner />
              {children}
            </Providers>
          </NextIntlClientProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
