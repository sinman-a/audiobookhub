import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const audiobookId = req.nextUrl.searchParams.get('audiobookId');
  if (!audiobookId) return NextResponse.json({ error: 'Missing audiobookId' }, { status: 400 });

  const rating = await prisma.rating.findUnique({
    where: { userId_audiobookId: { userId: session.user.id, audiobookId } },
    select: { stars: true },
  });

  return NextResponse.json({ stars: rating?.stars ?? null });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { audiobookId, stars } = body ?? {};
  if (!audiobookId || typeof stars !== 'number' || stars < 1 || stars > 5) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  await prisma.rating.upsert({
    where: { userId_audiobookId: { userId: session.user.id, audiobookId } },
    create: { userId: session.user.id, audiobookId, stars },
    update: { stars },
  });

  return NextResponse.json({ ok: true });
}
