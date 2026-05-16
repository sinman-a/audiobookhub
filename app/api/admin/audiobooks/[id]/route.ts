import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { extractYoutubeId } from '@/lib/youtube';

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  imageUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  descriptionShort: z.string().min(1).optional(),
  descriptionLong: z.string().min(1).optional(),
  duration: z.string().optional(),
  genre: z.string().optional(),
  language: z.string().optional(),
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...data };

    if (data.youtubeUrl) {
      const youtubeId = extractYoutubeId(data.youtubeUrl);
      if (!youtubeId) return NextResponse.json({ error: 'invalid_youtube_url' }, { status: 400 });
      updateData.youtubeId = youtubeId;
      if (!data.imageUrl) {
        updateData.imageUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
      }
      delete updateData.youtubeUrl;
    }

    const book = await prisma.audiobook.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(book);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
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
