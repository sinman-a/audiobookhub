'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BookHeadphones } from 'lucide-react';
import HeroWave from '@/components/ui/dynamic-wave-canvas-background';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        toast.error(t('invalid_credentials'));
      } else {
        router.push(`/${locale}/dashboard`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <HeroWave />
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSwitcher />
      </div>
      <Card className="relative w-full max-w-md mx-4 bg-black/60 backdrop-blur-md border-white/10 text-white">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <BookHeadphones className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">AudioBook Hub</CardTitle>
          <p className="text-sm text-white/70">{t('welcome')}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('loading') : t('login')}
            </Button>
          </form>
          <p className="text-center text-sm text-white/60 mt-4">
            <Link href={`/${locale}/register`} className="underline hover:text-foreground">
              {t('register')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
