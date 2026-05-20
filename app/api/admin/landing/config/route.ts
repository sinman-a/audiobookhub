import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { locale, content } = await req.json();
  if (!locale || !content || typeof content !== 'object') {
    return NextResponse.json({ error: 'locale and content are required' }, { status: 400 });
  }
  if (locale !== 'uk' && locale !== 'en') {
    return NextResponse.json({ error: 'locale must be uk or en' }, { status: 400 });
  }

  const config = await prisma.landingConfig.upsert({
    where: { locale },
    create: { locale, content },
    update: { content },
  });

  return NextResponse.json(config);
}
