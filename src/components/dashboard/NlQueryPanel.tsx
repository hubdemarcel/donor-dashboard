"use client";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Send } from "lucide-react";

const SUGGESTIONS = [
  "Which campaign had the highest average gift last quarter?",
  "Show me lapsed donors from the Major Gifts segment",
  "What\'s our best performing channel by total raised?",
  "What is our retention rate?",
];

export default function NlQueryPanel() {
  const [input, setInput]     = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [asked, setAsked]     = useState("");
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (responseRef.current) responseRef.current.scrollTop = responseRef.current.scrollHeight;
  }, [response]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setAsked(question);
    setResponse("");
    setLoading(true);
    setInput("");

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) { setResponse("Error: " + (await res.text())); setLoading(false); return; }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setResponse(full);
      }
    } catch (e) {
      setResponse("Network error. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="card flex flex-col overflow-hidden" style={{ maxHeight: "480px" }}>
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-gray-100">
        <div className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold text-brand-text">Natural Language Query</div>
          <div className="text-[11px] text-brand-muted">Ask anything about your donors in plain English. Answers come from your data, not guesswork.</div>
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden p-4 gap-3">
        {/* Suggestions */}
        {!asked && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-faint">Try asking</p>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => ask(s)}
                className="w-full text-left flex items-start gap-2 px-3 py-2 bg-surface-offset rounded-lg text-xs text-brand-muted hover:bg-primary-light hover:text-primary transition-colors">
                <span className="mt-0.5">→</span>{s}
              </button>
            ))}
          </div>
        )}

        {/* Response area */}
        {asked && (
          <div className="flex-1 overflow-y-auto space-y-3" ref={responseRef}>
            <div className="text-xs font-medium text-brand-text bg-surface-offset rounded-lg px-3 py-2">{asked}</div>
            {(response || loading) && (
              <div className="text-xs text-brand-text leading-relaxed border-l-2 border-primary pl-3 bg-primary-light/30 rounded-r-lg py-2 pr-3">
                {response}
                {loading && <span className="inline-block w-1.5 h-3.5 bg-primary ml-0.5 animate-pulse rounded-sm" />}
              </div>
            )}
            <button onClick={() => { setAsked(""); setResponse(""); }}
              className="text-[11px] text-brand-muted hover:text-primary transition-colors">
              ← Ask another question
            </button>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && ask(input)}
            placeholder="Type a question…"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-brand-text
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                       placeholder:text-brand-faint transition"
          />
          <button onClick={() => ask(input)} disabled={loading || !input.trim()}
            className="btn-primary px-3 py-2">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
