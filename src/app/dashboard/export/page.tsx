"use client";
import { useEffect, useState } from "react";
import { Download, FileText, Users, DollarSign } from "lucide-react";
import type { KpiData } from "@/types";

export default function ExportPage() {
  const [kpis, setKpis]         = useState<KpiData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [empty, setEmpty]       = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/metrics");
        const text = await res.text();
        const data = JSON.parse(text);
        if (data.empty) { setEmpty(true); } else { setKpis(data); }
      } catch {
        setEmpty(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleExport() {
    setDownloading(true);
    try {
      const res  = await fetch("/api/export");
      if (!res.ok) {
        const text = await res.text();
        const data = JSON.parse(text);
        alert(data.error || "Export failed");
        return;
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "donor_gift_history_export.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <h1 className="text-base font-semibold text-brand-text">Export Data</h1>
        <p className="text-xs text-brand-muted mt-1">Download your full donor gift history as a CSV file.</p>
      </div>

      {/* Summary cards */}
      {kpis && !empty && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-brand-muted">Total Raised</p>
              <p className="text-sm font-semibold text-brand-text tabular-nums">${kpis.totalRaised.toLocaleString()}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-green-700" />
            </div>
            <div>
              <p className="text-[11px] text-brand-muted">Donors</p>
              <p className="text-sm font-semibold text-brand-text tabular-nums">{kpis.donorCount.toLocaleString()}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <p className="text-[11px] text-brand-muted">Campaigns</p>
              <p className="text-sm font-semibold text-brand-text tabular-nums">{kpis.byCampaign.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Export card */}
      <div className="card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-offset flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-brand-muted" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-text">Full Gift History</p>
            <p className="text-xs text-brand-muted mt-0.5">
              All gift rows — every donor, date, amount, campaign, channel, and region.
              Columns: donor_id, donor_name, segment, gift_date, gift_amount, campaign, channel, region.
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={downloading || empty}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {downloading ? "Preparing download…" : "Download CSV"}
        </button>
        {empty && (
          <p className="text-xs text-center text-brand-muted">
            No data to export. <a href="/dashboard/upload" className="text-primary underline">Upload a CSV</a> first.
          </p>
        )}
      </div>
    </div>
  );
}
