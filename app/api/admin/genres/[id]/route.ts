import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { nameUk, nameEn, subcategoryId } = await req.json();
    if (!nameUk?.trim()) {
      return NextResponse.json({ error: 'Ukrainian name is required' }, { status: 400 });
    }

    const genre = await prisma.genre.update({
      where: { id: params.id },
      data: {
        nameUk: nameUk.trim(),
        nameEn: (nameEn ?? '').trim(),
        subcategoryId: subcategoryId ?? null,
      },
      include: {
        subcategory: {
          select: {
            id: true,
            nameUk: true,
            nameEn: true,
            category: { select: { id: true, nameUk: true, nameEn: true } },
          },
        },
      },
    });
    return NextResponse.json(genre);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Genre already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.genre.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
