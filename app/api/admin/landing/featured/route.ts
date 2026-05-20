import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { bookId, featured } = await req.json();
  if (!bookId || typeof featured !== 'boolean') {
    return NextResponse.json({ error: 'bookId and featured are required' }, { status: 400 });
  }

  const book = await prisma.audiobook.update({
    where: { id: bookId },
    data: { isFeatured: featured },
    select: { id: true, title: true, isFeatured: true },
  });

  return NextResponse.json(book);
}
