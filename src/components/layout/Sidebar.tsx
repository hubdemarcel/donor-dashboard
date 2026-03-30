"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, BarChart3, Download, Database, Map } from "lucide-react";

const navItems = [
  { label: "Overview",   href: "/dashboard",          icon: LayoutDashboard },
  { label: "Donors",     href: "/dashboard/donors",   icon: Users },
  { label: "Campaigns",  href: "/dashboard/campaigns",icon: BarChart3 },
  { label: "Regions",    href: "/dashboard/regions",  icon: Map },
  { label: "Upload CSV", href: "/dashboard/upload",   icon: Database },
  { label: "Export",     href: "/dashboard/export",   icon: Download },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col py-5 overflow-y-auto">
      {/* Logo */}
      <div className="px-4 pb-5 border-b border-gray-100 mb-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-4 h-4">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-brand-text tracking-tight">DonorIQ</div>
            <div className="text-[11px] text-brand-muted">Donor Intelligence</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="px-2 space-y-0.5 flex-1">
        <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-brand-faint">Analytics</p>
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors
                ${active
                  ? "bg-primary-light text-primary"
                  : "text-brand-muted hover:bg-surface-offset hover:text-brand-text"
                }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">SM</div>
          <div>
            <div className="text-xs font-medium text-brand-text">Sarah Mitchell</div>
            <div className="text-[11px] text-brand-muted">VP of Development</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
