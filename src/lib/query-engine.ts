import { subDays } from "date-fns";
import type { GiftRow, QueryIntent } from "@/types";

export function classifyIntent(question: string): QueryIntent {
  const q = question.toLowerCase();
  if ((q.includes("campaign") || q.includes("program")) && (q.includes("avg") || q.includes("average") || q.includes("highest") || q.includes("best")))
    return { type: "top_campaign_avg_gift", period: "current" };
  if (q.includes("lapsed") || q.includes("lost") || q.includes("churned"))
    return { type: "lapsed_donors", segment: q.includes("major") ? "Major Gifts" : q.includes("mid") ? "Mid-Level" : q.includes("annual") ? "Annual Fund" : undefined };
  if (q.includes("channel") || q.includes("email") || q.includes("mail") || q.includes("web") || q.includes("phone"))
    return { type: "top_channel" };
  if (q.includes("retention") || q.includes("retain")) return { type: "retention_rate" };
  if (q.includes("upgrade") || q.includes("increased") || q.includes("grew")) return { type: "upgrade_rate" };
  return { type: "general_summary" };
}

export function executeIntent(intent: QueryIntent, rows: GiftRow[]): Record<string, unknown> {
  const today  = new Date();
  const cStart = subDays(today, 365);
  const pStart = subDays(today, 730);
  const pEnd   = cStart;
  const currentRows = rows.filter(r => new Date(r.gift_date) >= cStart);
  const priorRows   = rows.filter(r => new Date(r.gift_date) >= pStart && new Date(r.gift_date) < pEnd);
  const priorIds    = new Set(priorRows.map(r => r.donor_id));
  const currentIds  = new Set(currentRows.map(r => r.donor_id));

  if (intent.type === "top_campaign_avg_gift") {
    const map = new Map<string, number[]>();
    currentRows.forEach(r => { if (!map.has(r.campaign)) map.set(r.campaign, []); map.get(r.campaign)!.push(r.gift_amount); });
    const results = [...map.entries()]
      .map(([campaign, amounts]) => ({ campaign, avgGift: Math.round(amounts.reduce((a,b)=>a+b,0)/amounts.length), totalRaised: Math.round(amounts.reduce((a,b)=>a+b,0)), donorCount: amounts.length }))
      .sort((a,b) => b.avgGift - a.avgGift);
    return { intent: "top_campaign_avg_gift", topCampaign: results[0], allCampaigns: results };
  }

  if (intent.type === "lapsed_donors") {
    const beforePrior = new Set(rows.filter(r => new Date(r.gift_date) < pStart).map(r => r.donor_id));
    const active      = new Set([...priorIds, ...currentIds]);
    const lapsed      = [...beforePrior].filter(id => !active.has(id));
    const lapsedRows  = rows.filter(r => lapsed.includes(r.donor_id));
    const filtered    = intent.segment ? lapsedRows.filter(r => r.segment === intent.segment) : lapsedRows;
    const unique      = [...new Map(filtered.map(r => [r.donor_id, r])).values()];
    const value       = rows.filter(r => lapsed.includes(r.donor_id)).reduce((s,r) => s + r.gift_amount, 0);
    return { intent: "lapsed_donors", segment: intent.segment||"all", lapsedCount: unique.length, totalLapsed: lapsed.length, estimatedRecoveryValue: Math.round(value), topDonors: unique.slice(0,5).map(r => ({ name: r.donor_name, segment: r.segment, lastGift: r.gift_date })) };
  }

  if (intent.type === "top_channel") {
    const map = new Map<string, { total: number; count: number }>();
    currentRows.forEach(r => { const c = map.get(r.channel)||{total:0,count:0}; map.set(r.channel, {total:c.total+r.gift_amount,count:c.count+1}); });
    const sorted = [...map.entries()].map(([channel,v]) => ({channel, total:Math.round(v.total), count:v.count, avgGift:Math.round(v.total/v.count)})).sort((a,b)=>b.total-a.total);
    return { intent: "top_channel", topChannel: sorted[0], allChannels: sorted };
  }

  if (intent.type === "retention_rate") {
    const retained = [...priorIds].filter(id => currentIds.has(id)).length;
    const rate     = priorIds.size ? Math.round((retained / priorIds.size) * 100) : 0;
    return { intent: "retention_rate", retentionRate: rate, retained, priorDonors: priorIds.size };
  }

  if (intent.type === "upgrade_rate") {
    const pt = new Map<string,number>(); const ct = new Map<string,number>();
    priorRows.forEach(r => pt.set(r.donor_id, (pt.get(r.donor_id)||0)+r.gift_amount));
    currentRows.forEach(r => ct.set(r.donor_id, (ct.get(r.donor_id)||0)+r.gift_amount));
    const both = [...priorIds].filter(id => currentIds.has(id));
    const upgraded = both.filter(id => (ct.get(id)||0) > (pt.get(id)||0)).length;
    return { intent:"upgrade_rate", upgradeRate: Math.round((upgraded/both.length)*100), upgraded, retained: both.length };
  }

  const total = currentRows.reduce((s,r)=>s+r.gift_amount,0);
  return { intent:"general_summary", totalRaisedCurrentYear: Math.round(total), uniqueDonors: currentIds.size, totalGiftRows: currentRows.length };
}
