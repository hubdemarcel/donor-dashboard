"use client";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import type { KpiData, BreakdownItem } from "@/types";

const COLORS = ["#005f64","#4a9ba6","#b88a00","#3d6e1d","#92420f","#7b5ea7","#c4621a"];

function CampaignTooltip({ active, payload }: { active?: boolean; payload?: {payload: BreakdownItem}[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs space-y-1 min-w-[160px]">
      <p className="font-semibold text-brand-text">{d.label}</p>
      <p className="text-brand-muted">Total: <span className="font-medium text-brand-text">${d.total.toLocaleString()}</span></p>
      <p className="text-brand-muted">Gifts: <span className="font-medium text-brand-text">{d.count}</span></p>
      <p className="text-brand-muted">Avg gift: <span className="font-medium text-brand-text">${Math.round(d.avgGift).toLocaleString()}</span></p>
      <p className="text-brand-muted">Share: <span className="font-medium text-brand-text">{d.pct.toFixed(1)}%</span></p>
    </div>
  );
}

export default function CampaignsPage() {
  const [kpis, setKpis]       = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty]     = useState(false);

  useEffect(() => {
    async function load() {
      const res  = await fetch("/api/metrics");
      const text = await res.text();
      const data = JSON.parse(text);
      if (data.empty) { setEmpty(true); } else { setKpis(data); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (empty || !kpis) return (
    <div className="card p-12 text-center text-brand-muted text-sm">
      No campaign data found. <a href="/dashboard/upload" className="text-primary underline">Upload a CSV</a> to get started.
    </div>
  );

  const campaigns = kpis.byCampaign;
  const channels  = kpis.byChannel;
  const best = campaigns[0];

  return (
    <div className="space-y-5">
      {/* Header KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted mb-1">Campaigns Active</p>
          <p className="text-2xl font-bold text-brand-text tabular-nums">{campaigns.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted mb-1">Top Campaign</p>
          <p className="text-lg font-bold text-brand-text truncate">{best?.label ?? "—"}</p>
          <p className="text-xs text-brand-muted mt-0.5">${best?.total.toLocaleString()} raised</p>
        </div>
        <div className="card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted mb-1">Best Avg Gift</p>
          {(() => {
            const top = [...campaigns].sort((a,b) => b.avgGift - a.avgGift)[0];
            return (
              <>
                <p className="text-2xl font-bold text-brand-text tabular-nums">${Math.round(top?.avgGift ?? 0).toLocaleString()}</p>
                <p className="text-xs text-brand-muted mt-0.5 truncate">{top?.label}</p>
              </>
            );
          })()}
        </div>
      </div>

      {/* Bar chart */}
      <div className="card p-5">
        <div className="text-sm font-semibold text-brand-text mb-4">Total Raised by Campaign</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={campaigns} margin={{ top: 4, right: 8, left: 8, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#6b7280" }}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#6b7280" }}
              tickFormatter={(v: number) => "$" + (v >= 1000 ? (v/1000).toFixed(0)+"k" : v)}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CampaignTooltip />} cursor={{ fill: "#f3f4f6" }} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {campaigns.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detail table + channel breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {/* Campaign table */}
        <div className="col-span-2 card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 text-sm font-semibold text-brand-text">
            Campaign Detail
          </div>
          <table className="w-full text-xs">
            <thead className="bg-surface-offset/60">
              <tr>
                {["Campaign","Total Raised","# Gifts","Avg Gift","Share"].map(h => (
                  <th key={h} className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wide text-brand-muted border-b border-gray-100">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => (
                <tr key={i} className="hover:bg-surface-offset/40 transition-colors border-b border-gray-50 last:border-0">
                  <td className="py-2.5 px-4 font-medium text-brand-text">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      {c.label}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 tabular-nums font-semibold text-brand-text">${c.total.toLocaleString()}</td>
                  <td className="py-2.5 px-4 tabular-nums text-brand-muted text-center">{c.count}</td>
                  <td className="py-2.5 px-4 tabular-nums text-brand-muted">${Math.round(c.avgGift).toLocaleString()}</td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-surface-offset rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                      <span className="tabular-nums text-brand-muted w-8 text-right">{c.pct.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Channel breakdown */}
        <div className="card p-5 space-y-3">
          <div className="text-sm font-semibold text-brand-text">By Channel</div>
          {channels.map((c, i) => (
            <div key={c.label}>
              <div className="flex justify-between items-baseline mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-brand-text">{c.label}</span>
                </div>
                <span className="text-xs tabular-nums text-brand-muted">{c.pct.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-surface-offset rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${c.pct}%`, background: COLORS[i % COLORS.length] }}
                />
              </div>
              <div className="text-[11px] text-brand-muted mt-0.5">${c.total.toLocaleString()} · {c.count} gifts</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
