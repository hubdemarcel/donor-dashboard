import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, schemaReady } from "@/lib/db";
import type { GiftRow } from "@/types";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id || session.user.email!;

  try {
    await schemaReady;
    const rows = await prisma.giftRow.findMany({
      where: { userId, donor_id: params.id },
      orderBy: { gift_date: "desc" },
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: "Donor not found" }, { status: 404 });
    }

    const typedRows = rows as GiftRow[];
    const totalGiven = typedRows.reduce((s, r) => s + r.gift_amount, 0);
    const giftCount  = typedRows.length;
    const avgGift    = totalGiven / giftCount;

    // rows is sorted desc — [0] is most recent, [last] is oldest
    const lastGiftDate  = typedRows[0].gift_date;
    const firstGiftDate = typedRows[typedRows.length - 1].gift_date;
    const firstRow      = typedRows[0];

    const isActive =
      (new Date().getTime() - new Date(lastGiftDate).getTime()) <=
      365 * 24 * 60 * 60 * 1000;

    // Aggregate by month (for chart), sorted ascending
    const monthMap = new Map<string, number>();
    for (const r of typedRows) {
      const month = r.gift_date.slice(0, 7);
      monthMap.set(month, (monthMap.get(month) ?? 0) + r.gift_amount);
    }
    const giftsByMonth = [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));

    return NextResponse.json({
      donor_id:        firstRow.donor_id,
      donor_name:      firstRow.donor_name,
      segment:         firstRow.segment,
      total_given:     totalGiven,
      gift_count:      giftCount,
      avg_gift:        avgGift,
      first_gift_date: firstGiftDate,
      last_gift_date:  lastGiftDate,
      status:          isActive ? "Active" : "Lapsed",
      gifts:           typedRows,
      gifts_by_month:  giftsByMonth,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
