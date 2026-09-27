"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Bell, LogOut, Wrench, MapPin, Clock,
  CheckCircle2, AlertCircle, ChevronRight, Loader2,
} from "lucide-react";

type Report = {
  id: string; referenceNumber: string; status: string; category: string;
  address: string; description: string; createdAt: string;
  assignments: { notes: string | null; createdAt: string }[];
};

type Notification = {
  id: string; message: string; isRead: boolean; createdAt: string; reportId: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: "bg-purple-100 text-purple-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

export default function TechnicianCasesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      const role = (session?.user as { role?: string })?.role ?? "";
      if (role !== "FIELD_TECHNICIAN")
        router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const role = (session?.user as { role?: string })?.role ?? "";
    if (role !== "FIELD_TECHNICIAN") return;
    Promise.all([
      fetch("/api/reports").then(r => { if (!r.ok) throw new Error("reports"); return r.json(); }),
      fetch("/api/notifications").then(r => { if (!r.ok) throw new Error("notifications"); return r.json(); }),
    ]).then(([r, n]) => {
      setReports(Array.isArray(r) ? r : []);
      setNotifications(Array.isArray(n) ? n : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [status, session]);

  const unread = notifications.filter(n => !n.isRead).length;

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }

  async function markAllRead() {
    await Promise.all(notifications.filter(n => !n.isRead).map(n => markRead(n.id)));
  }

  const counts = {
    total: reports.length,
    assigned: reports.filter(r => r.status === "ASSIGNED").length,
    inProgress: reports.filter(r => r.status === "IN_PROGRESS").length,
    resolved: reports.filter(r => ["RESOLVED", "CLOSED"].includes(r.status)).length,
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <Loader2 size={24} className="animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <Image src="/Logo.png" alt="WASCO" width={36} height={36} className="object-contain" />
          <div>
            <p className="font-bold text-primary text-sm leading-none">WASCO</p>
            <p className="text-accent text-xs tracking-widest uppercase">Leak Track</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Field Technician</span>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(v => !v)}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Bell size={20} className="text-gray-600" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">Notifications</p>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">No notifications</p>
                  ) : notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markRead(n.id);
                        if (n.reportId) router.push(`/technician/cases/${n.reportId}`);
                      }}
                      className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-blue-50" : ""}`}
                    >
                      <p className={`text-xs leading-relaxed ${!n.isRead ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <span className="text-sm text-gray-600 hidden sm:block">{session?.user?.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">My Assigned Cases</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage all leak cases assigned to you.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Assigned", count: counts.total, color: "text-primary", icon: Wrench },
            { label: "New Assignments", count: counts.assigned, color: "text-purple-500", icon: AlertCircle },
            { label: "In Progress", count: counts.inProgress, color: "text-orange-500", icon: Clock },
            { label: "Resolved", count: counts.resolved, color: "text-accent", icon: CheckCircle2 },
          ].map(({ label, count, color, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-xs">{label}</p>
                <Icon size={16} className={color} />
              </div>
              <p className={`text-3xl font-extrabold ${color}`}>{count}</p>
            </div>
          ))}
        </div>

        {/* Cases list — US-021 */}
        {reports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Wrench size={40} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No cases assigned to you yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => (
              <div key={report.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-bold text-primary">{report.referenceNumber}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[report.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {report.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                      <MapPin size={14} className="text-primary shrink-0" />
                      <span className="truncate">{report.address}</span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{report.description}</p>
                    {report.assignments[0]?.notes && (
                      <p className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded">
                        Note: {report.assignments[0].notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-xs text-gray-400">{new Date(report.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500 capitalize">{report.category.replace(/_/g, " ").toLowerCase()}</p>
                    <Link
                      href={`/technician/cases/${report.id}`}
                      className="flex items-center gap-1 text-primary text-xs font-semibold hover:underline"
                    >
                      Open Case <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
