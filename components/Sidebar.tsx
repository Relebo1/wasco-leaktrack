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
    { label: "Dashboard",    href: "/manager/dashboard", icon: LayoutDashboard },
    { label: "Users",        href: "/admin/users",        icon: Users },
    { label: "Categories",   href: "/admin/categories",   icon: Tag },
    { label: "Settings",     href: "/admin/settings",     icon: Settings },
    { label: "Audit Log",    href: "/admin/audit",        icon: ClipboardList },
  ],
  WASCO_MANAGER: [
    { label: "Dashboard",  href: "/manager/dashboard", icon: LayoutDashboard },
    { label: "All Cases",  href: "/officer/reports",   icon: FileText },
  ],
  LEAKAGE_OFFICER: [
    { label: "Reports",       href: "/officer/reports",       icon: FileText },
    { label: "Notifications", href: "/officer/notifications", icon: Bell },
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

export default function Sidebar({ unread = 0 }: { unread?: number }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const role = (session?.user as { role?: string })?.role ?? "REPORTER";
  const items = NAV[role] ?? NAV.REPORTER;

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <Image src="/Logo.png" alt="WASCO" width={36} height={36} className="object-contain shrink-0" />
        <div>
          <p className="font-bold text-primary text-sm leading-none">WASCO</p>
          <p className="text-accent text-xs tracking-widest uppercase">Leak Track</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-800 truncate">{session?.user?.name}</p>
        <span className="inline-block mt-1 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {ROLE_LABEL[role] ?? role}
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {label === "Notifications" && unread > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Image src="/Logo.png" alt="WASCO" width={28} height={28} className="object-contain" />
          <span className="font-bold text-primary text-sm">WASCO Leak Track</span>
        </div>
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-64 bg-white h-full shadow-xl overflow-hidden">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-100 z-10"
            >
              <X size={18} />
            </button>
            {content}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-hidden">
        {content}
      </aside>
    </>
  );
}
