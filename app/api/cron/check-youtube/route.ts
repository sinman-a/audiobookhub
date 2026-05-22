import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchVideoDetails } from '@/lib/youtube-api';
import { Resend } from 'resend';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 23 * 60 * 60 * 1000);

  const books = await prisma.audiobook.findMany({
    where: {
      status: { in: ['Published', 'Review'] },
      youtubeId: { not: null },
      OR: [
        { lastCheckedAt: null },
        { lastCheckedAt: { lt: cutoff } },
      ],
    },
    select: { id: true, youtubeId: true, title: true },
    take: 500,
  });

  if (books.length === 0) {
    return NextResponse.json({ checked: 0, markedUnavailable: 0 });
  }

  const videoIds = books.map(b => b.youtubeId!);
  const videoDetails = await fetchVideoDetails(videoIds);
  const detailsMap = new Map(videoDetails.map(v => [v.id, v]));

  const nowDate = new Date();
  const unavailableTitles: string[] = [];

  for (const book of books) {
    const detail = detailsMap.get(book.youtubeId!);
    const isAvailable = detail?.available ?? false;

    await prisma.audiobook.update({
      where: { id: book.id },
      data: {
        lastCheckedAt: nowDate,
        ...(isAvailable ? {} : { status: 'Unavailable' }),
      },
    });

    if (!isAvailable) {
      unavailableTitles.push(book.title);
      prisma.ingestionLog.create({
        data: {
          id: crypto.randomUUID(),
          videoId: book.youtubeId!,
          bookId: book.id,
          action: 'unavailable',
          message: 'Marked unavailable by daily cron check',
        },
      }).catch(console.error);
    }
  }

  if (unavailableTitles.length > 0 && process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@audiobookhub.vercel.app',
      to: process.env.ADMIN_EMAIL,
      subject: `[AudioBook Hub] ${unavailableTitles.length} book(s) became unavailable`,
      text: `The following books were marked Unavailable:\n\n${unavailableTitles.map(t => `• ${t}`).join('\n')}\n\nCheck admin panel: https://audiobookhub.vercel.app/uk/admin`,
    });
  }

  return NextResponse.json({
    checked: books.length,
    markedUnavailable: unavailableTitles.length,
  });
}
