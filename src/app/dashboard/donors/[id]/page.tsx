"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

interface GiftRow {
  donor_id: string;
  donor_name: string;
  segment: string;
  gift_date: string;
  gift_amount: number;
  campaign: string;
  channel: string;
  region: string;
}

interface DonorProfile {
  donor_id: string;
  donor_name: string;
  segment: string;
  total_given: number;
  gift_count: number;
  avg_gift: number;
  first_gift_date: string;
  last_gift_date: string;
  status: "Active" | "Lapsed";
  gifts: GiftRow[];
  gifts_by_month: { month: string; total: number }[];
}

const BADGE: Record<string, string> = {
  "Major Gifts": "bg-amber-100 text-amber-800",
  "Mid-Level":   "bg-primary-light text-primary",
  "Annual Fund": "bg-green-50 text-green-700",
  "New Donor":   "bg-orange-50 text-orange-700",
  "Lapsed":      "bg-red-50 text-red-600",
};

export default function DonorProfilePage() {
  const router  = useRouter();
  const params  = useParams();
  const id      = params?.id as string;

  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res  = await fetch(`/api/donors/${encodeURIComponent(id)}`);
        const text = await res.text();
        const data = JSON.parse(text);
        if (!res.ok) { setError(data.error ?? "Failed to load donor"); }
        else { setProfile(data); }
      } catch (e) {
        setError("Failed to load: " + String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !profile) return (
    <div className="space-y-4">
      <button
        onClick={() => router.back()}
        className="btn-secondary text-xs flex items-center gap-1.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>
      <div className="card p-8 text-center text-brand-muted text-sm">
        {error || "Donor not found."}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="btn-secondary text-xs flex items-center gap-1.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Donors
      </button>

      {/* Header card */}
      <div className="card p-5 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-brand-text">{profile.donor_name}</h1>
          <p className="text-xs text-brand-muted mt-0.5 font-mono">{profile.donor_id}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${BADGE[profile.segment] ?? "bg-gray-100 text-gray-600"}`}>
            {profile.segment}
          </span>
          <span
            className={`badge ${
              profile.status === "Active"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {profile.status}
          </span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted mb-1.5">
            Total Given
          </p>
          <p className="text-2xl font-bold text-brand-text tabular-nums">
            ${profile.total_given.toLocaleString()}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted mb-1.5">
            Total Gifts
          </p>
          <p className="text-2xl font-bold text-brand-text tabular-nums">
            {profile.gift_count}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted mb-1.5">
            Average Gift
          </p>
          <p className="text-2xl font-bold text-brand-text tabular-nums">
            ${Math.round(profile.avg_gift).toLocaleString()}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted mb-1.5">
            First Gift
          </p>
          <p className="text-xl font-bold text-brand-text tabular-nums">
            {profile.first_gift_date}
          </p>
        </div>
      </div>

      {/* Monthly gift chart */}
      {profile.gifts_by_month.length > 0 && (
        <div className="card p-5">
          <p className="text-sm font-semibold text-brand-text mb-4">Gift History by Month</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={profile.gifts_by_month}
              margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickFormatter={(v: number) =>
                  "$" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)
                }
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => ["$" + v.toLocaleString(), "Amount"]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                }}
              />
              <Bar dataKey="total" fill="#005f64" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Full gift history table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 text-sm font-semibold text-brand-text">
          Gift History · {profile.gift_count} {profile.gift_count === 1 ? "gift" : "gifts"}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface-offset/60">
              <tr>
                {["Date", "Amount", "Campaign", "Channel", "Region"].map(h => (
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
              {profile.gifts.map((g, i) => (
                <tr
                  key={i}
                  className="hover:bg-surface-offset/40 transition-colors border-b border-gray-50 last:border-0"
                >
                  <td className="py-2.5 px-4 text-brand-muted tabular-nums whitespace-nowrap">
                    {g.gift_date}
                  </td>
                  <td className="py-2.5 px-4 font-semibold tabular-nums text-brand-text">
                    ${g.gift_amount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-brand-muted">{g.campaign}</td>
                  <td className="py-2.5 px-4 text-brand-muted">{g.channel}</td>
                  <td className="py-2.5 px-4 text-brand-muted">{g.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
