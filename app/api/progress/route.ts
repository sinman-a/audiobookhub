import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await prisma.userProgress.findMany({
    where: { userId: session.user.id },
    select: { audiobookId: true, seconds: true },
  });

  const map: Record<string, number> = {};
  for (const row of rows) map[row.audiobookId] = row.seconds;

  return NextResponse.json(map);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { audiobookId, seconds } = await req.json();
  if (!audiobookId || typeof seconds !== 'number') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  await prisma.userProgress.upsert({
    where: { userId_audiobookId: { userId: session.user.id, audiobookId } },
    update: { seconds },
    create: { userId: session.user.id, audiobookId, seconds },
  });

  return NextResponse.json({ ok: true });
}
