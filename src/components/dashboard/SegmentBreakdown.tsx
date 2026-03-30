"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { BreakdownItem } from "@/types";

const COLORS = ["#005f64","#4a9ba6","#b88a00","#3d6e1d","#92420f"];
const SEGMENT_COLORS: Record<string, string> = {
  "Major Gifts": "bg-amber-100 text-amber-800",
  "Mid-Level":   "bg-primary-light text-primary",
  "Annual Fund": "bg-green-50 text-green-700",
  "New Donor":   "bg-orange-50 text-orange-700",
};

interface Props { segments: BreakdownItem[]; channels: BreakdownItem[] }

export default function SegmentBreakdown({ segments, channels }: Props) {
  const max = Math.max(...segments.map(s => s.total), 1);
  return (
    <div className="card p-5 flex flex-col gap-5 h-full">
      {/* Segment bars */}
      <div>
        <div className="text-sm font-semibold text-brand-text">Segment Performance</div>
        <p className="text-[11px] text-brand-faint mt-0.5 mb-3">How much each donor tier contributed in the last 12 months.</p>
        <div className="space-y-3">
          {segments.map((s, i) => (
            <div key={s.label}>
              <div className="flex justify-between items-baseline mb-1">
                <span className={`badge text-[11px] ${SEGMENT_COLORS[s.label] || "bg-gray-100 text-gray-600"}`}>{s.label}</span>
                <span className="text-xs text-brand-muted tabular-nums">${s.total.toLocaleString()}</span>
              </div>
              <div className="h-1.5 bg-surface-offset rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(s.total / max) * 100}%`, background: COLORS[i % COLORS.length] }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Channel donut */}
      <div>
        <div className="text-sm font-semibold text-brand-text">By Channel</div>
        <p className="text-[11px] text-brand-faint mt-0.5 mb-2">Which outreach method — email, mail, web, phone — drove the most gifts.</p>
        <div className="grid grid-cols-2 gap-2 items-center">
          <ResponsiveContainer width="100%" height={100}>
            <PieChart>
              <Pie data={channels} cx="50%" cy="50%" innerRadius={28} outerRadius={44} dataKey="total" paddingAngle={2}>
                {channels.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => "$" + v.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5">
            {channels.map((c, i) => (
              <div key={c.label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-[11px] text-brand-muted">{c.label} · {c.pct.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
