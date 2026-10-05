"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard, Users, FileText, Wrench, Bell,
  Settings, Tag, ClipboardList, LogOut, Menu, X, Plus,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: React.ElementType };

const NAV: Record<string, NavItem[]> = {
  SYSTEM_ADMINISTRATOR: [
    { label: "Dashboard",  href: "/manager/dashboard", icon: LayoutDashboard },
    { label: "Users",      href: "/admin/users",        icon: Users },
    { label: "Categories", href: "/admin/categories",   icon: Tag },
    { label: "Settings",   href: "/admin/settings",     icon: Settings },
    { label: "Audit Log",  href: "/admin/audit",        icon: ClipboardList },
  ],
  WASCO_MANAGER: [
    { label: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
    { label: "All Cases", href: "/manager/cases",     icon: FileText },
  ],
  LEAKAGE_OFFICER: [
    { label: "Reports",       href: "/officer/reports",        icon: FileText },
    { label: "Notifications", href: "/officer/notifications",  icon: Bell },
  ],
  FIELD_TECHNICIAN: [
    { label: "My Cases", href: "/technician/cases", icon: Wrench },
  ],
  REPORTER: [
    { label: "My Reports",    href: "/dashboard",  icon: FileText },
    { label: "Report a Leak", href: "/report/new", icon: Plus },
  ],
};

const ROLE_LABEL: Record<string, string> = {
  SYSTEM_ADMINISTRATOR: "Administrator",
  WASCO_MANAGER:        "Manager",
  LEAKAGE_OFFICER:      "Leakage Officer",
  FIELD_TECHNICIAN:     "Field Technician",
  REPORTER:             "Reporter",
};

function initials(name?: string | null) {
  if (!name?.trim()) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function NavLink({ item, active, unread, onClick }: {
  item: NavItem; active: boolean; unread?: number; onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-accent text-white"
          : "text-white/60 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon size={17} strokeWidth={active ? 2 : 1.75} />
      <span className="flex-1">{item.label}</span>
      {item.label === "Notifications" && unread! > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unread! > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

function SidebarContent({ onClose, unread }: { onClose?: () => void; unread: number }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const role = (session?.user as { role?: string })?.role ?? "REPORTER";
  const items = NAV[role] ?? NAV.REPORTER;
  const name = session?.user?.name || "User";

  return (
    <div className="flex h-full flex-col bg-primary">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
          <Image src="/Logo.png" alt="WASCO" width={28} height={28} className="object-contain" priority />
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-white">WASCO</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
            Leak Track
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/35">
          Menu
        </p>
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
            unread={item.label === "Notifications" ? unread : 0}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* User / sign-out */}
      <div className="px-3 py-3 border-t border-white/10 space-y-0.5">
        <Link
          href="/profile"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-white/10 group"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white text-xs font-bold">
            {initials(name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <p className="truncate text-[10px] text-white/40">{ROLE_LABEL[role] ?? role}</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 transition-colors hover:bg-red-500/15 hover:text-red-300"
        >
          <LogOut size={17} strokeWidth={1.75} />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ unread = 0 }: { unread?: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile topbar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-primary px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white">
            <Image src="/Logo.png" alt="WASCO" width={24} height={24} className="object-contain" />
          </div>
          <p className="text-sm font-bold text-white">WASCO <span className="font-normal text-white/40">Leak Track</span></p>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <aside className="relative flex h-full w-[min(280px,85vw)] flex-col shadow-xl animate-in slide-in-from-left duration-200">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={16} />
            </button>
            <SidebarContent onClose={() => setOpen(false)} unread={unread} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col lg:flex">
        <SidebarContent unread={unread} />
      </aside>
    </>
  );
}
