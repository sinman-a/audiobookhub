import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const categories = await prisma.category.findMany({
    include: { _count: { select: { subcategories: true } } },
    orderBy: { nameUk: 'asc' },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { nameUk, nameEn } = await req.json();
    if (!nameUk?.trim()) {
      return NextResponse.json({ error: 'Ukrainian name is required' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: { nameUk: nameUk.trim(), nameEn: (nameEn ?? '').trim() },
      include: { _count: { select: { subcategories: true } } },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
