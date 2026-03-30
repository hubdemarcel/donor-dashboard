import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  schemaReady: Promise<void> | null;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: [] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const DEMO_USER_ID = "user_vp_001";
const DEMO_USER_EMAIL = process.env.TEST_USER_EMAIL ?? "sarah@nine67.org";

async function initSchema(): Promise<void> {
  // 1. Create tables
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
      "id"         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "userId"     TEXT NOT NULL,
      "donor_id"   TEXT NOT NULL,
      "donor_name" TEXT NOT NULL,
      "segment"    TEXT NOT NULL,
      "gift_date"  TEXT NOT NULL,
      "gift_amount" REAL NOT NULL,
      "campaign"   TEXT NOT NULL,
      "channel"    TEXT NOT NULL,
      "region"     TEXT NOT NULL,
      "city"       TEXT NOT NULL DEFAULT '',
      CONSTRAINT "GiftRow_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);

  // 2. Upsert demo user
  await prisma.$executeRawUnsafe(
    `INSERT OR IGNORE INTO "User" ("id", "email", "name") VALUES (?, ?, ?)`,
    DEMO_USER_ID,
    DEMO_USER_EMAIL,
    "Sarah Mitchell"
  );

  // 3. Seed CSV if no rows exist for demo user
  const count = await prisma.$queryRaw<{ c: number }[]>`
    SELECT COUNT(*) as c FROM "GiftRow" WHERE "userId" = ${DEMO_USER_ID}
  `;
  const rowCount = Number((count as any)[0]?.c ?? 0);

  if (rowCount === 0) {
    const csvPath = path.join(process.cwd(), "data", "donor_gift_history.csv");
    if (fs.existsSync(csvPath)) {
      const lines = fs.readFileSync(csvPath, "utf-8").split("\n");
      const rows = lines.slice(1).filter(Boolean);
      for (const row of rows) {
        const [donor_id, donor_name, segment, gift_date, gift_amount, campaign, channel, region, city] =
          row.split(",");
        if (!donor_id) continue;
        await prisma.$executeRawUnsafe(
          `INSERT INTO "GiftRow" ("userId","donor_id","donor_name","segment","gift_date","gift_amount","campaign","channel","region","city")
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          DEMO_USER_ID,
          donor_id.trim(),
          donor_name.trim(),
          segment.trim(),
          gift_date.trim(),
          parseFloat(gift_amount) || 0,
          campaign.trim(),
          channel.trim(),
          region.trim(),
          (city ?? "").trim()
        );
      }
    }
  }
}

// One shared promise per serverless instance
globalForPrisma.schemaReady =
  globalForPrisma.schemaReady ?? initSchema();
export const schemaReady: Promise<void> = globalForPrisma.schemaReady;
