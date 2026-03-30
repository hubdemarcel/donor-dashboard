import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { GiftRow } from "@/types";

export interface DonorSummary {
  donor_id: string;
  donor_name: string;
  segment: string;
  region: string;
  totalGiven: number;
  giftCount: number;
  avgGift: number;
  lastGiftDate: string;
  channel: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id || session.user.email!;

  try {
    const rows = await prisma.giftRow.findMany({ where: { userId } });
    if (rows.length === 0) return NextResponse.json({ empty: true, donors: [] });

    const map = new Map<string, DonorSummary>();
    for (const r of rows as GiftRow[]) {
      const existing = map.get(r.donor_id);
      if (!existing) {
        map.set(r.donor_id, {
          donor_id: r.donor_id,
          donor_name: r.donor_name,
          segment: r.segment,
          region: r.region,
          totalGiven: r.gift_amount,
          giftCount: 1,
          avgGift: r.gift_amount,
          lastGiftDate: r.gift_date,
          channel: r.channel,
        });
      } else {
        existing.totalGiven += r.gift_amount;
        existing.giftCount += 1;
        if (r.gift_date > existing.lastGiftDate) {
          existing.lastGiftDate = r.gift_date;
          existing.channel = r.channel;
        }
      }
    }

    const donors: DonorSummary[] = [...map.values()]
      .map(d => ({ ...d, avgGift: d.totalGiven / d.giftCount }))
      .sort((a, b) => b.totalGiven - a.totalGiven);

    return NextResponse.json({ donors });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
