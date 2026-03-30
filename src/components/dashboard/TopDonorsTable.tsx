"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import type { GiftRow, SegmentRetention } from "@/types";

const BADGE: Record<string, string> = {
  "Major Gifts": "bg-amber-100 text-amber-800",
  "Mid-Level":   "bg-primary-light text-primary",
  "Annual Fund": "bg-green-50 text-green-700",
  "New Donor":   "bg-orange-50 text-orange-700",
  "Lapsed":      "bg-red-50 text-red-600",
};

interface Props { donors: GiftRow[]; retentionBySegment: SegmentRetention[] }

export default function TopDonorsTable({ donors, retentionBySegment }: Props) {
  const [query, setQuery] = useState("");
  const filtered = donors.filter(d =>
    d.donor_name.toLowerCase().includes(query.toLowerCase()) ||
    d.segment.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div>
          <div className="text-sm font-semibold text-brand-text">Top Donors · Rolling 12 Months</div>
          <p className="text-[11px] text-brand-faint mt-0.5">Sorted by total given. Click a donor to view their full giving history and profile.</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-lg text-[11px] text-brand-muted bg-surface">
          <Search className="w-3 h-3" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search donors…"
            className="bg-transparent outline-none w-28 placeholder:text-brand-faint"
          />
        </div>
      </div>

      {/* Retention mini-bar above table */}
      <div className="px-5 py-2.5 bg-surface-offset/50 border-b border-gray-100">
        <div className="flex gap-3">
          {retentionBySegment.map(s => (
            <div key={s.segment} className="text-[11px]">
              <span className="text-brand-muted">{s.segment.split(" ")[0]}:</span>{" "}
              <span className="font-semibold text-brand-text">{s.rate.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-surface-offset/60 sticky top-0">
            <tr>
              {["Donor","Segment","Campaign","Total","Channel"].map(h => (
                <th key={h} className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wide text-brand-muted border-b border-gray-100">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <tr key={i} className="hover:bg-surface-offset/40 transition-colors border-b border-gray-50 last:border-0">
                <td className="py-2.5 px-4 font-medium text-brand-text">{d.donor_name}</td>
                <td className="py-2.5 px-4"><span className={`badge ${BADGE[d.segment] || "bg-gray-100 text-gray-600"}`}>{d.segment}</span></td>
                <td className="py-2.5 px-4 text-brand-muted">{d.campaign}</td>
                <td className="py-2.5 px-4 font-medium tabular-nums">${d.gift_amount.toLocaleString()}</td>
                <td className="py-2.5 px-4 text-brand-muted">{d.channel}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-brand-muted text-xs">No donors matching "{query}"</div>
        )}
      </div>
    </div>
  );
}
