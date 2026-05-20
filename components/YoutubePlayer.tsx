'use client';

import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';
import { getProgress, saveProgress, syncToDb } from '@/lib/playback';

/* ── Minimal YouTube IFrame API types ── */
interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
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
  onReach80?: () => void;
}

const SAVE_INTERVAL_MS = 10_000;

export function YoutubePlayer({ youtubeId, bookId, bookTitle, bookAuthor, imageUrl, onReach80 }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const hasStartedRef = useRef(false);
  const has25Ref = useRef(false);
  const has50Ref = useRef(false);
  const has75Ref = useRef(false);
  const has80Ref = useRef(false);
  const on80Ref = useRef(onReach80);
  useEffect(() => { on80Ref.current = onReach80; });

  useEffect(() => {
    hasStartedRef.current = false;
    has25Ref.current = false;
    has50Ref.current = false;
    has75Ref.current = false;
    has80Ref.current = false;
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
              if (!hasStartedRef.current) {
                hasStartedRef.current = true;
                posthog.capture('play_started', { bookId, title: bookTitle });
              }
              clearInterval(intervalRef.current);
              intervalRef.current = setInterval(() => {
                const t = target.getCurrentTime();
                saveProgress({ bookId, bookTitle, bookAuthor, imageUrl, timestamp: t, savedAt: Date.now() });
                syncToDb(bookId, t);
                if (!has25Ref.current || !has50Ref.current || !has75Ref.current || !has80Ref.current) {
                  const dur = target.getDuration();
                  if (dur > 0) {
                    const pct = t / dur;
                    if (!has25Ref.current && pct >= 0.25) {
                      has25Ref.current = true;
                      posthog.capture('play_25_percent', { bookId, title: bookTitle });
                    }
                    if (!has50Ref.current && pct >= 0.50) {
                      has50Ref.current = true;
                      posthog.capture('play_50_percent', { bookId, title: bookTitle });
                    }
                    if (!has75Ref.current && pct >= 0.75) {
                      has75Ref.current = true;
                      posthog.capture('play_75_percent', { bookId, title: bookTitle });
                    }
                    if (!has80Ref.current && pct >= 0.80) {
                      has80Ref.current = true;
                      on80Ref.current?.();
                    }
                  }
                }
              }, SAVE_INTERVAL_MS);
            } else {
              clearInterval(intervalRef.current);
              const t = target.getCurrentTime();
              if (data === 0 /* ENDED */) {
                posthog.capture('play_finished', { bookId, title: bookTitle });
              }
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
