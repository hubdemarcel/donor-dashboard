export interface GiftRow {
  id?: string;
  userId?: string;
  donor_id: string;
  donor_name: string;
  segment: string;
  gift_date: string;
  gift_amount: number;
  campaign: string;
  channel: string;
  region: string;
  city: string;
}
export interface InvalidRow {
  row: Record<string, unknown>;
  reason: string;
  index: number;
}
export interface ParseResult {
  validRows: GiftRow[];
  invalidRows: InvalidRow[];
  totalParsed: number;
}
export interface SegmentRetention {
  segment: string;
  rate: number;
  retained: number;
  prior: number;
}
export interface TimeSeriesPoint { month: string; total: number; count: number; }
export interface BreakdownItem { label: string; total: number; count: number; avgGift: number; pct: number; }
export interface KpiData {
  totalRaised: number; avgGift: number; donorCount: number;
  retentionRate: number; conversionRate: number;
  lapsedCount: number; reactivationRate: number; upgradeRate: number;
  // Prior-period values for YoY delta computation in KPI cards
  priorTotalRaised: number; priorAvgGift: number; priorDonorCount: number;
  retentionBySegment: SegmentRetention[];
  giftsOverTime: TimeSeriesPoint[];
  bySegment: BreakdownItem[]; byCampaign: BreakdownItem[]; byChannel: BreakdownItem[];
  topDonors: GiftRow[];
}
export interface QueryIntent {
  type: "top_campaign_avg_gift"|"lapsed_donors"|"top_channel"|"retention_rate"|"general_summary"|"upgrade_rate";
  segment?: string;
  period?: "current"|"prior";
}
