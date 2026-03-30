import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { GiftRow } from "@/types";

export interface RegionDonorRow {
  donor_id:       string;
  donor_name:     string;
  segment:        string;
  total_given:    number;
  last_gift_date: string;
  status:         "Active" | "Lapsed";
}

export interface RegionCampaign {
  campaign: string;
  total:    number;
  count:    number;
}

export interface RegionData {
  region:          string;
  total_raised:    number;
  prior_raised:    number;
  donor_count:     number;
  avg_gift:        number;
  retention_rate:  number;
  top_campaign:    string;
  top_channel:     string;
  at_risk_count:   number;
  gifts_by_month:  { month: string; total: number }[];
  trend_pct:       number;
  cities:          string[];
  top_campaigns:   RegionCampaign[];
  donors:          RegionDonorRow[];
}

export interface RegionsSummary {
  totalRegions:    number;
  topRegion:       string;
  weakestRegion:   string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id || session.user.email!;

  try {
    const rows = await prisma.giftRow.findMany({ where: { userId } });
    if (rows.length === 0) return NextResponse.json({ regions: [], summary: { totalRegions: 0, topRegion: "—", weakestRegion: "—" } });

    const today        = new Date();
    const MS           = 24 * 60 * 60 * 1000;
    const currentStart = new Date(today.getTime() - 365 * MS);
    const priorStart   = new Date(today.getTime() - 730 * MS);
    const priorEnd     = new Date(currentStart.getTime() - 1);
    const recent90     = new Date(today.getTime() - 90  * MS);

    const inCurrent = (r: GiftRow) => new Date(r.gift_date) >= currentStart;
    const inPrior   = (r: GiftRow) => {
      const d = new Date(r.gift_date);
      return d >= priorStart && d <= priorEnd;
    };

    const typedRows = rows as GiftRow[];
    const allRegions = [...new Set(typedRows.map(r => r.region).filter(Boolean))];

    const regions: RegionData[] = allRegions.map(region => {
      const regionRows = typedRows.filter(r => r.region === region);
      const current    = regionRows.filter(inCurrent);
      const prior      = regionRows.filter(inPrior);

      const totalRaised  = current.reduce((s, r) => s + r.gift_amount, 0);
      const priorRaised  = prior.reduce((s, r) => s + r.gift_amount,   0);
      const currentIds   = new Set(current.map(r => r.donor_id));
      const priorIds     = new Set(prior.map(r => r.donor_id));
      const retainedIds  = new Set([...priorIds].filter(id => currentIds.has(id)));
      const retentionRate = priorIds.size ? (retainedIds.size / priorIds.size) * 100 : 0;
      const donorCount   = currentIds.size;
      const avgGift      = current.length ? totalRaised / current.length : 0;
      const trendPct     = priorRaised ? ((totalRaised - priorRaised) / priorRaised) * 100 : 0;

      // at_risk: gave in prior but no gift since 90 days ago
      const lastGiftByDonor = new Map<string, Date>();
      for (const r of regionRows) {
        const d = new Date(r.gift_date);
        const existing = lastGiftByDonor.get(r.donor_id);
        if (!existing || d > existing) lastGiftByDonor.set(r.donor_id, d);
      }
      const atRiskCount = [...priorIds].filter(id => {
        const last = lastGiftByDonor.get(id);
        return last && last < recent90;
      }).length;

      // top_campaign by gift count in current period
      const campaignCount = new Map<string, { total: number; count: number }>();
      for (const r of current) {
        const c = campaignCount.get(r.campaign) ?? { total: 0, count: 0 };
        campaignCount.set(r.campaign, { total: c.total + r.gift_amount, count: c.count + 1 });
      }
      const topCampaigns: RegionCampaign[] = [...campaignCount.entries()]
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 3)
        .map(([campaign, v]) => ({ campaign, total: v.total, count: v.count }));
      const topCampaign = topCampaigns[0]?.campaign ?? "—";

      // top_channel by gift count in current period
      const channelCount = new Map<string, number>();
      for (const r of current) channelCount.set(r.channel, (channelCount.get(r.channel) ?? 0) + 1);
      const topChannel = [...channelCount.entries()].sort(([, a], [, b]) => b - a)[0]?.[0] ?? "—";

      // gifts_by_month for current period
      const monthMap = new Map<string, number>();
      for (const r of current) {
        const m = r.gift_date.slice(0, 7);
        monthMap.set(m, (monthMap.get(m) ?? 0) + r.gift_amount);
      }
      const giftsByMonth = [...monthMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, total]) => ({ month, total }));

      // unique cities
      const cities = [...new Set(regionRows.map(r => r.city).filter(Boolean))].sort();

      // top 10 donors by total_given in current period
      const donorTotals = new Map<string, { row: GiftRow; total: number }>();
      for (const r of current) {
        const ex = donorTotals.get(r.donor_id);
        donorTotals.set(r.donor_id, { row: r, total: (ex?.total ?? 0) + r.gift_amount });
      }
      const donors: RegionDonorRow[] = [...donorTotals.values()]
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
        .map(({ row: r, total }) => {
          // find most recent gift date for this donor across all rows
          const allDates = regionRows.filter(x => x.donor_id === r.donor_id).map(x => x.gift_date);
          const lastGift = allDates.sort().at(-1) ?? r.gift_date;
          const isActive = (today.getTime() - new Date(lastGift).getTime()) <= 365 * MS;
          return {
            donor_id:       r.donor_id,
            donor_name:     r.donor_name,
            segment:        r.segment,
            total_given:    total,
            last_gift_date: lastGift,
            status:         isActive ? "Active" : "Lapsed",
          };
        });

      return {
        region,
        total_raised:   totalRaised,
        prior_raised:   priorRaised,
        donor_count:    donorCount,
        avg_gift:       avgGift,
        retention_rate: retentionRate,
        top_campaign:   topCampaign,
        top_channel:    topChannel,
        at_risk_count:  atRiskCount,
        gifts_by_month: giftsByMonth,
        trend_pct:      trendPct,
        cities,
        top_campaigns:  topCampaigns,
        donors,
      };
    });

    // Sort by total_raised desc — regions with no current gifts fall to bottom
    regions.sort((a, b) => b.total_raised - a.total_raised);

    const active    = regions.filter(r => r.total_raised > 0);
    const topRegion = active[0]?.region ?? "—";
    // weakest = lowest retention among active regions
    const weakest   = [...active].sort((a, b) => a.retention_rate - b.retention_rate)[0]?.region ?? "—";

    return NextResponse.json({
      regions,
      summary: {
        totalRegions:  active.length,
        topRegion,
        weakestRegion: weakest,
      } satisfies RegionsSummary,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

