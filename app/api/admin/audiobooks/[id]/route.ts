import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { extractYoutubeId } from '@/lib/youtube';

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().optional().or(z.literal('')),
  imageUrl: z.string().optional().or(z.literal('')),
  youtubeUrl: z.string().optional().or(z.literal('')),
  descriptionShort: z.string().optional().or(z.literal('')),
  descriptionLong: z.string().optional().or(z.literal('')),
  duration: z.string().optional().or(z.literal('')),
  genre: z.string().optional().or(z.literal('')),
  language: z.string().optional().or(z.literal('')),
  year: z.number().int().min(1900).max(2100).optional(),
  isPublished: z.boolean().optional(),
});

async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return null;
  return session;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    // Build update object with only valid Prisma Audiobook fields
    const prismaData: Record<string, unknown> = {};

    if (data.title !== undefined) prismaData.title = data.title;
    if (data.author !== undefined) prismaData.author = data.author;
    if (data.descriptionShort !== undefined) prismaData.descriptionShort = data.descriptionShort;
    if (data.descriptionLong !== undefined) prismaData.descriptionLong = data.descriptionLong;
    if (data.duration !== undefined) prismaData.duration = data.duration;
    if (data.genre !== undefined) prismaData.genre = data.genre;
    if (data.language !== undefined) prismaData.language = data.language;
    if (data.year !== undefined) prismaData.year = data.year;
    if (data.isPublished !== undefined) prismaData.isPublished = data.isPublished;

    if (data.youtubeUrl) {
      const youtubeId = extractYoutubeId(data.youtubeUrl);
      if (!youtubeId) return NextResponse.json({ error: 'invalid_youtube_url' }, { status: 400 });
      prismaData.youtubeId = youtubeId;
      prismaData.imageUrl = data.imageUrl || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    } else if (data.imageUrl !== undefined) {
      prismaData.imageUrl = data.imageUrl;
    }

    const book = await prisma.audiobook.update({
      where: { id: params.id },
      data: prismaData,
    });

    return NextResponse.json(book);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error('[PUT audiobook]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.audiobook.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
