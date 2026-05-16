import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { extractYoutubeId } from '@/lib/youtube';

const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  imageUrl: z.string().url().optional().or(z.literal('')),
  youtubeUrl: z.string().min(1),
  descriptionShort: z.string().min(1),
  descriptionLong: z.string().min(1),
  duration: z.string().optional().or(z.literal('')),
  genre: z.string().min(1),
  language: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  isPublished: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const books = await prisma.audiobook.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(books);
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
        author: data.author,
        imageUrl: data.imageUrl || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        youtubeId,
        descriptionShort: data.descriptionShort,
        descriptionLong: data.descriptionLong,
        duration: data.duration || '',
        genre: data.genre,
        language: data.language,
        year: data.year,
        isPublished: data.isPublished,
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
