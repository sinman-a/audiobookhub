import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { extractYoutubeId } from '@/lib/youtube';
import { parseDurationSeconds } from '@/lib/playback';

const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().optional().or(z.literal('')),
  imageUrl: z.string().optional().or(z.literal('')),
  youtubeUrl: z.string().min(1),
  descriptionShort: z.string().optional().or(z.literal('')),
  descriptionLong: z.string().optional().or(z.literal('')),
  duration: z.string().optional().or(z.literal('')),
  genre: z.string().optional().or(z.literal('')),
  language: z.string().optional().or(z.literal('')),
  year: z.number().int().min(1900).max(2100).optional().default(new Date().getFullYear()),
  status: z.enum(['Draft', 'Review', 'Published', 'Unavailable']).default('Draft'),
  categoryId: z.string().optional().or(z.literal('')),
  subcategoryId: z.string().optional().or(z.literal('')),
  rightsHolder: z.string().optional().or(z.literal('')),
  permissionStatus: z.enum(['unknown', 'allowed', 'pending', 'denied']).default('unknown'),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [books, progressStats] = await Promise.all([
    prisma.audiobook.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category:    { select: { nameUk: true, nameEn: true } },
        subcategory: { select: { nameUk: true, nameEn: true } },
      },
    }),
    prisma.userProgress.groupBy({
      by: ['audiobookId'],
      _count: { audiobookId: true },
      _avg: { seconds: true },
    }),
  ]);
  const statsMap = Object.fromEntries(progressStats.map(s => [s.audiobookId, s]));
  const result = books.map(book => {
    const stat = statsMap[book.id];
    const totalSec = parseDurationSeconds(book.duration);
    const avgCompletion = stat && totalSec > 0
      ? Math.round(((stat._avg.seconds ?? 0) / totalSec) * 100)
      : 0;
    return { ...book, views: stat?._count.audiobookId ?? 0, avgCompletion };
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = bookSchema.parse(body);

    const youtubeId = extractYoutubeId(data.youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json({ error: 'invalid_youtube_url' }, { status: 400 });
    }

    const book = await prisma.audiobook.create({
      data: {
        title: data.title,
        author: data.author || '',
        imageUrl: data.imageUrl || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        youtubeId,
        descriptionShort: data.descriptionShort || '',
        descriptionLong: data.descriptionLong || '',
        duration: data.duration || '',
        genre: data.genre || '',
        language: data.language || '',
        year: data.year ?? new Date().getFullYear(),
        status: data.status,
        categoryId: data.categoryId || null,
        subcategoryId: data.subcategoryId || null,
        rightsHolder: data.rightsHolder || null,
        permissionStatus: data.permissionStatus,
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
