"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  Treemap, ScatterChart, Scatter, ZAxis,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { RegionData, RegionsSummary } from "@/app/api/regions/route";

type ViewMode = "table" | "treemap" | "bubble";

const BADGE: Record<string, string> = {
  "Major Gifts": "bg-amber-100 text-amber-800",
  "Mid-Level":   "bg-primary-light text-primary",
  "Annual Fund": "bg-green-50 text-green-700",
  "New Donor":   "bg-orange-50 text-orange-700",
  "Lapsed":      "bg-red-50 text-red-600",
};

function retentionColor(rate: number): string {
  if (rate >= 80) return "#0d9488";
  if (rate >= 60) return "#5eead4";
  if (rate >= 40) return "#99f6e4";
  return "#fca5a5";
}

const fmt = (v: number) =>
  "$" + (v >= 1000 ? (v / 1000).toFixed(0) + "K" : v);

const LEGEND = [
  { label: "≥ 80% retained",  color: "#0d9488" },
  { label: "60–79% retained", color: "#5eead4" },
  { label: "40–59% retained", color: "#99f6e4" },
  { label: "< 40% retained",  color: "#fca5a5" },
];

/* ── Treemap custom cell ─────────────────────────────────────────── */
function TreemapCell(props: {
  x?: number; y?: number; width?: number; height?: number;
  name?: string; size?: number; retention?: number;
  [key: string]: unknown;
}) {
  const { x = 0, y = 0, width = 0, height = 0,
          name = "", size = 0, retention = 0 } = props;
  if (!width || !height) return null;
  const color    = retentionColor(Number(retention));
  const showName = width > 50 && height > 30;
  const showSub  = width > 90 && height > 60;
  const fs       = Math.min(Math.floor(width / 8), 13);
  return (
    <g>
      <rect
        x={x} y={y} width={width} height={height}
        fill={color} stroke="#fff" strokeWidth={2}
        rx={4}
      />
      {showName && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showSub ? 10 : 0)}
          textAnchor="middle" dominantBaseline="middle"
          fill="#fff" fontSize={fs} fontWeight="700"
          style={{ pointerEvents: "none" }}
        >
          {String(name)}
        </text>
      )}
      {showSub && (
        <>
          <text
            x={x + width / 2} y={y + height / 2 + 9}
            textAnchor="middle" dominantBaseline="middle"
            fill="rgba(255,255,255,0.9)" fontSize={Math.max(fs - 2, 9)}
            style={{ pointerEvents: "none" }}
          >
            {fmt(Number(size))}
          </text>
          <text
            x={x + width / 2} y={y + height / 2 + 22}
            textAnchor="middle" dominantBaseline="middle"
            fill="rgba(255,255,255,0.75)" fontSize={Math.max(fs - 3, 8)}
            style={{ pointerEvents: "none" }}
          >
            {Number(retention).toFixed(0)}% retained
          </text>
        </>
      )}
    </g>
  );
}

