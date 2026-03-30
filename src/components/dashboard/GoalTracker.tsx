"use client";
import { useEffect, useState } from "react";
import { Target, Edit2, Check, X } from "lucide-react";

interface Props {
  totalRaised: number;
}

export default function GoalTracker({ totalRaised }: Props) {
  const [goal, setGoal]       = useState(50000);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/goal");
        const text = await res.text();
        const data = JSON.parse(text);
        if (typeof data.goal === "number") setGoal(data.goal);
      } catch { /* keep default */ }
    }
    load();
  }, []);

  function startEdit() {
    setInputVal(String(goal));
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function saveGoal() {
    const parsed = Number(inputVal.replace(/[^0-9.]/g, ""));
    if (!parsed || parsed <= 0) return;
    setSaving(true);
    try {
      const res  = await fetch("/api/goal", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ goal: parsed }),
      });
      const text = await res.text();
      const data = JSON.parse(text);
      if (typeof data.goal === "number") setGoal(data.goal);
      setEditing(false);
    } catch { /* keep current goal */ }
    finally { setSaving(false); }
  }

  const pct              = Math.min((totalRaised / goal) * 100, 100);
  const monthsElapsed    = new Date().getMonth() + 1; // 1–12
  const monthlyRunRate   = monthsElapsed > 0 ? totalRaised / monthsElapsed : totalRaised;
  const projectedYearEnd = Math.round(monthlyRunRate * 12);
  const onTrack          = projectedYearEnd >= goal;

  return (
    <div className="card p-5 space-y-3">
      {/* Title + edit controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-sm font-semibold text-brand-text">Fundraising Goal</span>
            <p className="text-[11px] text-brand-faint mt-0.5">Your annual target vs. gifts received so far. Projection based on current monthly run rate.</p>
          </div>
        </div>

        {!editing ? (
          <button
            onClick={startEdit}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Edit2 className="w-3 h-3" /> Edit Goal
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-brand-muted">$</span>
            <input
              type="number"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter")  saveGoal();
                if (e.key === "Escape") cancelEdit();
              }}
              autoFocus
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-28 text-brand-text outline-none focus:border-primary"
            />
            <button
              onClick={saveGoal}
              disabled={saving}
              className="w-6 h-6 rounded-md bg-green-50 flex items-center justify-center text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={cancelEdit}
              className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center text-brand-muted hover:bg-gray-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <p className="text-xs text-brand-muted">
            <span className="font-semibold text-brand-text">
              ${totalRaised.toLocaleString()}
            </span>{" "}
            raised of{" "}
            <span className="font-medium text-brand-text">
              ${goal.toLocaleString()}
            </span>{" "}
            goal
          </p>
          <span className="text-xs font-semibold text-primary tabular-nums">
            {pct.toFixed(1)}%
          </span>
        </div>
        <div className="h-2.5 bg-surface-offset rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Projection */}
      <p className="text-[11px] text-brand-muted">
        Projected year-end:{" "}
        <span className="font-semibold text-brand-text">
          ${projectedYearEnd.toLocaleString()}
        </span>
        {onTrack ? (
          <span className="text-green-600 ml-1.5">· On track to exceed goal</span>
        ) : (
          <span className="text-amber-600 ml-1.5">
            · ${(goal - projectedYearEnd).toLocaleString()} short of goal
          </span>
        )}
      </p>
    </div>
  );
}
