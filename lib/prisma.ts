import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function buildUrl(base?: string) {
  if (!base) return base;
  return base.includes('connect_timeout') ? base : `${base}&connect_timeout=15`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
    datasources: { db: { url: buildUrl(process.env.POSTGRES_PRISMA_URL) } },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
