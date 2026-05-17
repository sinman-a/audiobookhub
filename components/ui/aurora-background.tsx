'use client';

import { useEffect, useState } from 'react';
import { useMotionTemplate, useMotionValue, motion, animate } from 'framer-motion';
import dynamic from 'next/dynamic';

const StarsCanvas = dynamic(() => import('./stars-canvas'), { ssr: false });

const COLORS_TOP = ['#13FFAA', '#1E67C6', '#CE84CF', '#DD335C'];

export function AuroraBackground() {
  const [mounted, setMounted] = useState(false);
  const color = useMotionValue(COLORS_TOP[0]);

  useEffect(() => {
    setMounted(true);
    animate(color, COLORS_TOP, {
      ease: 'easeInOut',
      duration: 10,
      repeat: Infinity,
      repeatType: 'mirror',
    });
  }, []);

  if (!mounted) return null;

  const backgroundImage = useMotionTemplate`radial-gradient(125% 125% at 50% 0%, #020617 50%, ${color})`;

  return (
    <motion.div
      style={{ backgroundImage }}
      className="fixed inset-0 -z-10"
    >
      <StarsCanvas />
    </motion.div>
  );
}
