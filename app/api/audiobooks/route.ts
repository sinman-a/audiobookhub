import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const books = await prisma.audiobook.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    include: {
      category:    { select: { id: true, nameUk: true, nameEn: true } },
      subcategory: { select: { id: true, nameUk: true, nameEn: true } },
    },
  });

  return NextResponse.json(books);
}
