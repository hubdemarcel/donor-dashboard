"use client";
import { useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, DollarSign, Activity, Users, RefreshCw } from "lucide-react";
import type { KpiData } from "@/types";

function useCountUp(target: number, duration = 1200) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const val  = Math.round(ease * target);
      if (ref.current) ref.current.textContent = val.toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return ref;
}

interface KpiCardProps {
  label: string;
  description: string;
  value: number;
  prefix?: string;
  suffix?: string;
  delta?: number;
  deltaLabel?: string;
  icon: React.ReactNode;
  iconClass: string;
}

function KpiCard({ label, description, value, prefix = "", suffix = "", delta, deltaLabel, icon, iconClass }: KpiCardProps) {
  const ref = useCountUp(Math.round(value));
  const up  = delta !== undefined && delta >= 0;
  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold tracking-tight text-brand-text tabular-nums">
        {prefix}<span ref={ref}>0</span>{suffix}
      </div>
      <p className="text-[11px] text-brand-faint leading-relaxed">{description}</p>
      {delta !== undefined && (
        <div className="flex items-center gap-2">
          <span className={`badge gap-1 ${up ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {up ? "+" : ""}{delta.toFixed(1)}%
          </span>
          <span className="text-[11px] text-brand-faint">{deltaLabel || "vs last year"}</span>
        </div>
      )}
    </div>
  );
}

function pctDelta(current: number, prior: number): number | undefined {
  if (!prior) return undefined;
  return ((current - prior) / prior) * 100;
}

export default function KpiGrid({ kpis }: { kpis: KpiData }) {
  const totalRaisedDelta = pctDelta(kpis.totalRaised,   kpis.priorTotalRaised);
  const avgGiftDelta     = pctDelta(kpis.avgGift,       kpis.priorAvgGift);
  const donorCountDelta  = pctDelta(kpis.donorCount,    kpis.priorDonorCount);

  return (
    <div className="grid grid-cols-4 gap-4">
      <KpiCard label="Total Raised" value={kpis.totalRaised} prefix="$" delta={totalRaisedDelta}
        deltaLabel="vs prior year"
        description="Sum of all gifts received in the last 12 months, across every campaign and channel."
        icon={<DollarSign className="w-4 h-4" />} iconClass="bg-primary-light text-primary" />
      <KpiCard label="Average Gift" value={kpis.avgGift} prefix="$" delta={avgGiftDelta}
        deltaLabel="vs prior year"
        description="Total raised ÷ number of gifts. Tells you how generous a typical donor is right now."
        icon={<Activity className="w-4 h-4" />} iconClass="bg-green-50 text-green-700" />
      <KpiCard label="Donor Count" value={kpis.donorCount} delta={donorCountDelta}
        deltaLabel="vs prior year"
        description="Unique individuals who gave at least once in the rolling 12-month window."
        icon={<Users className="w-4 h-4" />} iconClass="bg-amber-50 text-amber-700" />
      <KpiCard label="Retention Rate" value={kpis.retentionRate} suffix="%"
        description="Share of last year's donors who gave again this year. The most important long-term health metric."
        icon={<RefreshCw className="w-4 h-4" />} iconClass="bg-red-50 text-red-600" />
    </div>
  );
}
