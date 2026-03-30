import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { GiftRow } from "@/types";

export interface AtRiskDonor {
  donor_id: string;
  donor_name: string;
  segment: string;
  last_gift_date: string;
  last_gift_amount: number;
  days_since_last_gift: number;
  risk_level: "high" | "medium" | "low";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id || session.user.email!;

  try {
    const rows = await prisma.giftRow.findMany({ where: { userId } });
    if (rows.length === 0) return NextResponse.json({ atRisk: [], count: 0 });

    const today = new Date();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const MS_365 = 365 * MS_PER_DAY;
    const MS_730 = 730 * MS_PER_DAY;

    // Track each donor's most recent gift
    const donorMap = new Map<string, {
      donor_id: string; donor_name: string; segment: string;
      lastGiftDate: Date; lastGiftAmount: number;
    }>();

    for (const r of rows as GiftRow[]) {
      const d = new Date(r.gift_date);
      const existing = donorMap.get(r.donor_id);
      if (!existing || d > existing.lastGiftDate) {
        donorMap.set(r.donor_id, {
          donor_id: r.donor_id,
          donor_name: r.donor_name,
          segment: r.segment,
          lastGiftDate: d,
          lastGiftAmount: r.gift_amount,
        });
      }
    }

    const atRisk: AtRiskDonor[] = [];

    for (const donor of donorMap.values()) {
      const msSinceLast = today.getTime() - donor.lastGiftDate.getTime();
      const daysSinceLast = Math.floor(msSinceLast / MS_PER_DAY);

      // At-risk: last gift was 365–730 days ago (no recent activity, not yet fully lapsed)
      if (msSinceLast >= MS_365 && msSinceLast <= MS_730) {
        const risk_level: "high" | "medium" | "low" =
          daysSinceLast > 300 ? "high" :
          daysSinceLast > 180 ? "medium" : "low";

        atRisk.push({
          donor_id: donor.donor_id,
          donor_name: donor.donor_name,
          segment: donor.segment,
          last_gift_date: donor.lastGiftDate.toISOString().slice(0, 10),
          last_gift_amount: donor.lastGiftAmount,
          days_since_last_gift: daysSinceLast,
          risk_level,
        });
      }
    }

    atRisk.sort((a, b) => b.last_gift_amount - a.last_gift_amount);

    return NextResponse.json({ atRisk, count: atRisk.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