/* ── Treemap tooltip ─────────────────────────────────────────────── */
function TreemapTooltip({ active, payload }: { active?: boolean; payload?: { payload: Record<string, number | string> }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const trend = Number(d.trend_pct ?? 0);
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs space-y-1 min-w-[170px]">
      <p className="font-semibold text-brand-text border-b border-gray-100 pb-1 mb-1">{d.name}</p>
      <p className="text-brand-muted">Total Raised: <span className="font-semibold text-brand-text">${Number(d.size).toLocaleString()}</span></p>
      <p className="text-brand-muted">Donors: <span className="font-semibold text-brand-text">{d.donor_count}</span></p>
      <p className="text-brand-muted">Avg Gift: <span className="font-semibold text-brand-text">${Math.round(Number(d.avg_gift)).toLocaleString()}</span></p>
      <p className="text-brand-muted">Retention: <span className="font-semibold text-brand-text">{Number(d.retention).toFixed(1)}%</span></p>
      <p className="text-brand-muted">Trend: <span className={`font-semibold ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>{trend >= 0 ? "+" : ""}{trend.toFixed(1)}%</span></p>
    </div>
  );
}

/* ── Bubble tooltip ──────────────────────────────────────────────── */
function BubbleTooltip({ active, payload }: { active?: boolean; payload?: { payload: Record<string, number | string> }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const trend = Number(d.trend_pct ?? 0);
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs space-y-1 min-w-[170px]">
      <p className="font-semibold text-brand-text border-b border-gray-100 pb-1 mb-1">{d.name}</p>
      <p className="text-brand-muted">Total Raised: <span className="font-semibold text-brand-text">${Number(d.total_raised).toLocaleString()}</span></p>
      <p className="text-brand-muted">Donors: <span className="font-semibold text-brand-text">{d.x}</span></p>
      <p className="text-brand-muted">Avg Gift: <span className="font-semibold text-brand-text">${Number(d.y).toLocaleString()}</span></p>
      <p className="text-brand-muted">Retention: <span className="font-semibold text-brand-text">{Number(d.retention).toFixed(1)}%</span></p>
      <p className="text-brand-muted">Trend: <span className={`font-semibold ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>{trend >= 0 ? "+" : ""}{trend.toFixed(1)}%</span></p>
    </div>
  );
}

/* ── Bubble custom shape ─────────────────────────────────────────── */
function BubbleShape(props: {
  cx?: number; cy?: number; size?: number;
  payload?: { name: string; retention: number };
}) {
  const { cx = 0, cy = 0, size = 100, payload } = props;
  const r     = Math.max(Math.sqrt(size / Math.PI), 8);
  const color = retentionColor(payload?.retention ?? 0);
  const label = (payload?.name ?? "").split(" ")[0];
  return (
    <g>
      <circle
        cx={cx} cy={cy} r={r}
        fill={color} fillOpacity={0.85}
        stroke="#fff" strokeWidth={2}
      />
      {r >= 16 && (
        <text
          x={cx} y={cy}
          textAnchor="middle" dominantBaseline="middle"
          fill="white"
          fontSize={Math.min(Math.floor(r * 0.45), 11)}
          fontWeight="600"
          style={{ pointerEvents: "none" }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function RegionsPage() {
  const router = useRouter();
  const [regions,  setRegions]  = useState<RegionData[]>([]);
  const [summary,  setSummary]  = useState<RegionsSummary | null>(null);
  const [active,   setActive]   = useState<string>("");
  const [loading,  setLoading]  = useState(true);
  const [empty,    setEmpty]    = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/regions");
        const text = await res.text();
        const data = JSON.parse(text);
        if (!data.regions?.length) { setEmpty(true); }
        else {
          setRegions(data.regions);
          setSummary(data.summary);
          setActive(data.regions[0].region);
        }
      } catch { setEmpty(true); }
      finally  { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (empty || !summary) return (
    <div className="card p-12 text-center text-brand-muted text-sm">
      No regional data found.{" "}
      <a href="/dashboard/upload" className="text-primary underline">Upload a CSV</a> to get started.
    </div>
  );

  const selected    = regions.find(r => r.region === active) ?? regions[0];
  const isUp        = selected.trend_pct >= 0;
  const weakestData = regions.find(r => r.region === summary.weakestRegion);

  /* ── chart datasets ──────────────────────────────────────────── */
  const treemapData = regions.map(r => ({
    name:        r.region,
    size:        r.total_raised,
    retention:   r.retention_rate,
    donor_count: r.donor_count,
    avg_gift:    r.avg_gift,
    trend_pct:   r.trend_pct,
  }));

  const bubbleData = regions.map(r => ({
    x:           r.donor_count,
    y:           Math.round(r.avg_gift),
    z:           r.total_raised,
    name:        r.region,
    retention:   r.retention_rate,
    total_raised: r.total_raised,
    trend_pct:   r.trend_pct,
    donor_count: r.donor_count,
  }));

  const VIEWS: { key: ViewMode; label: string }[] = [
    { key: "table",   label: "Table"   },
    { key: "treemap", label: "Treemap" },
    { key: "bubble",  label: "Bubble"  },
  ];

  return (
    <div className="space-y-5">

      {/* ── SUMMARY CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted mb-1.5">
            Regions Active
          </p>
          <p className="text-2xl font-bold text-brand-text tabular-nums">{summary.totalRegions}</p>
        </div>
        <div className="card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted mb-1">
            Top Region
          </p>
          <p className="text-lg font-bold text-brand-text">{summary.topRegion}</p>
          <p className="text-xs text-brand-muted mt-0.5">
            ${regions.find(r => r.region === summary.topRegion)?.total_raised.toLocaleString() ?? "—"} raised
          </p>
        </div>
        <div className="card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted mb-1">
            Weakest Retention
          </p>
          <p className="text-lg font-bold text-brand-text">{summary.weakestRegion}</p>
          <p className="text-xs text-brand-muted mt-0.5">
            {weakestData ? weakestData.retention_rate.toFixed(0) + "% retained" : "—"}
          </p>
        </div>
      </div>

      {/* ── VIEW TOGGLE ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-surface-offset rounded-xl w-fit">
        {VIEWS.map(v => (
          <button
            key={v.key}
            onClick={() => setViewMode(v.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === v.key
                ? "bg-primary text-white shadow-sm"
                : "text-brand-muted hover:text-brand-text"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* ── TREEMAP ──────────────────────────────────────────────── */}
      {viewMode === "treemap" && (
        <div className="card p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-brand-text">Revenue by Region</p>
            <p className="text-[11px] text-brand-faint mt-0.5">
              Size = Total Raised · Color = Retention Rate
            </p>
          </div>
          <div className="flex gap-5 flex-wrap">
            {LEGEND.map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: l.color }} />
                <span className="text-[11px] text-brand-muted">{l.label}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={420}>
            <Treemap
              data={treemapData}
              dataKey="size"
              content={<TreemapCell />}
            >
              <Tooltip content={<TreemapTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── BUBBLE CHART ─────────────────────────────────────────── */}
      {viewMode === "bubble" && (
        <div className="card p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-brand-text">Donor Count vs. Average Gift</p>
            <p className="text-[11px] text-brand-faint mt-0.5">
              Bubble size = Total Raised · Color = Retention Rate · Identify high-value low-volume vs. high-volume low-value territories
            </p>
          </div>
          <div className="flex gap-5 flex-wrap">
            {LEGEND.map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: l.color }} />
                <span className="text-[11px] text-brand-muted">{l.label}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={420}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                dataKey="x"
                name="Donors"
                tick={{ fontSize: 10, fill: "#72716b" }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Donor Count",
                  position: "insideBottom",
                  offset: -15,
                  fontSize: 11,
                  fill: "#72716b",
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Avg Gift"
                tickFormatter={fmt}
                tick={{ fontSize: 10, fill: "#72716b" }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Avg Gift ($)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 15,
                  fontSize: 11,
                  fill: "#72716b",
                }}
              />
              <ZAxis type="number" dataKey="z" range={[300, 4000]} />
              <Tooltip content={<BubbleTooltip />} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter
                data={bubbleData}
                shape={(props: object) => <BubbleShape {...(props as Parameters<typeof BubbleShape>[0])} />}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── REGION TABS (always visible) ─────────────────────────── */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max border-b border-gray-100 pb-0">
          {regions.map(r => (
            <button
              key={r.region}
              onClick={() => setActive(r.region)}
              className={`px-3.5 py-2 text-xs font-medium rounded-t-lg border border-b-0 whitespace-nowrap transition-colors ${
                active === r.region
                  ? "bg-white border-gray-200 text-primary font-semibold"
                  : "bg-surface-offset/50 border-transparent text-brand-muted hover:text-brand-text hover:bg-white"
              }`}
            >
              {r.region}
            </button>
          ))}
        </div>
      </div>

      {/* ── SELECTED REGION DETAIL ───────────────────────────────── */}
      <div className="space-y-4">
        {/* 4 KPI cards + trend badge */}
        <div className="flex items-start gap-4">
          <div className="grid grid-cols-4 gap-4 flex-1">
            <div className="card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted mb-1.5">
                Total Raised
              </p>
              <p className="text-xl font-bold text-brand-text tabular-nums">
                ${selected.total_raised.toLocaleString()}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted mb-1.5">
                Donor Count
              </p>
              <p className="text-xl font-bold text-brand-text tabular-nums">
                {selected.donor_count}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted mb-1.5">
                Average Gift
              </p>
              <p className="text-xl font-bold text-brand-text tabular-nums">
                ${Math.round(selected.avg_gift).toLocaleString()}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted mb-1.5">
                Retention Rate
              </p>
              <p className="text-xl font-bold text-brand-text tabular-nums">
                {selected.retention_rate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Trend badge */}
          <div className={`card p-4 flex items-center gap-2 flex-shrink-0 ${
            isUp ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
          }`}>
            {isUp
              ? <TrendingUp   className="w-5 h-5 text-green-600" />
              : <TrendingDown className="w-5 h-5 text-red-500"   />
            }
            <div>
              <p className={`text-lg font-bold tabular-nums ${isUp ? "text-green-700" : "text-red-600"}`}>
                {isUp ? "+" : ""}{selected.trend_pct.toFixed(1)}%
              </p>
              <p className="text-[11px] text-brand-muted">vs prior year</p>
            </div>
          </div>
        </div>

        {/* Monthly bar chart + top campaigns + cities */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5">
            <p className="text-sm font-semibold text-brand-text mb-4">
              Monthly Giving — {selected.region}
            </p>
            {selected.gifts_by_month.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={selected.gifts_by_month}
                  margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 9, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "#6b7280" }}
                    tickFormatter={(v: number) =>
                      "$" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)
                    }
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => ["$" + v.toLocaleString(), "Total"]}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                  <Bar dataKey="total" fill="#005f64" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-brand-muted text-xs">
                No current-period gifts for this region.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <p className="text-sm font-semibold text-brand-text mb-3">Top Campaigns</p>
              {selected.top_campaigns.length > 0 ? (
                <div className="space-y-2.5">
                  {selected.top_campaigns.map((c, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-brand-text truncate">{c.campaign}</p>
                        <p className="text-[11px] text-brand-muted">{c.count} gifts</p>
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-brand-text flex-shrink-0">
                        ${c.total.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-brand-muted">No campaign data.</p>
              )}
            </div>

            {selected.cities.length > 0 && (
              <div className="card p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted mb-2">
                  Cities
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.cities.map(city => (
                    <span
                      key={city}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary-light text-primary"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Donor table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 text-sm font-semibold text-brand-text">
            Donors in {selected.region} · {selected.donors.length > 0 ? `Top ${selected.donors.length}` : "0"}
          </div>
          {selected.donors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface-offset/60">
                  <tr>
                    {["Donor", "Segment", "Total Given", "Last Gift", "Status"].map(h => (
                      <th
                        key={h}
                        className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wide text-brand-muted border-b border-gray-100 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.donors.map((d, i) => (
                    <tr
                      key={i}
                      onClick={() => router.push(`/dashboard/donors/${encodeURIComponent(d.donor_id)}`)}
                      className="hover:bg-surface-offset/40 transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                    >
                      <td className="py-2.5 px-4 font-medium text-brand-text whitespace-nowrap">
                        {d.donor_name}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`badge ${BADGE[d.segment] ?? "bg-gray-100 text-gray-600"}`}>
                          {d.segment}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold tabular-nums text-brand-text">
                        ${d.total_given.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-brand-muted whitespace-nowrap">
                        {d.last_gift_date}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`badge ${d.status === "Active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-brand-muted text-xs">
              No donors with current-period gifts in this region.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
