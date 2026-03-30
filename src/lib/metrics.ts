import { subDays } from "date-fns";
import type { GiftRow, KpiData, SegmentRetention, TimeSeriesPoint, BreakdownItem } from "@/types";

function toDate(s: string) { return new Date(s); }

export function computeAllKpis(rows: GiftRow[]): KpiData {
  const today  = new Date();
  const pStart = subDays(today, 730);
  const pEnd   = subDays(today, 365);
  const cStart = pEnd;

  const inPrior   = (r: GiftRow) => toDate(r.gift_date) >= pStart && toDate(r.gift_date) < pEnd;
  const inCurrent = (r: GiftRow) => toDate(r.gift_date) >= cStart;

  const priorRows   = rows.filter(inPrior);
  const currentRows = rows.filter(inCurrent);
  const priorIds    = new Set(priorRows.map(r => r.donor_id));
  const currentIds  = new Set(currentRows.map(r => r.donor_id));
  const retainedIds = new Set([...priorIds].filter(id => currentIds.has(id)));

  const totalRaised      = currentRows.reduce((s, r) => s + r.gift_amount, 0);
  const avgGift          = currentRows.length ? totalRaised / currentRows.length : 0;
  const donorCount       = currentIds.size;
  const retentionRate    = priorIds.size ? (retainedIds.size / priorIds.size) * 100 : 0;

  // Prior-period equivalents for KPI delta computation
  const priorTotalRaised = priorRows.reduce((s, r) => s + r.gift_amount, 0);
  const priorAvgGift     = priorRows.length ? priorTotalRaised / priorRows.length : 0;
  const priorDonorCount  = priorIds.size;

  // First-to-second conversion
  const firstGiftDate = new Map<string, Date>();
  rows.forEach(r => {
    const d = toDate(r.gift_date);
    if (!firstGiftDate.has(r.donor_id) || d < firstGiftDate.get(r.donor_id)!) firstGiftDate.set(r.donor_id, d);
  });
  const newInPrior = new Set([...firstGiftDate.entries()].filter(([, d]) => d >= pStart && d < pEnd).map(([id]) => id));
  const converted  = new Set([...newInPrior].filter(id => currentIds.has(id)));
  const conversionRate = newInPrior.size ? (converted.size / newInPrior.size) * 100 : 0;

  // Lapsed + reactivation
  const beforePriorIds = new Set(rows.filter(r => toDate(r.gift_date) < pStart).map(r => r.donor_id));
  const activeIds      = new Set([...priorIds, ...currentIds]);
  const lapsedIds      = new Set([...beforePriorIds].filter(id => !activeIds.has(id)));
  const reactivatedIds = new Set([...lapsedIds].filter(id => currentIds.has(id)));
  const reactivationRate = lapsedIds.size ? (reactivatedIds.size / lapsedIds.size) * 100 : 0;

  // Upgrade rate
  const priorTotals = new Map<string, number>();
  const currentTotals = new Map<string, number>();
  priorRows.forEach(r   => priorTotals.set(r.donor_id,   (priorTotals.get(r.donor_id)   || 0) + r.gift_amount));
  currentRows.forEach(r => currentTotals.set(r.donor_id, (currentTotals.get(r.donor_id) || 0) + r.gift_amount));
  const both     = [...retainedIds];
  const upgrades = both.filter(id => (currentTotals.get(id) || 0) > (priorTotals.get(id) || 0)).length;
  const upgradeRate = both.length ? (upgrades / both.length) * 100 : 0;

  // Retention by segment
  const segments = [...new Set(rows.map(r => r.segment))].filter(Boolean);
  const retentionBySegment: SegmentRetention[] = segments.map(seg => {
    const sp = new Set(priorRows.filter(r => r.segment === seg).map(r => r.donor_id));
    const sc = new Set(currentRows.filter(r => r.segment === seg).map(r => r.donor_id));
    const sr = new Set([...sp].filter(id => sc.has(id)));
    return { segment: seg, rate: sp.size ? (sr.size / sp.size) * 100 : 0, retained: sr.size, prior: sp.size };
  });

  // Gifts over time (monthly)
  const monthMap = new Map<string, { total: number; count: number }>();
  currentRows.forEach(r => {
    const key = r.gift_date.slice(0, 7);
    const cur = monthMap.get(key) || { total: 0, count: 0 };
    monthMap.set(key, { total: cur.total + r.gift_amount, count: cur.count + 1 });
  });
  const giftsOverTime: TimeSeriesPoint[] = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));

  function breakdown(field: keyof GiftRow): BreakdownItem[] {
    const map = new Map<string, { total: number; count: number }>();
    currentRows.forEach(r => {
      const key = String(r[field]);
      const cur = map.get(key) || { total: 0, count: 0 };
      map.set(key, { total: cur.total + r.gift_amount, count: cur.count + 1 });
    });
    const grand = currentRows.reduce((s, r) => s + r.gift_amount, 0);
    return [...map.entries()]
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([label, v]) => ({ label, total: v.total, count: v.count, avgGift: v.count ? v.total / v.count : 0, pct: grand ? (v.total / grand) * 100 : 0 }));
  }

  const donorTotals = new Map<string, { row: GiftRow; total: number }>();
  currentRows.forEach(r => {
    const cur = donorTotals.get(r.donor_id);
    donorTotals.set(r.donor_id, { row: r, total: (cur?.total || 0) + r.gift_amount });
  });
  const topDonors = [...donorTotals.values()]
    .sort((a, b) => b.total - a.total).slice(0, 10)
    .map(v => ({ ...v.row, gift_amount: v.total }));

  return {
    totalRaised, avgGift, donorCount, retentionRate, conversionRate,
    lapsedCount: lapsedIds.size, reactivationRate, upgradeRate,
    priorTotalRaised, priorAvgGift, priorDonorCount,
    retentionBySegment, giftsOverTime,
    bySegment: breakdown("segment"), byCampaign: breakdown("campaign"), byChannel: breakdown("channel"),
    topDonors,
  };
}
