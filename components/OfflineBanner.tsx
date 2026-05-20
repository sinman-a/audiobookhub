'use client';
import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function OfflineBanner() {
  const t = useTranslations();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const off = () => setOffline(true);
    const on  = () => setOffline(false);
    window.addEventListener('offline', off);
    window.addEventListener('online',  on);
    return () => {
      window.removeEventListener('offline', off);
      window.removeEventListener('online',  on);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-amber-500/90 backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-black">
      <WifiOff className="h-4 w-4 shrink-0" />
      {t('offline_status')}
    </div>
  );
}
