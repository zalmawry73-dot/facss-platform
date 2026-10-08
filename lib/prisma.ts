import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check if cached instance is missing newly added models
const cachedPrisma = globalForPrisma.prisma;
const isMissingNewModels = !cachedPrisma || !(cachedPrisma as any).contentBlock;

export const prisma = isMissingNewModels
  ? new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  : cachedPrisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
