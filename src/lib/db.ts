// NOTE: Prisma 7 requires a driver adapter (e.g. @prisma/adapter-pg).
// This file will be updated in Phase 3 when database queries are needed.
// Install: npm install @prisma/adapter-pg pg && npm install -D @types/pg
// See: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/driver-adapters
import { PrismaClient } from '../generated/prisma/client'

const globalForPrisma = globalThis as unknown as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any | undefined
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: PrismaClient = globalForPrisma.prisma ?? (new (PrismaClient as any)({}))

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
