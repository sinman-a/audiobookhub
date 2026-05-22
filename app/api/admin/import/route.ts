import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  parseYouTubeInput,
  fetchVideoDetails,
  fetchPlaylistItems,
  fetchChannelUploadsPlaylistId,
  resolveChannelId,
  parseChapters,
} from '@/lib/youtube-api';

const importSchema = z.object({
  url: z.string().url('Invalid URL'),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { url: string };
  try {
    body = importSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = parseYouTubeInput(body.url);
  if (!parsed) {
    return NextResponse.json({ error: 'Cannot parse YouTube URL' }, { status: 400 });
  }

  let videoIds: string[] = [];
  try {
    if (parsed.type === 'video') {
      videoIds = [parsed.id];
    } else if (parsed.type === 'playlist') {
      videoIds = await fetchPlaylistItems(parsed.id, 500);
    } else {
      let channelId = parsed.id;
      if (!channelId.startsWith('UC')) {
        const resolved = await resolveChannelId(channelId);
        if (!resolved) {
          return NextResponse.json({ error: 'Cannot resolve YouTube channel' }, { status: 400 });
        }
        channelId = resolved;
      }
      const uploadsPlaylistId = await fetchChannelUploadsPlaylistId(channelId);
      if (!uploadsPlaylistId) {
        return NextResponse.json({ error: 'Channel has no uploads playlist' }, { status: 400 });
      }
      videoIds = await fetchPlaylistItems(uploadsPlaylistId, 200);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'YouTube API error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  if (videoIds.length === 0) {
    return NextResponse.json({ error: 'No videos found at that URL' }, { status: 400 });
  }

  let videos;
  try {
    videos = await fetchVideoDetails(videoIds);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'YouTube API error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const existingBooks = await prisma.audiobook.findMany({
    where: { youtubeId: { in: videoIds } },
    select: { youtubeId: true },
  });
  const existingSet = new Set(existingBooks.map(b => b.youtubeId).filter(Boolean));

  const imported: string[] = [];
  const skipped: string[] = [];
  const errors: Array<{ id: string; message: string }> = [];
  const logs: Array<{
    id: string; videoId: string; bookId?: string | null;
    action: string; message?: string | null;
  }> = [];

  for (const video of videos) {
    if (!video.available) {
      skipped.push(video.id);
      logs.push({ id: crypto.randomUUID(), videoId: video.id, action: 'unavailable', message: 'Video not available' });
      continue;
    }
    if (existingSet.has(video.id)) {
      skipped.push(video.id);
      logs.push({ id: crypto.randomUUID(), videoId: video.id, action: 'skipped_duplicate', message: 'Already exists' });
      continue;
    }

    try {
      const chapters = parseChapters(video.description);
      const book = await prisma.audiobook.create({
        data: {
          title: video.title || 'Untitled',
          author: video.channelTitle || '',
          imageUrl: video.thumbnailUrl,
          youtubeId: video.id,
          descriptionShort: video.description.slice(0, 300),
          descriptionLong: video.description,
          duration: video.durationFormatted,
          genre: '',
          language: 'UA',
          year: new Date(video.publishedAt || Date.now()).getFullYear(),
          status: 'Draft',
          channelId: video.channelId,
          sourceUrl: `https://www.youtube.com/watch?v=${video.id}`,
          chapters: chapters.length > 0 ? JSON.parse(JSON.stringify(chapters)) : undefined,
        },
      });
      imported.push(book.id);
      logs.push({ id: crypto.randomUUID(), videoId: video.id, bookId: book.id, action: 'imported' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'DB error';
      errors.push({ id: video.id, message: msg });
      logs.push({ id: crypto.randomUUID(), videoId: video.id, action: 'error', message: msg });
    }
  }

  prisma.ingestionLog.createMany({ data: logs }).catch(console.error);

  return NextResponse.json({ imported: imported.length, skipped: skipped.length, errors });
}
