import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { parseDurationSeconds } from '@/lib/playback';
import { AnalyticsClient } from '@/components/AnalyticsClient';

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') redirect('/');

  const now = new Date();
  const day1  = new Date(now.getTime() - 1  * 24 * 60 * 60 * 1000);
  const day7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [dauRows, wauRows, mauRows, totalUsers] = await Promise.all([
    prisma.userProgress.findMany({ where: { updatedAt: { gte: day1  } }, select: { userId: true }, distinct: ['userId'] }),
    prisma.userProgress.findMany({ where: { updatedAt: { gte: day7  } }, select: { userId: true }, distinct: ['userId'] }),
    prisma.userProgress.findMany({ where: { updatedAt: { gte: day30 } }, select: { userId: true }, distinct: ['userId'] }),
    prisma.user.count(),
  ]);

  const dailyRaw = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
    SELECT DATE("updatedAt") AS date, COUNT(DISTINCT "userId") AS count
    FROM "UserProgress"
    WHERE "updatedAt" >= ${day30}
    GROUP BY DATE("updatedAt")
    ORDER BY date ASC
  `;

  const topByListensRaw = await prisma.userProgress.groupBy({
    by: ['audiobookId'],
    _count: { audiobookId: true },
    orderBy: { _count: { audiobookId: 'desc' } },
    take: 10,
  });

  const bookIds = topByListensRaw.map(r => r.audiobookId);
  const books = await prisma.audiobook.findMany({
    where: { id: { in: bookIds } },
    select: { id: true, title: true, author: true },
  });
  const bookMap = Object.fromEntries(books.map(b => [b.id, b]));

  const topByListens = topByListensRaw.map(r => ({
    title:  bookMap[r.audiobookId]?.title  ?? r.audiobookId,
    author: bookMap[r.audiobookId]?.author ?? '',
    count:  r._count.audiobookId,
  }));

  const allProgress = await prisma.userProgress.findMany({
    include: { audiobook: { select: { id: true, title: true, author: true, duration: true } } },
  });

  const completionMap: Record<string, { title: string; author: string; count: number }> = {};
  for (const p of allProgress) {
    const total = parseDurationSeconds(p.audiobook.duration);
    if (total > 0 && p.seconds / total >= 0.95) {
      completionMap[p.audiobookId] ??= { title: p.audiobook.title, author: p.audiobook.author, count: 0 };
      completionMap[p.audiobookId].count++;
    }
  }
  const topByCompletion = Object.values(completionMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const [openedBookRows, played5minRows] = await Promise.all([
    prisma.userProgress.findMany({ select: { userId: true }, distinct: ['userId'] }),
    prisma.userProgress.findMany({ where: { seconds: { gte: 300 } }, select: { userId: true }, distinct: ['userId'] }),
  ]);

  return (
    <AnalyticsClient
      dau={dauRows.length}
      wau={wauRows.length}
      mau={mauRows.length}
      totalUsers={totalUsers}
      dailyData={dailyRaw.map(d => ({
        date: d.date instanceof Date
          ? d.date.toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' })
          : String(d.date).slice(5, 10),
        count: Number(d.count),
      }))}
      topByListens={topByListens}
      topByCompletion={topByCompletion}
      funnel={{
        registered: totalUsers,
        openedBook:  openedBookRows.length,
        played5min:  played5minRows.length,
      }}
    />
  );
}
