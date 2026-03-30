"use client";
import { useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import type { TimeSeriesPoint } from "@/types";

const fmt = (v: number) => "$" + (v >= 1000 ? (v / 1000).toFixed(0) + "K" : v);

interface Props { data: TimeSeriesPoint[] }

export default function GiftsOverTimeChart({ data }: Props) {
  const [view, setView] = useState<"monthly" | "quarterly">("quarterly");

  const quarterlyData = (() => {
    const map = new Map<string, number>();
    data.forEach(d => {
      const [y, m] = d.month.split("-").map(Number);
      const q = `Q${Math.ceil(m / 3)} ${y}`;
      map.set(q, (map.get(q) || 0) + d.total);
    });
    return [...map.entries()].map(([month, total]) => ({ month, total }));
  })();

  const displayData = view === "monthly" ? data : quarterlyData;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-brand-text">Gifts Over Time</div>
          <div className="text-xs text-brand-muted mt-0.5">Monthly total raised — rolling 12 months</div>
        </div>
        <div className="flex gap-1">
          {(["monthly", "quarterly"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors
                ${view === v ? "bg-primary-light text-primary" : "text-brand-muted hover:bg-surface-offset"}`}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        {view === "quarterly" ? (
          <BarChart data={displayData} barSize={40}>
            <CartesianGrid vertical={false} stroke="#f0efeb" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#72716b" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "#72716b" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => ["$" + v.toLocaleString(), "Total Raised"]} cursor={{ fill: "#f5f4f0" }} />
            <Bar dataKey="total" fill="#005f64" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={displayData}>
            <CartesianGrid vertical={false} stroke="#f0efeb" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#72716b" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "#72716b" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => ["$" + v.toLocaleString(), "Total Raised"]} />
            <Line type="monotone" dataKey="total" stroke="#005f64" strokeWidth={2} dot={{ r: 4, fill: "#005f64" }} activeDot={{ r: 6 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
