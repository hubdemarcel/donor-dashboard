import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseAndValidateCsv } from "@/lib/csv-parser";
import { prisma, schemaReady } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as { id?: string }).id || session.user.email!;
    const formData = await req.formData();
    const file   = formData.get("file") as File | null;
    const commit = formData.get("commit") === "true";

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!file.name.endsWith(".csv")) return NextResponse.json({ error: "Only CSV files accepted" }, { status: 400 });

    const text = await file.text();
    const { validRows, invalidRows, totalParsed } = parseAndValidateCsv(text);

    if (commit) {
      await schemaReady;
      // Ensure the User row exists before inserting GiftRows (FK constraint)
      await prisma.user.upsert({
        where: { id: userId },
        create: { id: userId, email: session.user.email!, name: session.user.name ?? null },
        update: {},
      });
      await prisma.giftRow.deleteMany({ where: { userId } });
      for (const row of validRows) {
        await prisma.giftRow.create({ data: { ...row, userId } });
      }
      return NextResponse.json({
        committed: true,
        validCount: validRows.length,
        invalidCount: invalidRows.length,
        totalParsed,
      });
    }

    return NextResponse.json({
      committed: false,
      preview: validRows.slice(0, 10),
      validCount: validRows.length,
      invalidRows: invalidRows.slice(0, 5),
      invalidCount: invalidRows.length,
      totalParsed,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}