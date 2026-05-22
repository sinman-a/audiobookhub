const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

function apiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('YOUTUBE_API_KEY is not configured');
  return key;
}

// ── Input parsing ─────────────────────────────────────────────────────────────

export type YoutubeInputType = 'video' | 'playlist' | 'channel';

export interface ParsedYoutubeInput {
  type: YoutubeInputType;
  id: string;
}

export function parseYouTubeInput(raw: string): ParsedYoutubeInput | null {
  const url = raw.trim();

  // Video: youtu.be/<id>, /watch?v=<id>, /embed/<id>, /shorts/<id>
  const videoMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|v\/))([a-zA-Z0-9_-]{11})/
  );
  if (videoMatch) return { type: 'video', id: videoMatch[1] };

  // Playlist: ?list=<id>
  const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch) return { type: 'playlist', id: playlistMatch[1] };

  // Channel: /channel/UC<id>
  const channelIdMatch = url.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/);
  if (channelIdMatch) return { type: 'channel', id: channelIdMatch[1] };

  // @handle, /c/<name>, /user/<name> — id is the handle, needs resolveChannelId()
  const handleMatch = url.match(/youtube\.com\/(?:@|c\/|user\/)([a-zA-Z0-9_.-]+)/);
  if (handleMatch) return { type: 'channel', id: handleMatch[1] };

  return null;
}

// ── Duration helpers ──────────────────────────────────────────────────────────

export function parseISO8601Duration(str: string): number {
  const match = str.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] ?? '0') * 60) + parseInt(match[2] ?? '0') + Math.round(parseInt(match[3] ?? '0') / 60);
}

export function formatDurationString(str: string): string {
  const match = str.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = parseInt(match[1] ?? '0');
  const m = parseInt(match[2] ?? '0');
  const s = parseInt(match[3] ?? '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── Chapter parsing ───────────────────────────────────────────────────────────

export interface Chapter {
  time: number;
  title: string;
}

export function parseChapters(description: string): Chapter[] {
  const regex = /^((?:\d{1,2}:)?\d{1,2}:\d{2})[ \t]+(.+)/gm;
  const chapters: Chapter[] = [];
  let match;
  while ((match = regex.exec(description)) !== null) {
    const timeStr = match[1];
    const title = match[2].trim();
    if (!title) continue;
    const parts = timeStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
    chapters.push({ time: seconds, title });
  }
  return chapters;
}

// ── YouTube API response types ────────────────────────────────────────────────

interface YTVideosResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      channelId: string;
      channelTitle: string;
      publishedAt: string;
      thumbnails: {
        maxres?: { url: string };
        high?: { url: string };
        medium?: { url: string };
        default?: { url: string };
      };
    };
    contentDetails?: { duration: string };
    status?: { privacyStatus: string; uploadStatus?: string };
  }>;
}

interface YTPlaylistItemsResponse {
  items: Array<{ contentDetails?: { videoId: string } }>;
  nextPageToken?: string;
}

interface YTChannelsResponse {
  items: Array<{
    id: string;
    contentDetails?: { relatedPlaylists?: { uploads: string } };
  }>;
}

interface YTSearchResponse {
  items: Array<{ snippet?: { channelId: string } }>;
}

// ── Video details ─────────────────────────────────────────────────────────────

export interface VideoDetails {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationIso: string;
  durationFormatted: string;
  durationMinutes: number;
  publishedAt: string;
  available: boolean;
}

