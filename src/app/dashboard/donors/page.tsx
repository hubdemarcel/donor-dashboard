"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, UserCheck, UserX, Star } from "lucide-react";
import type { DonorSummary } from "@/app/api/donors/route";

function DonorStatCard({
  label, value, icon, iconClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="card p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold tracking-tight text-brand-text tabular-nums">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

const BADGE: Record<string, string> = {
  "Major Gifts": "bg-amber-100 text-amber-800",
  "Mid-Level":   "bg-primary-light text-primary",
  "Annual Fund": "bg-green-50 text-green-700",
  "New Donor":   "bg-orange-50 text-orange-700",
  "Lapsed":      "bg-red-50 text-red-600",
};

export default function DonorsPage() {
  const router = useRouter();
  const [donors, setDonors]   = useState<DonorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty]     = useState(false);
  const [query, setQuery]     = useState("");
  const [segment, setSegment] = useState("All");

  useEffect(() => {
    async function load() {
      const res  = await fetch("/api/donors");
      const text = await res.text();
      const data = JSON.parse(text);
      if (data.empty || !data.donors?.length) { setEmpty(true); } else { setDonors(data.donors); }
      setLoading(false);
    }
    load();
  }, []);

  const segments = ["All", ...Array.from(new Set(donors.map(d => d.segment))).sort()];

  const filtered = donors.filter(d => {
    const matchesQuery =
      d.donor_name.toLowerCase().includes(query.toLowerCase()) ||
      d.donor_id.toLowerCase().includes(query.toLowerCase()) ||
      d.region.toLowerCase().includes(query.toLowerCase());
    const matchesSegment = segment === "All" || d.segment === segment;
    return matchesQuery && matchesSegment;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (empty) return (
    <div className="card p-12 text-center space-y-3">
      <p className="text-base font-semibold text-brand-text">No donor data loaded yet</p>
      <p className="text-sm text-brand-muted max-w-sm mx-auto">
        Upload your gift history CSV from the Dashboard to see your full donor list here.
      </p>
      <a
        href="/dashboard"
        className="inline-block mt-2 px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Go to Dashboard →
      </a>
    </div>
  );

  const cutoff      = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const totalDonors = donors.length;
  const activeDonors = donors.filter(d => d.lastGiftDate >= cutoff).length;
  const lapsedDonors = donors.filter(d => d.lastGiftDate < cutoff).length;
  const majorDonors  = donors.filter(d => d.segment === "Major Gifts").length;

  return (
    <div className="space-y-4">
      {/* Summary KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <DonorStatCard
          label="Total Donors" value={totalDonors}
          icon={<Users className="w-4 h-4" />}
          iconClass="bg-primary-light text-primary"
        />
        <DonorStatCard
          label="Active Donors" value={activeDonors}
          icon={<UserCheck className="w-4 h-4" />}
          iconClass="bg-green-50 text-green-700"
        />
        <DonorStatCard
          label="Lapsed Donors" value={lapsedDonors}
          icon={<UserX className="w-4 h-4" />}
          iconClass="bg-red-50 text-red-600"
        />
        <DonorStatCard
          label="Major Donors" value={majorDonors}
          icon={<Star className="w-4 h-4" />}
          iconClass="bg-amber-50 text-amber-700"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-base font-semibold text-brand-text">All Donors</h1>
          <p className="text-xs text-brand-muted mt-0.5">{donors.length} total donors · {filtered.length} shown</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Segment filter */}
          <select
            value={segment}
            onChange={e => setSegment(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-brand-text outline-none focus:border-primary"
          >
            {segments.map(s => <option key={s}>{s}</option>)}
          </select>
          {/* Search */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-lg text-[11px] text-brand-muted bg-surface">
            <Search className="w-3 h-3" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search name, ID, region…"
              className="bg-transparent outline-none w-40 placeholder:text-brand-faint text-xs"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface-offset/60">
              <tr>
                {["Donor","ID","Segment","Region","Total Given","# Gifts","Avg Gift","Last Gift","Channel"].map(h => (
                  <th key={h} className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wide text-brand-muted border-b border-gray-100 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr
                  key={i}
                  onClick={() => router.push(`/dashboard/donors/${encodeURIComponent(d.donor_id)}`)}
                  className="hover:bg-surface-offset/40 transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                >
                  <td className="py-2.5 px-4 font-medium text-brand-text whitespace-nowrap">{d.donor_name}</td>
                  <td className="py-2.5 px-4 text-brand-muted font-mono">{d.donor_id}</td>
                  <td className="py-2.5 px-4">
                    <span className={`badge ${BADGE[d.segment] || "bg-gray-100 text-gray-600"}`}>{d.segment}</span>
                  </td>
                  <td className="py-2.5 px-4 text-brand-muted">{d.region}</td>
                  <td className="py-2.5 px-4 font-semibold tabular-nums text-brand-text">${d.totalGiven.toLocaleString()}</td>
                  <td className="py-2.5 px-4 tabular-nums text-brand-muted text-center">{d.giftCount}</td>
                  <td className="py-2.5 px-4 tabular-nums text-brand-muted">${Math.round(d.avgGift).toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-brand-muted whitespace-nowrap">{d.lastGiftDate}</td>
                  <td className="py-2.5 px-4 text-brand-muted">{d.channel}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-brand-muted text-xs">
              No donors match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
