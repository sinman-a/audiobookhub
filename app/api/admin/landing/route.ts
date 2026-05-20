import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [featuredBooks, allBooks, configs] = await Promise.all([
    prisma.audiobook.findMany({
      where: { isFeatured: true },
      select: { id: true, title: true, author: true, imageUrl: true, isPublished: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.audiobook.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, author: true },
      orderBy: { title: 'asc' },
    }),
    prisma.landingConfig.findMany(),
  ]);

  const configMap = Object.fromEntries(configs.map((c) => [c.locale, c.content]));

  return NextResponse.json({
    featuredBooks,
    allBooks,
    configs: { uk: configMap['uk'] ?? null, en: configMap['en'] ?? null },
  });
}
