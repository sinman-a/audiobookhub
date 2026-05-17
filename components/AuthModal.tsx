'use client';

import { useState, useId, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { BookHeadphones, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Mode = 'login' | 'register';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: Mode;
}

export function AuthModal({ open, onOpenChange, defaultMode = 'register' }: AuthModalProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const uid = useId();
  const [mode, setMode] = useState<Mode>(defaultMode);

  useEffect(() => {
    if (open) setMode(defaultMode);
  }, [open, defaultMode]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setEmail(''); setPassword(''); setConfirm(''); setErrors({});
  };

  const switchMode = (m: Mode) => { setMode(m); reset(); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn('credentials', { email, password, redirect: false });
      if (res?.error) {
        setErrors({ form: t('invalid_credentials') });
      } else {
        onOpenChange(false);
        router.push(`/${locale}/dashboard`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email) errs.email = t('field_required');
    if (password.length < 8) errs.password = t('password_too_short');
    if (password !== confirm) errs.confirm = t('passwords_not_match');
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword: confirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'email_already_exists') {
          setErrors({ email: t('email_already_exists') });
        } else {
          toast.error(data.error);
        }
        return;
      }
      toast.success(t('register_success'));
      switchMode('login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-xl border-white/10 text-white p-0 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['register', 'login'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                mode === m
                  ? 'text-white border-b-2 border-blue-400'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              {m === 'login' ? t('login') : t('register')}
            </button>
          ))}
        </div>

        <div className="p-6">
          <DialogHeader className="mb-5">
            <div className="flex justify-center mb-3">
              <BookHeadphones className="h-9 w-9 text-blue-400" />
            </div>
            <DialogTitle className="text-center text-white text-xl">
              {mode === 'login' ? t('welcome') : t('register')}
            </DialogTitle>
          </DialogHeader>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-login-email`} className="text-white/70">{t('email')}</Label>
                <Input
                  id={`${uid}-login-email`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-login-password`} className="text-white/70">{t('password')}</Label>
                <Input
                  id={`${uid}-login-password`}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400"
                />
              </div>
              {errors.form && <p className="text-xs text-red-400">{errors.form}</p>}
              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white mt-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('login')}
              </Button>
              <p className="text-center text-sm text-white/60">
                {t('no_account')}{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-blue-400 hover:underline"
                >
                  {t('register')}
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-reg-email`} className="text-white/70">{t('email')}</Label>
                <Input
                  id={`${uid}-reg-email`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400"
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-reg-password`} className="text-white/70">{t('password')}</Label>
                <Input
                  id={`${uid}-reg-password`}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400"
                />
                {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-reg-confirm`} className="text-white/70">{t('confirm_password')}</Label>
                <Input
                  id={`${uid}-reg-confirm`}
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400"
                />
                {errors.confirm && <p className="text-xs text-red-400">{errors.confirm}</p>}
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white mt-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('landing_cta_primary')}
              </Button>
              <p className="text-center text-sm text-white/60">
                {t('have_account')}{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-blue-400 hover:underline"
                >
                  {t('login')}
                </button>
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
