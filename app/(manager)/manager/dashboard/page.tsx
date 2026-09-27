"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, BarChart2, MapPin, Users,
  AlertTriangle, CheckCircle2, Clock, Droplets, ChevronRight,
} from "lucide-react";

type ReportRow = {
  id: string;
  referenceNumber: string;
  status: string;
  category: string;
  address: string;
  createdAt: string;
  isHighPriority: boolean;
  isVerified: boolean;
  assignments: { assignedTo: { id: string; name: string } }[];
};

type Technician = {
  id: string;
  name: string;
  _count: { assignedReports: number };
};

type Stats = {
  total: number;
  statusCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  locationCounts: Record<string, number>;
  highPriority: ReportRow[];
  pendingVerification: ReportRow[];
  technicians: Technician[];
  recentReports: ReportRow[];
};

type Notification = {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  reportId: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  ASSIGNED: "bg-purple-100 text-purple-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

const TABS = ["Overview", "By Location", "By Status", "High Priority", "Workload", "Verify"] as const;
type Tab = typeof TABS[number];

export default function ManagerDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      const role = (session?.user as { role?: string })?.role ?? "";
      if (!["WASCO_MANAGER", "SYSTEM_ADMINISTRATOR"].includes(role))
        router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const role = (session?.user as { role?: string })?.role ?? "";
    if (!["WASCO_MANAGER", "SYSTEM_ADMINISTRATOR"].includes(role)) return;

    Promise.all([
      fetch("/api/manager/stats").then(async (r) => {
        if (!r.ok) throw new Error(`stats ${r.status}`);
        return r.json();
      }),
      fetch("/api/notifications").then(async (r) => {
        if (!r.ok) return [];
        return r.json();
      }),
    ])
      .then(([s, n]) => {
        setStats(s);
        setNotifications(Array.isArray(n) ? n : []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [status, session]);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <Loader2 size={24} className="animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
        <p className="text-sm">Failed to load dashboard data.</p>
        <button
          onClick={() => { setError(false); setLoading(true); router.refresh(); }}
          className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  const topLocations = Object.entries(stats.locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const topCategories = Object.entries(stats.categoryCounts).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Management Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor operations, cases and leakage trends.</p>
  
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Cases", count: stats.total, color: "text-primary", icon: Droplets },
            {
              label: "Active",
              count:
                (stats.statusCounts["SUBMITTED"] ?? 0) +
                (stats.statusCounts["UNDER_REVIEW"] ?? 0) +
                (stats.statusCounts["ASSIGNED"] ?? 0) +
                (stats.statusCounts["IN_PROGRESS"] ?? 0),
              color: "text-orange-500",
              icon: Clock,
            },
            { label: "Pending Verify", count: stats.pendingVerification.length, color: "text-yellow-500", icon: AlertTriangle },
            { label: "Closed", count: stats.statusCounts["CLOSED"] ?? 0, color: "text-accent", icon: CheckCircle2 },
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

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-max px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "Overview" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 size={18} className="text-primary" />
                  <h2 className="font-semibold text-gray-800">Cases by Category</h2>
                </div>
                <div className="space-y-3">
                  {topCategories.map(([cat, count]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span className="capitalize">{cat.replace(/_/g, " ").toLowerCase()}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${stats.total ? (count / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {topCategories.length === 0 && <p className="text-xs text-gray-400">No data yet.</p>}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={18} className="text-primary" />
                  <h2 className="font-semibold text-gray-800">Cases by Status</h2>
                </div>
                <div className="space-y-3">
                  {Object.entries(stats.statusCounts).map(([s, count]) => (
                    <div key={s} className="flex items-center justify-between">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[s] ?? "bg-gray-100 text-gray-600"}`}>
                        {s.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-bold text-gray-700">{count}</span>
                    </div>
                  ))}
                  {Object.keys(stats.statusCounts).length === 0 && <p className="text-xs text-gray-400">No data yet.</p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Recent Cases</h2>
              </div>
              {stats.recentReports.length === 0 ? (
                <p className="text-sm text-gray-400 px-6 py-8 text-center">No cases yet.</p>
              ) : (
                stats.recentReports.slice(0, 8).map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-6 py-3 border-b border-gray-50 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-primary">{r.referenceNumber}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {r.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500 hidden sm:block truncate max-w-48">{r.address}</span>
                      <Link href={`/manager/cases/${r.id}`} className="text-primary hover:text-primary/80">
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* By Location */}
        {activeTab === "By Location" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <MapPin size={18} className="text-primary" />
              <h2 className="font-semibold text-gray-800">Cases by Location</h2>
            </div>
            <div className="space-y-4">
              {topLocations.map(([loc, count]) => (
                <div key={loc}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{loc}</span>
                    <span className="text-gray-500 font-semibold">{count} case{count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(count / (topLocations[0]?.[1] ?? 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {topLocations.length === 0 && <p className="text-sm text-gray-400">No location data available.</p>}
            </div>
          </div>
        )}

        {/* By Status */}
        {activeTab === "By Status" && (
          <div className="space-y-4">
            {Object.entries(stats.statusCounts).map(([s, count]) => {
              const cases = stats.recentReports.filter((r) => r.status === s);
              return (
                <div key={s} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[s] ?? "bg-gray-100 text-gray-600"}`}>
                      {s.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-bold text-gray-600">{count} total</span>
                  </div>
                  {cases.slice(0, 5).map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-6 py-3 border-b border-gray-50 hover:bg-gray-50">
                      <span className="font-mono text-xs font-bold text-primary">{r.referenceNumber}</span>
                      <span className="text-xs text-gray-500 truncate max-w-64 hidden sm:block">{r.address}</span>
                      <Link href={`/manager/cases/${r.id}`} className="text-primary hover:text-primary/80">
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  ))}
                </div>
              );
            })}
            {Object.keys(stats.statusCounts).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No cases yet.</p>
            )}
          </div>
        )}

        {/* High Priority */}
        {activeTab === "High Priority" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
              <AlertTriangle size={18} className="text-orange-500" />
              <h2 className="font-semibold text-gray-800">High Priority Cases</h2>
            </div>
            {stats.highPriority.length === 0 ? (
              <p className="text-sm text-gray-400 px-6 py-8 text-center">No high priority cases.</p>
            ) : (
              stats.highPriority.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-6 py-4 border-b border-gray-50 hover:bg-gray-50">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-primary">{r.referenceNumber}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {r.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{r.address}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(r.createdAt).toLocaleDateString()} ·{" "}
                      <span className="capitalize">{r.category.replace(/_/g, " ").toLowerCase()}</span>
                    </p>
                  </div>
                  <Link href={`/manager/cases/${r.id}`} className="flex items-center gap-1 text-primary text-xs font-medium hover:underline">
                    View <ChevronRight size={14} />
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {/* Workload */}
        {activeTab === "Workload" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Users size={18} className="text-primary" />
              <h2 className="font-semibold text-gray-800">Technician Workload</h2>
            </div>
            {stats.technicians.length === 0 ? (
              <p className="text-sm text-gray-400">No technicians found.</p>
            ) : (
              <div className="space-y-4">
                {[...stats.technicians]
                  .sort((a, b) => b._count.assignedReports - a._count.assignedReports)
                  .map((t) => (
                    <div key={t.id} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary text-xs font-bold">{t.name[0]}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{t.name}</span>
                          <span className="text-gray-500">{t._count.assignedReports} case{t._count.assignedReports !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full"
                            style={{ width: `${Math.min((t._count.assignedReports / 10) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Verify */}
        {activeTab === "Verify" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
              <CheckCircle2 size={18} className="text-green-500" />
              <h2 className="font-semibold text-gray-800">Pending Resolution Verification</h2>
              <span className="ml-auto text-xs text-gray-400">
                {stats.pendingVerification.length} case{stats.pendingVerification.length !== 1 ? "s" : ""}
              </span>
            </div>
            {stats.pendingVerification.length === 0 ? (
              <p className="text-sm text-gray-400 px-6 py-8 text-center">No cases pending verification.</p>
            ) : (
              stats.pendingVerification.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-6 py-4 border-b border-gray-50 hover:bg-gray-50">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-primary">{r.referenceNumber}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">RESOLVED</span>
                    </div>
                    <p className="text-xs text-gray-500">{r.address}</p>
                    {r.assignments[0] && (
                      <p className="text-xs text-gray-400 mt-0.5">Technician: {r.assignments[0].assignedTo.name}</p>
                    )}
                  </div>
                  <Link
                    href={`/manager/cases/${r.id}`}
                    className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90"
                  >
                    Verify
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
    </div>
  );
}
