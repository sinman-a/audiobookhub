'use client';

import { useEffect, useRef } from 'react';
import { getProgress, saveProgress, syncToDb } from '@/lib/playback';

/* ── Minimal YouTube IFrame API types ── */
interface YTPlayer {
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        container: HTMLElement | string,
        config: {
          videoId: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface Props {
  youtubeId: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  imageUrl: string;
}

const SAVE_INTERVAL_MS = 10_000;

export function YoutubePlayer({ youtubeId, bookId, bookTitle, bookAuthor, imageUrl }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    let destroyed = false;

    const savedProgress = getProgress(bookId);
    const startAt = savedProgress && savedProgress.timestamp > 10 ? savedProgress.timestamp : 0;

    const initPlayer = () => {
      if (destroyed || !divRef.current || !window.YT?.Player) return;

      playerRef.current = new window.YT.Player(divRef.current, {
        videoId: youtubeId,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: 0, rel: 0, modestbranding: 1 },
        events: {
          onReady: ({ target }) => {
            if (startAt > 0) target.seekTo(startAt, true);
          },
          onStateChange: ({ data, target }) => {
            if (data === 1 /* PLAYING */) {
              clearInterval(intervalRef.current);
              intervalRef.current = setInterval(() => {
                const t = target.getCurrentTime();
                saveProgress({ bookId, bookTitle, bookAuthor, imageUrl, timestamp: t, savedAt: Date.now() });
                syncToDb(bookId, t);
              }, SAVE_INTERVAL_MS);
            } else {
              clearInterval(intervalRef.current);
              const t = target.getCurrentTime();
              if (t > 5) {
                saveProgress({ bookId, bookTitle, bookAuthor, imageUrl, timestamp: t, savedAt: Date.now() });
                syncToDb(bookId, t);
              }
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    }

    return () => {
      destroyed = true;
      clearInterval(intervalRef.current);
      const finalTime = playerRef.current?.getCurrentTime() ?? 0;
      if (finalTime > 5) syncToDb(bookId, finalTime);
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    };
  }, [youtubeId, bookId, bookTitle, bookAuthor, imageUrl]);

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-xl">
      <div ref={divRef} className="absolute inset-0" />
    </div>
  );
}
