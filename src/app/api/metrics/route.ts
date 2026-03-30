import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeAllKpis } from "@/lib/metrics";
import type { GiftRow } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id || session.user.email!;
  try {
    const rows = await prisma.giftRow.findMany({ where: { userId } });
    if (rows.length === 0) return NextResponse.json({ empty: true });
    const kpis = computeAllKpis(rows as GiftRow[]);
    return NextResponse.json(kpis);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
