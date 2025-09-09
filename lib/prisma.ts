import { PrismaClient } from "@prisma/client";

// evita più istanze in dev (HMR)
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["warn", "error"], // togli o aggiungi "query" se vuoi vedere le query
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
