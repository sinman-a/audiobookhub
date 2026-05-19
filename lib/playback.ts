export interface PlaybackProgress {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  imageUrl: string;
  timestamp: number; // seconds
  savedAt: number;   // Date.now()
}

const key = (id: string) => `abh_progress_${id}`;
const RECENT_KEY = 'abh_recent_book';

export function saveProgress(p: PlaybackProgress): void {
  try {
    localStorage.setItem(key(p.bookId), JSON.stringify(p));
    localStorage.setItem(RECENT_KEY, p.bookId);
  } catch {}
}

export function getProgress(bookId: string): PlaybackProgress | null {
  try {
    const raw = localStorage.getItem(key(bookId));
    return raw ? (JSON.parse(raw) as PlaybackProgress) : null;
  } catch {
    return null;
  }
}

export function getRecentProgress(): PlaybackProgress | null {
  try {
    const id = localStorage.getItem(RECENT_KEY);
    return id ? getProgress(id) : null;
  } catch {
    return null;
  }
}

export function parseDurationSeconds(duration: string): number {
  if (!duration) return 0;
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

export function syncToDb(audiobookId: string, seconds: number): void {
  fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audiobookId, seconds }),
  }).catch(() => {});
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
