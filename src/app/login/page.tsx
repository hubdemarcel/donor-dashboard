"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.ok) router.push("/dashboard");
    else setError("Invalid email or password.");
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-5 h-5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div className="font-semibold text-base tracking-tight text-brand-text">DonorIQ</div>
            <div className="text-xs text-brand-muted">Donor Intelligence Platform</div>
          </div>
        </div>
        <div className="card p-6">
          <h1 className="text-lg font-semibold text-brand-text mb-1">Sign in</h1>
          <p className="text-xs text-brand-muted mb-6">Access your donor performance dashboard</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1" htmlFor="email">Email</label>
              <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="vp@donoriq.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-brand-faint transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1" htmlFor="password">Password</label>
              <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-brand-faint transition" />
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-brand-muted mt-4">
          Demo: <span className="font-mono text-brand-text">vp@donoriq.com</span> / <span className="font-mono text-brand-text">demo1234</span>
        </p>
      </div>
    </div>
  );
}
