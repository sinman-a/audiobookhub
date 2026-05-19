import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseDurationSeconds } from '@/lib/playback';

const BOOK_SELECT = {
  id: true,
  title: true,
  author: true,
  imageUrl: true,
  duration: true,
  genre: true,
  descriptionShort: true,
  language: true,
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [libraryRows, progressRows] = await Promise.all([
    prisma.userLibrary.findMany({
      where: { userId: session.user.id },
      include: { audiobook: { select: BOOK_SELECT } },
      orderBy: { addedAt: 'desc' },
    }),
    prisma.userProgress.findMany({
      where: { userId: session.user.id },
      include: { audiobook: { select: BOOK_SELECT } },
    }),
  ]);

  const favorites = libraryRows.map((r) => r.audiobook);

  const in_progress: typeof favorites = [];
  const finished: typeof favorites & { progressSeconds?: number }[] = [];

  for (const p of progressRows) {
    const total = parseDurationSeconds(p.audiobook.duration);
    if (total === 0) continue;
    const pct = p.seconds / total;
    const book = { ...p.audiobook, progressSeconds: p.seconds };
    if (pct >= 0.95) {
      finished.push(book);
    } else if (pct >= 0.05) {
      in_progress.push(book);
    }
  }

  return NextResponse.json({ favorites, in_progress, finished });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { audiobookId } = await req.json();
  if (!audiobookId) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  await prisma.userLibrary.upsert({
    where: { userId_audiobookId: { userId: session.user.id, audiobookId } },
    update: {},
    create: { userId: session.user.id, audiobookId },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { audiobookId } = await req.json();
  if (!audiobookId) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  await prisma.userLibrary.deleteMany({
    where: { userId: session.user.id, audiobookId },
  });

  return NextResponse.json({ ok: true });
}
