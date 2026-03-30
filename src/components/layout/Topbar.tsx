"use client";
import { signOut } from "next-auth/react";
import { Calendar, LogOut } from "lucide-react";

interface Props { user?: { name?: string | null; email?: string | null } | null }

export default function Topbar({ user }: Props) {
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div className="text-sm font-semibold text-brand-text">Donor Performance Overview</div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-brand-muted">
          <Calendar className="w-3.5 h-3.5" />
          Rolling 12 months
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-brand-muted hover:text-brand-text transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </header>
  );
}
