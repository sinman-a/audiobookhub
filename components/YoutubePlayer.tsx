'use client';

import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';
import { getProgress, saveProgress, syncToDb } from '@/lib/playback';

/* ── Minimal YouTube IFrame API types ── */
interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
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

// ── Wake Lock ────────────────────────────────────────────────────────────────
// Keeps the screen on while audio plays so Samsung/Android can't kill the tab.
// Auto-released by the browser when the screen locks; re-acquired on return.
let wakeLock: WakeLockSentinel | null = null;

const acquireWakeLock = async () => {
  if (!('wakeLock' in navigator) || wakeLock) return;
  try { wakeLock = await navigator.wakeLock.request('screen'); } catch { /* unsupported or denied */ }
};

const releaseWakeLock = () => {
  wakeLock?.release().catch(() => {});
  wakeLock = null;
};

// ── Silent AudioContext keep-alive ───────────────────────────────────────────
// Chrome marks a tab as "audio-producing" when its AudioContext has active output.
// This prevents Samsung's battery optimizer from killing the background tab.
let silentCtx: AudioContext | null = null;

const startSilentKeepAlive = () => {
  if (silentCtx) return;
  try {
    silentCtx = new AudioContext();
    const buf = silentCtx.createBuffer(1, silentCtx.sampleRate, silentCtx.sampleRate);
    const src = silentCtx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(silentCtx.destination);
    src.start();
  } catch { /* unsupported */ }
};

const stopSilentKeepAlive = () => {
  silentCtx?.close().catch(() => {});
  silentCtx = null;
};

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
  const wasPlayingRef = useRef(false);
  useEffect(() => { on80Ref.current = onReach80; });

  useEffect(() => {
    hasStartedRef.current = false;
    has25Ref.current = false;
    has50Ref.current = false;
    has75Ref.current = false;
    has80Ref.current = false;
    wasPlayingRef.current = false;
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

            if ('mediaSession' in navigator) {
              navigator.mediaSession.setActionHandler('play',  () => target.playVideo());
              navigator.mediaSession.setActionHandler('pause', () => target.pauseVideo());
              navigator.mediaSession.setActionHandler('seekbackward', (d) =>
                target.seekTo(Math.max(0, target.getCurrentTime() - (d.seekOffset ?? 30)), true));
              navigator.mediaSession.setActionHandler('seekforward', (d) =>
                target.seekTo(target.getCurrentTime() + (d.seekOffset ?? 30), true));
              navigator.mediaSession.setActionHandler('seekto', (d) => {
                if (d.seekTime != null) target.seekTo(d.seekTime, true);
              });
            }
          },
          onStateChange: ({ data, target }) => {
            if (data === 1 /* PLAYING */) {
              if (!hasStartedRef.current) {
                hasStartedRef.current = true;
                posthog.capture('play_started', { bookId, title: bookTitle });
              }

              wasPlayingRef.current = true;
              startSilentKeepAlive();
              acquireWakeLock();

              if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
                navigator.mediaSession.metadata = new MediaMetadata({
                  title: bookTitle,
                  artist: bookAuthor,
                  artwork: imageUrl ? [{ src: imageUrl, sizes: '512x512', type: 'image/jpeg' }] : [],
                });
              }

              clearInterval(intervalRef.current);
              intervalRef.current = setInterval(() => {
                const t = target.getCurrentTime();
                saveProgress({ bookId, bookTitle, bookAuthor, imageUrl, timestamp: t, savedAt: Date.now() });
                syncToDb(bookId, t);

                const dur = target.getDuration();
                if ('mediaSession' in navigator && dur > 0) {
                  try {
                    navigator.mediaSession.setPositionState({ duration: dur, playbackRate: 1, position: t });
                  } catch { /* setPositionState may throw if duration is Infinity */ }
                }

                if (!has25Ref.current || !has50Ref.current || !has75Ref.current || !has80Ref.current) {
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

              wasPlayingRef.current = false;
              stopSilentKeepAlive();
              releaseWakeLock();

              if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'paused';
              }

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

    const handleVisibility = () => {
      if (!document.hidden && wasPlayingRef.current) {
        acquireWakeLock();
        silentCtx?.resume().catch(() => {});
        playerRef.current?.playVideo();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      destroyed = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(intervalRef.current);
      const finalTime = playerRef.current?.getCurrentTime() ?? 0;
      if (finalTime > 5) syncToDb(bookId, finalTime);
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
      stopSilentKeepAlive();
      releaseWakeLock();

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
        (['play', 'pause', 'seekbackward', 'seekforward', 'seekto'] as MediaSessionAction[]).forEach((a) => {
          try { navigator.mediaSession.setActionHandler(a, null); } catch { /* ignore */ }
        });
      }
    };
  }, [youtubeId, bookId, bookTitle, bookAuthor, imageUrl]);

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-xl">
      <div ref={divRef} className="absolute inset-0" />
    </div>
  );
}
