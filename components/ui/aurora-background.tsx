'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const StarsCanvas = dynamic(() => import('./stars-canvas'), { ssr: false });

export function AuroraBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="aurora-gradient fixed inset-0 -z-10 overflow-hidden">
      <StarsCanvas />
    </div>
  );
}
