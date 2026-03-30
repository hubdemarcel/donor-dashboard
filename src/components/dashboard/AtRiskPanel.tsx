"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import type { AtRiskDonor } from "@/app/api/atrisk/route";

const SEGMENT_BADGE: Record<string, string> = {
  "Major Gifts": "bg-amber-100 text-amber-800",
  "Mid-Level":   "bg-primary-light text-primary",
  "Annual Fund": "bg-green-50 text-green-700",
  "New Donor":   "bg-orange-50 text-orange-700",
  "Lapsed":      "bg-red-50 text-red-600",
};

const RISK_BADGE: Record<string, string> = {
  high:   "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low:    "bg-blue-50 text-blue-700",
};

const RISK_DOT: Record<string, string> = {
  high:   "bg-red-500",
  medium: "bg-amber-400",
  low:    "bg-blue-400",
};

export default function AtRiskPanel() {
  const [atRisk, setAtRisk]   = useState<AtRiskDonor[]>([]);
  const [count, setCount]     = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/atrisk");
        const text = await res.text();
        const data = JSON.parse(text);
        setAtRisk(data.atRisk ?? []);
        setCount(data.count  ?? 0);
      } catch { /* silent — show empty state */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return (
    <div className="card p-4 flex items-center justify-center h-20">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-brand-text">At-Risk Donors</span>
          {count > 0 && (
            <span className="badge bg-amber-100 text-amber-800 font-semibold">{count}</span>
          )}
        </div>
        <span className="text-[11px] text-brand-muted">Gave 1–2 years ago with no recent activity — still reachable, not yet lost.</span>
      </div>

      {/* Empty state */}
      {count === 0 ? (
        <div className="flex items-center gap-2.5 px-5 py-6 text-sm text-green-700">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          All donors are active — no at-risk donors detected.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface-offset/60">
              <tr>
                {["Risk", "Donor", "Segment", "Days Since Gift", "Last Gift", "Risk Level"].map(h => (
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
              {atRisk.map((d, i) => (
                <tr
                  key={i}
                  className="hover:bg-surface-offset/40 transition-colors border-b border-gray-50 last:border-0"
                >
                  <td className="py-2.5 px-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${RISK_DOT[d.risk_level]}`} />
                  </td>
                  <td className="py-2.5 px-4 font-medium text-brand-text whitespace-nowrap">
                    {d.donor_name}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`badge ${SEGMENT_BADGE[d.segment] ?? "bg-gray-100 text-gray-600"}`}>
                      {d.segment}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 tabular-nums text-brand-muted">
                    {d.days_since_last_gift} days
                  </td>
                  <td className="py-2.5 px-4 tabular-nums text-brand-muted">
                    ${d.last_gift_amount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`badge capitalize ${RISK_BADGE[d.risk_level]}`}>
                      {d.risk_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
