"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Map } from "lucide-react";
import type { RegionData } from "@/app/api/regions/route";

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="py-2.5 px-4">
          <div className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: `${40 + (i * 10) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function RegionalOverview() {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/regions");
        const text = await res.text();
        const data = JSON.parse(text);
        setRegions(data.regions ?? []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const top5 = regions.slice(0, 5);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <Map className="w-4 h-4 text-primary" />
          <div>
            <span className="text-sm font-semibold text-brand-text">Regional Performance</span>
            <p className="text-[11px] text-brand-faint mt-0.5">Top 5 regions by total raised · rolling 12 months vs. prior year.</p>
          </div>
        </div>
        <Link
          href="/dashboard/regions"
          className="text-[11px] text-primary hover:underline font-medium"
        >
          View all regions →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-surface-offset/60">
            <tr>
              {["Region", "Total Raised", "Donors", "Avg Gift", "Retention", "Trend"].map(h => (
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
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : top5.map((r, i) => {
                  const isTop   = i === 0;
                  const isUp    = r.trend_pct >= 0;
                  return (
                    <tr
                      key={r.region}
                      className={`hover:bg-surface-offset/40 transition-colors border-b border-gray-50 last:border-0 ${
                        isTop ? "border-l-2 border-l-primary" : ""
                      }`}
                    >
                      <td className={`py-2.5 px-4 font-medium ${isTop ? "text-primary" : "text-brand-text"}`}>
                        {r.region}
                      </td>
                      <td className="py-2.5 px-4 tabular-nums font-semibold text-brand-text">
                        ${r.total_raised.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 tabular-nums text-brand-muted text-center">
                        {r.donor_count}
                      </td>
                      <td className="py-2.5 px-4 tabular-nums text-brand-muted">
                        ${Math.round(r.avg_gift).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 tabular-nums text-brand-muted">
                        {r.retention_rate.toFixed(0)}%
                      </td>
                      <td className={`py-2.5 px-4 tabular-nums font-semibold ${isUp ? "text-green-600" : "text-red-500"}`}>
                        {isUp ? "↑" : "↓"} {Math.abs(r.trend_pct).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })
            }
            {!loading && top5.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-brand-muted text-xs">
                  No regional data — upload a CSV first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
