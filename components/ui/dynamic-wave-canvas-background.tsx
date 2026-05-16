'use client';

import React, { useEffect, useRef } from 'react';

const HeroWave = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SCALE = 3;
    let width = 0;
    let height = 0;
    let data: Uint8ClampedArray | null = null;
    let animId: number;

    const resizeCanvas = () => {
      width = Math.max(1, Math.floor(window.innerWidth / SCALE));
      height = Math.max(1, Math.floor(window.innerHeight / SCALE));
      canvas.width = width;
      canvas.height = height;
      data = new Uint8ClampedArray(width * height * 4);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const startTime = Date.now();

    const TABLE_SIZE = 2048;
    const SIN_TABLE = new Float32Array(TABLE_SIZE);
    const COS_TABLE = new Float32Array(TABLE_SIZE);
    for (let i = 0; i < TABLE_SIZE; i++) {
      const angle = (i / TABLE_SIZE) * Math.PI * 2;
      SIN_TABLE[i] = Math.sin(angle);
      COS_TABLE[i] = Math.cos(angle);
    }

    const TWO_PI = Math.PI * 2;

    const tsin = (x: number): number => {
      let n = x % TWO_PI;
      if (n < 0) n += TWO_PI;
      return SIN_TABLE[(n / TWO_PI * TABLE_SIZE) & (TABLE_SIZE - 1)];
    };

    const tcos = (x: number): number => {
      let n = x % TWO_PI;
      if (n < 0) n += TWO_PI;
      return COS_TABLE[(n / TWO_PI * TABLE_SIZE) & (TABLE_SIZE - 1)];
    };

    const render = () => {
      if (!data) { animId = requestAnimationFrame(render); return; }

      const time = (Date.now() - startTime) * 0.001;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const ux = (2 * x - width) / height;
          const uy = (2 * y - height) / height;

          let a = 0;
          let d = 0;
          for (let i = 0; i < 4; i++) {
            a += tcos(i - d + time * 0.5 - a * ux);
            d += tsin(i * uy + a);
          }

          // Map wave value → vivid blue-purple palette
          const wv = (tsin(a) + tcos(d)) * 0.5; // −1 … 1
          const t = Math.max(0, Math.min(1, wv * 0.5 + 0.5));  // 0 … 1
          const t2 = t * t;

          // Accent: cyan shimmer layered on top
          const shimmer = Math.max(0, tsin(a * 1.5 + time * 0.8) * 0.5 + 0.2);

          // Dark navy (#04071a) → electric blue-purple (#3060e0) → cyan highlight
          const r = Math.floor(4  + t2 * 60  + shimmer * 40);
          const g = Math.floor(7  + t2 * 45  + shimmer * 60);
          const b = Math.floor(26 + t2 * 200 + shimmer * 80);

          const idx = (y * width + x) * 4;
          data[idx]     = r > 255 ? 255 : r;
          data[idx + 1] = g > 255 ? 255 : g;
          data[idx + 2] = b > 255 ? 255 : b;
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(new ImageData(data, width, height), 0, 0);
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: -1, imageRendering: 'auto' }}
    />
  );
};

export default HeroWave;
