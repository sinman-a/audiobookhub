import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const subcategories = await prisma.subcategory.findMany({
    include: {
      category: { select: { id: true, nameUk: true, nameEn: true } },
      _count: { select: { genres: true } },
    },
    orderBy: { nameUk: 'asc' },
  });
  return NextResponse.json(subcategories);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { nameUk, nameEn, categoryId } = await req.json();
    if (!nameUk?.trim()) {
      return NextResponse.json({ error: 'Ukrainian name is required' }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    const subcategory = await prisma.subcategory.create({
      data: {
        nameUk: nameUk.trim(),
        nameEn: (nameEn ?? '').trim(),
        categoryId,
      },
      include: {
        category: { select: { id: true, nameUk: true, nameEn: true } },
        _count: { select: { genres: true } },
      },
    });
    return NextResponse.json(subcategory, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Subcategory already exists in this category' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
