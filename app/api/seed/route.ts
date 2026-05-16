import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-seed-secret');
  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@audiobook.dev' },
    update: {},
    create: {
      email: 'admin@audiobook.dev',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const booksCount = await prisma.audiobook.count();
  if (booksCount === 0) {
    await prisma.audiobook.createMany({
      data: [
        {
          title: 'Atomic Habits',
          author: 'James Clear',
          imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
          youtubeId: 'YVymm1fxHQI',
          descriptionShort: 'Revolutionary book about building good habits and breaking bad ones through small, incremental changes.',
          descriptionLong: 'Atomic Habits by James Clear is a comprehensive, practical guide on how to change your habits and get 1% better every day. Clear draws on the most proven ideas from biology, psychology, and neuroscience to create an easy-to-understand guide for making good habits inevitable and bad habits impossible.',
          duration: '5:35:00',
          genre: 'Non-fiction',
          language: 'EN',
          year: 2018,
          isPublished: true,
        },
        {
          title: 'Майстер і Маргарита',
          author: 'Михайло Булгаков',
          imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop',
          youtubeId: 'PUdFNgmN_Eo',
          descriptionShort: 'Роман-шедевр про добро і зло, кохання і зраду, свободу і відповідальність.',
          descriptionLong: 'Роман «Майстер і Маргарита» — один із найвидатніших творів світової літератури XX століття. Написаний Михайлом Булгаковим, він розповідає про таємничий візит диявола до радянської Москви, долю Майстра та його роману про Понтія Пілата, і безмежну силу кохання Маргарити.',
          duration: '12:20:00',
          genre: 'Classic',
          language: 'UA',
          year: 1967,
          isPublished: true,
        },
      ],
    });
  }

  return NextResponse.json({
    success: true,
    admin: admin.email,
    booksSeeded: booksCount === 0,
  });
}