export async function fetchVideoDetails(videoIds: string[]): Promise<VideoDetails[]> {
  if (videoIds.length === 0) return [];

  const results: VideoDetails[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const params = new URLSearchParams({
      part: 'snippet,contentDetails,status',
      id: chunk.join(','),
      key: apiKey(),
    });
    const res = await fetch(`${YT_API_BASE}/videos?${params}`);
    if (!res.ok) {
      const body = await res.text();
      if (res.status === 403) throw new Error('YouTube API quota exceeded');
      throw new Error(`YouTube API error: ${res.status} ${body}`);
    }
    const data = await res.json() as YTVideosResponse;
    const returnedIds = new Set(data.items.map(i => i.id));

    for (const id of chunk) {
      if (!returnedIds.has(id)) {
        results.push({
          id, title: '', description: '', channelId: '', channelTitle: '',
          thumbnailUrl: '', durationIso: '', durationFormatted: '',
          durationMinutes: 0, publishedAt: '', available: false,
        });
      }
    }

    for (const item of data.items) {
      const snip = item.snippet;
      const dur = item.contentDetails?.duration ?? '';
      const thumb = snip.thumbnails;
      results.push({
        id: item.id,
        title: snip.title,
        description: snip.description,
        channelId: snip.channelId,
        channelTitle: snip.channelTitle,
        thumbnailUrl:
          thumb.maxres?.url ?? thumb.high?.url ?? thumb.medium?.url ??
          `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
        durationIso: dur,
        durationFormatted: formatDurationString(dur),
        durationMinutes: parseISO8601Duration(dur),
        publishedAt: snip.publishedAt,
        available: item.status?.privacyStatus === 'public',
      });
    }
  }
  return results;
}

// ── Playlist items ────────────────────────────────────────────────────────────

export async function fetchPlaylistItems(playlistId: string, maxItems = 500): Promise<string[]> {
  const videoIds: string[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      part: 'contentDetails',
      playlistId,
      maxResults: '50',
      key: apiKey(),
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`${YT_API_BASE}/playlistItems?${params}`);
    if (!res.ok) {
      const body = await res.text();
      if (res.status === 403) throw new Error('YouTube API quota exceeded');
      if (res.status === 404) throw new Error('Playlist not found or is private');
      throw new Error(`YouTube API error: ${res.status} ${body}`);
    }
    const data = await res.json() as YTPlaylistItemsResponse;
    for (const item of data.items) {
      if (item.contentDetails?.videoId) videoIds.push(item.contentDetails.videoId);
      if (videoIds.length >= maxItems) break;
    }
    pageToken = videoIds.length < maxItems ? data.nextPageToken : undefined;
  } while (pageToken);

  return videoIds;
}

// ── Channel uploads playlist ──────────────────────────────────────────────────

export async function fetchChannelUploadsPlaylistId(channelId: string): Promise<string | null> {
  const params = new URLSearchParams({
    part: 'contentDetails',
    id: channelId,
    key: apiKey(),
  });
  const res = await fetch(`${YT_API_BASE}/channels?${params}`);
  if (!res.ok) {
    if (res.status === 403) throw new Error('YouTube API quota exceeded');
    throw new Error(`YouTube channels API error: ${res.status}`);
  }
  const data = await res.json() as YTChannelsResponse;
  return data.items[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
}

// ── Resolve @handle / /c/ / /user/ → channel ID ──────────────────────────────

export async function resolveChannelId(handleOrName: string): Promise<string | null> {
  const handle = handleOrName.startsWith('@') ? handleOrName.slice(1) : handleOrName;

  const params = new URLSearchParams({ part: 'id', forHandle: handle, key: apiKey() });
  const res = await fetch(`${YT_API_BASE}/channels?${params}`);
  if (res.ok) {
    const data = await res.json() as YTChannelsResponse;
    if (data.items?.[0]?.id) return data.items[0].id;
  }

  // Fallback: search
  const searchParams = new URLSearchParams({
    part: 'snippet', q: handleOrName, type: 'channel', maxResults: '1', key: apiKey(),
  });
  const searchRes = await fetch(`${YT_API_BASE}/search?${searchParams}`);
  if (!searchRes.ok) return null;
  const searchData = await searchRes.json() as YTSearchResponse;
  return searchData.items?.[0]?.snippet?.channelId ?? null;
}
