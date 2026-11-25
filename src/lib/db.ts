import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const runtimeUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
export const db = globalForPrisma.prisma ?? new PrismaClient(
  runtimeUrl ? { datasources: { db: { url: runtimeUrl } } } : undefined,
);
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
