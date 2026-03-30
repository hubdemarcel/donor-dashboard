"use client";
import { useEffect, useState } from "react";
import { UserX, RotateCcw, ArrowUpRight, Award } from "lucide-react";
import KpiGrid from "@/components/dashboard/KpiGrid";
import GiftsOverTimeChart from "@/components/dashboard/GiftsOverTimeChart";
import SegmentBreakdown from "@/components/dashboard/SegmentBreakdown";
import TopDonorsTable from "@/components/dashboard/TopDonorsTable";
import CsvUploader from "@/components/dashboard/CsvUploader";
import NlQueryPanel from "@/components/dashboard/NlQueryPanel";
import GoalTracker from "@/components/dashboard/GoalTracker";
import AtRiskPanel from "@/components/dashboard/AtRiskPanel";
import RegionalOverview from "@/components/dashboard/RegionalOverview";
import type { KpiData } from "@/types";

function SecondaryCard({
  label, value, sub, icon, iconClass,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold tracking-tight text-brand-text tabular-nums">{value}</div>
      {sub && <p className="text-[11px] text-brand-faint">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [kpis, setKpis]       = useState<KpiData | null>(null);
  const [empty, setEmpty]     = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchKpis() {
    setLoading(true);
    const res  = await fetch("/api/metrics");
    const data = await res.json();
    if (data.empty) { setEmpty(true); setKpis(null); } else { setKpis(data); setEmpty(false); }
    setLoading(false);
  }
  useEffect(() => { fetchKpis(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (empty || !kpis) return <div className="space-y-6"><CsvUploader onSuccess={fetchKpis} /></div>;
  return (
    <div className="space-y-6">
      <CsvUploader onSuccess={fetchKpis} compact />
      <KpiGrid kpis={kpis} />
      <GoalTracker totalRaised={kpis.totalRaised} />
      <div className="grid grid-cols-4 gap-4">
        <SecondaryCard
          label="Lapsed Donors" value={kpis.lapsedCount.toLocaleString()}
          sub="Were active donors, haven't given in over 2 years. A recovery opportunity."
          icon={<UserX className="w-4 h-4" />}
          iconClass="bg-red-50 text-red-600"
        />
        <SecondaryCard
          label="Reactivation Rate" value={kpis.reactivationRate.toFixed(1) + "%"}
          sub="Of all lapsed donors, the share who came back and gave again this year."
          icon={<RotateCcw className="w-4 h-4" />}
          iconClass="bg-violet-50 text-violet-700"
        />
        <SecondaryCard
          label="1st→2nd Conversion" value={kpis.conversionRate.toFixed(1) + "%"}
          sub="New donors from last year who made a second gift this year. A stewardship signal."
          icon={<ArrowUpRight className="w-4 h-4" />}
          iconClass="bg-green-50 text-green-700"
        />
        <SecondaryCard
          label="Top Retention Segment"
          value={kpis.retentionBySegment[0]?.segment ?? "—"}
          sub={kpis.retentionBySegment[0] ? kpis.retentionBySegment[0].rate.toFixed(0) + "% of this segment renewed — your most loyal tier." : "Upload data to calculate"}
          icon={<Award className="w-4 h-4" />}
          iconClass="bg-amber-50 text-amber-700"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2"><GiftsOverTimeChart data={kpis.giftsOverTime} /></div>
        <div><SegmentBreakdown segments={kpis.bySegment} channels={kpis.byChannel} /></div>
      </div>
      <AtRiskPanel />
      <RegionalOverview />
      <div className="grid grid-cols-2 gap-4">
        <TopDonorsTable donors={kpis.topDonors} retentionBySegment={kpis.retentionBySegment} />
        <NlQueryPanel />
      </div>
    </div>
  );
}

