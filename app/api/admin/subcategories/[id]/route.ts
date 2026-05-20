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
    const { nameUk, nameEn, categoryId } = await req.json();
    const data: Record<string, unknown> = {};
    if (nameUk !== undefined) data.nameUk = nameUk.trim();
    if (nameEn !== undefined) data.nameEn = nameEn.trim();
    if (categoryId !== undefined) data.categoryId = categoryId;

    const subcategory = await prisma.subcategory.update({
      where: { id: params.id },
      data,
      include: {
        category: { select: { id: true, nameUk: true, nameEn: true } },
        _count: { select: { genres: true } },
      },
    });
    return NextResponse.json(subcategory);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Subcategory already exists in this category' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await prisma.subcategory.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
