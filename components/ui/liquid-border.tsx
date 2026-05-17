'use client';

import { useEffect, useRef } from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps any solid-background button with an animated liquid-metal border.
 * The 2px padding gap between the outer container and the button face
 * reveals the WebGL shader canvas as a shimmering border ring.
 * Falls back gracefully if WebGL is unavailable.
 */
export function LiquidBorder({ children, className = '' }: Props) {
  const shaderRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<{
    destroy?: () => void;
    setSpeed?: (speed: number) => void;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Inject canvas positioning style once per page
    if (!document.getElementById('lborder-style')) {
      const el = document.createElement('style');
      el.id = 'lborder-style';
      el.textContent =
        '.lborder-shader canvas{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;border-radius:inherit!important;display:block!important}';
      document.head.appendChild(el);
    }

    const init = async () => {
      try {
        const { ShaderMount, liquidMetalFragmentShader } = await import('@paper-design/shaders');
        if (cancelled || !shaderRef.current) return;
        mountRef.current = new ShaderMount(
          shaderRef.current,
          liquidMetalFragmentShader,
          {
            u_repetition: 4,
            u_softness: 0.5,
            u_shiftRed: 0.3,
            u_shiftBlue: 0.3,
            u_distortion: 0,
            u_contour: 0,
            u_angle: 45,
            u_scale: 8,
            u_shape: 1,
            u_offsetX: 0.1,
            u_offsetY: -0.1,
          },
          undefined,
          0.6,
        );
      } catch {
        // WebGL unavailable — button renders without border animation
      }
    };

    init();

    return () => {
      cancelled = true;
      mountRef.current?.destroy?.();
      mountRef.current = null;
    };
  }, []);

  return (
    <div
      className={`relative inline-flex rounded-full p-[2px] ${className}`}
      onMouseEnter={() => mountRef.current?.setSpeed?.(1.8)}
      onMouseLeave={() => mountRef.current?.setSpeed?.(0.6)}
    >
      {/* Shader canvas: fills container, visible only at the 2px edge gap */}
      <div
        ref={shaderRef}
        className="lborder-shader absolute inset-0 rounded-full overflow-hidden"
        aria-hidden
      />
      {/* Button sits on top, covering the shader except at the 2px edges */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
