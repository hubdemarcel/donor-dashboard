"use client";
import { useState, useRef } from "react";
import { Upload, CheckCircle } from "lucide-react";

interface Props {
  onSuccess: () => void;
  compact?: boolean;
}

export default function CsvUploader({ onSuccess, compact }: Props) {
  const [stage, setStage]          = useState<"idle" | "preview" | "committed">("idle");
  const [loading, setLoading]      = useState(false);
  const [error, setError]          = useState("");
  const [preview, setPreview]      = useState<Record<string, unknown>[]>([]);
  const [validCount, setValid]     = useState(0);
  const [invalidCount, setInvalid] = useState(0);
  const [fileName, setFileName]    = useState("");
  const fileRef                    = useRef<File | null>(null);

  async function handleFile(file: File) {
    setError("");
    setFileName(file.name);
    fileRef.current = file;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("commit", "false");
    try {
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const text = await res.text();
      const data = JSON.parse(text);
      if (!res.ok) {
        setError(data.error || "Parse failed");
        setLoading(false);
        return;
      }
      setPreview(data.preview || []);
      setValid(data.validCount || 0);
      setInvalid(data.invalidCount || 0);
      setStage("preview");
    } catch (e) {
      setError("Parse error: " + String(e));
    }
    setLoading(false);
  }

  async function handleCommit() {
    if (!fileRef.current) return;
    setLoading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", fileRef.current);
    fd.append("commit", "true");
    try {
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const text = await res.text();
      const data = JSON.parse(text);
      if (!res.ok) {
        setError(data.error || "Commit failed");
        setLoading(false);
        return;
      }
      setStage("committed");
      setTimeout(() => onSuccess(), 500);
    } catch (e) {
      setError("Commit error: " + String(e));
    }
    setLoading(false);
  }

  /* ── Committed ─────────────────────────────────────────────────── */
  if (stage === "committed") {
    return (
      <div className="card p-4 flex items-center gap-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl">
        <CheckCircle className="w-5 h-5 shrink-0" />
        <span>Data loaded successfully! Loading dashboard…</span>
      </div>
    );
  }

  /* ── Preview ────────────────────────────────────────────────────── */
  if (stage === "preview") {
    return (
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="font-medium text-brand-text text-sm">{fileName}</p>
            <p className="text-xs text-brand-muted mt-0.5">
              <span className="text-green-600 font-medium">{validCount} valid rows</span>
              {invalidCount > 0 && (
                <span className="text-red-500 ml-2">{invalidCount} skipped</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStage("idle")}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleCommit}
              disabled={loading || validCount === 0}
              className="btn-primary text-xs disabled:opacity-50"
            >
              {loading ? "Loading…" : `Load ${validCount} rows`}
            </button>
          </div>
        </div>

        {preview.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="text-xs w-full">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(preview[0]).map(k => (
                    <th
                      key={k}
                      className="px-3 py-2 text-left font-medium text-brand-muted whitespace-nowrap"
                    >
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-3 py-1.5 text-brand-text whitespace-nowrap">
                        {String(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>
    );
  }

  /* ── Idle ───────────────────────────────────────────────────────── */
  return (
    <div className={compact ? "card p-3" : "card p-8"}>
      <label
        className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors ${
          compact ? "py-4" : "py-12"
        }`}
      >
        <input
          type="file"
          accept=".csv"
          className="sr-only"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {loading ? (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Upload
              className={`text-brand-muted ${compact ? "w-5 h-5 mb-1" : "w-8 h-8 mb-3"}`}
            />
            <p
              className={`font-medium text-brand-text text-center ${
                compact ? "text-xs" : "text-sm"
              }`}
            >
              Drop your CSV here or click to upload
            </p>
            {!compact && (
              <p className="text-xs text-brand-muted mt-1 text-center max-w-sm">
                Upload your gift history export. Each row should represent one gift — donor name, amount, date, campaign, channel, and region.
              </p>
            )}
          </>
        )}
      </label>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">{error}</p>
      )}
    </div>
  );
}
