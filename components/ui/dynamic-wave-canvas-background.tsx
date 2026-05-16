'use client';

import React, { useEffect, useRef } from 'react';

const HeroWave = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SCALE = 2;
    let animId: number;

    // Separate offscreen canvas to avoid drawing canvas to itself (undefined behavior)
    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d')!;
    let imageData: ImageData;
    let data: Uint8ClampedArray;
    let width = 0;
    let height = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      width = Math.floor(canvas.width / SCALE);
      height = Math.floor(canvas.height / SCALE);
      offscreen.width = width;
      offscreen.height = height;
      imageData = offCtx.createImageData(width, height);
      data = imageData.data;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const startTime = Date.now();

    const TABLE_SIZE = 1024;
    const SIN_TABLE = new Float32Array(TABLE_SIZE);
    const COS_TABLE = new Float32Array(TABLE_SIZE);
    for (let i = 0; i < TABLE_SIZE; i++) {
      const angle = (i / TABLE_SIZE) * Math.PI * 2;
      SIN_TABLE[i] = Math.sin(angle);
      COS_TABLE[i] = Math.cos(angle);
    }
    const TWO_PI = Math.PI * 2;

    const fastSin = (x: number): number => {
      let n = x % TWO_PI;
      if (n < 0) n += TWO_PI;
      return SIN_TABLE[(n / TWO_PI * TABLE_SIZE) & (TABLE_SIZE - 1)];
    };

    const fastCos = (x: number): number => {
      let n = x % TWO_PI;
      if (n < 0) n += TWO_PI;
      return COS_TABLE[(n / TWO_PI * TABLE_SIZE) & (TABLE_SIZE - 1)];
    };

    const render = () => {
      const time = (Date.now() - startTime) * 0.001;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const ux = (2 * x - width) / height;
          const uy = (2 * y - height) / height;

          let a = 0;
          let d = 0;
          for (let i = 0; i < 4; i++) {
            a += fastCos(i - d + time * 0.5 - a * ux);
            d += fastSin(i * uy + a);
          }

          const wave = (fastSin(a) + fastCos(d)) * 0.5;
          const intensity = 0.3 + 0.4 * wave;
          const baseVal = 0.1 + 0.15 * fastCos(ux + uy + time * 0.3);
          const blueAccent = 0.2 * fastSin(a * 1.5 + time * 0.2);
          const purpleAccent = 0.15 * fastCos(d * 2 + time * 0.1);

          const r = Math.max(0, Math.min(1, baseVal + purpleAccent * 0.8)) * intensity;
          const g = Math.max(0, Math.min(1, baseVal + blueAccent * 0.6)) * intensity;
          const b = Math.max(0, Math.min(1, baseVal + blueAccent * 1.2 + purpleAccent * 0.4)) * intensity;

          const idx = (y * width + x) * 4;
          data[idx]     = r * 255;
          data[idx + 1] = g * 255;
          data[idx + 2] = b * 255;
          data[idx + 3] = 255;
        }
      }

      offCtx.putImageData(imageData, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);

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
      style={{ zIndex: -1 }}
    />
  );
};

export default HeroWave;
