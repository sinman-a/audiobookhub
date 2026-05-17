import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { extractYoutubeId } from '@/lib/youtube';

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
  isPublished: z.boolean().default(false),
  category: z.enum(['BOOK', 'MUSIC']).default('BOOK'),
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
        author: data.author || '',
        imageUrl: data.imageUrl || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        youtubeId,
        descriptionShort: data.descriptionShort || '',
        descriptionLong: data.descriptionLong || '',
        duration: data.duration || '',
        genre: data.genre || '',
        language: data.language || '',
        year: data.year ?? new Date().getFullYear(),
        isPublished: data.isPublished,
        category: data.category,
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
