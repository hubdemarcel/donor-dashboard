import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  schemaReady: Promise<void> | null;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: [] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Ensures the SQLite schema exists. Runs once per serverless instance.
 * Required on Vercel where /tmp is empty on cold start.
 */
async function initSchema(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1 FROM "GiftRow" LIMIT 1`;
  } catch {
    // Schema missing — create tables directly
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id"    TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL,
        "name"  TEXT
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GiftRow" (
        "id"          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "userId"      TEXT    NOT NULL,
        "donor_id"    TEXT    NOT NULL,
        "donor_name"  TEXT    NOT NULL,
        "segment"     TEXT    NOT NULL,
        "gift_date"   TEXT    NOT NULL,
        "gift_amount" REAL    NOT NULL,
        "campaign"    TEXT    NOT NULL,
        "channel"     TEXT    NOT NULL,
        "region"      TEXT    NOT NULL,
        "city"        TEXT    NOT NULL DEFAULT '',
        CONSTRAINT "GiftRow_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
  }
}

// One shared promise per serverless instance — never runs twice
globalForPrisma.schemaReady =
  globalForPrisma.schemaReady ?? initSchema();

export const schemaReady: Promise<void> = globalForPrisma.schemaReady;
