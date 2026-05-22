import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@audiobook.dev' },
    update: {},
    create: {
      email: 'admin@audiobook.dev',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created: admin@audiobook.dev / admin123');

  await prisma.audiobook.deleteMany({});

  await prisma.audiobook.createMany({
    data: [
      {
        title: 'Atomic Habits',
        author: 'James Clear',
        imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
        youtubeId: 'YVymm1fxHQI',
        descriptionShort:
          'Revolutionary book about building good habits and breaking bad ones through small, incremental changes.',
        descriptionLong:
          'Atomic Habits by James Clear is a comprehensive, practical guide on how to change your habits and get 1% better every day. Clear draws on the most proven ideas from biology, psychology, and neuroscience to create an easy-to-understand guide for making good habits inevitable and bad habits impossible. Along the way, readers will be inspired and entertained with true stories from Olympic gold medalists, award-winning artists, business leaders, life-saving physicians, and star comedians who have used the science of small habits to master their craft and vault to the top of their field.',
        duration: '5:35:00',
        genre: 'Non-fiction',
        language: 'EN',
        year: 2018,
        status: 'Published',
      },
      {
        title: 'Майстер і Маргарита',
        author: 'Михайло Булгаков',
        imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop',
        youtubeId: 'dQw4w9WgXcQ',
        descriptionShort:
          'Роман-шедевр про добро і зло, кохання і зраду, свободу і відповідальність.',
        descriptionLong:
          'Роман "Майстер і Маргарита" — один із найвидатніших творів світової літератури XX століття. Написаний Михайлом Булгаковим, він розповідає про таємничий візит диявола до радянської Москви, долю Майстра та його роману про Понтія Пілата, і безмежну силу кохання Маргарити. Твір сповнений гострої сатири, філософських роздумів та магічного реалізму. Булгаков написав цей роман у важкі часи і зашифрував у ньому свої думки про природу влади, творчості та духовної свободи.',
        duration: '12:20:00',
        genre: 'Classic',
        language: 'UA',
        year: 1967,
        status: 'Published',
      },
    ],
  });

  console.log('✅ Demo audiobooks created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
