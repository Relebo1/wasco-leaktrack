"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, MapPin, Users, AlertTriangle, CheckCircle2,
  Clock, Droplets, TrendingUp, ArrowUpRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

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

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED:    "#3b82f6",
  UNDER_REVIEW: "#f59e0b",
  ASSIGNED:     "#8b5cf6",
  IN_PROGRESS:  "#f97316",
  RESOLVED:     "#10b981",
  CLOSED:       "#9ca3af",
};

const STATUS_BADGE: Record<string, string> = {
  SUBMITTED:    "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  ASSIGNED:     "bg-violet-100 text-violet-700",
  IN_PROGRESS:  "bg-orange-100 text-orange-700",
  RESOLVED:     "bg-emerald-100 text-emerald-700",
  CLOSED:       "bg-gray-100 text-gray-500",
};

const SECTION_TABS = ["High Priority", "Workload", "Verify"] as const;
type SectionTab = typeof SECTION_TABS[number];

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md ${STATUS_BADGE[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function KpiCard({ label, value, sub, barColor, icon: Icon }: {
  label: string; value: string | number; sub: string; barColor: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden flex items-center gap-4">
      <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl" style={{ background: barColor }} />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: barColor + "18" }}>
        <Icon size={18} style={{ color: barColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider leading-none mb-1">{label}</p>
        <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
        <p className="text-[11px] text-gray-400 mt-1 truncate">{sub}</p>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; fill: string }[] }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700">{payload[0].name}</p>
      <p className="text-gray-500 mt-0.5">{payload[0].value} case{payload[0].value !== 1 ? "s" : ""}</p>
    </div>
  );
};

export default function ManagerDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionTab>("High Priority");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      const role = (session?.user as { role?: string })?.role ?? "";
      if (!["WASCO_MANAGER", "SYSTEM_ADMINISTRATOR"].includes(role)) router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const role = (session?.user as { role?: string })?.role ?? "";
    if (!["WASCO_MANAGER", "SYSTEM_ADMINISTRATOR"].includes(role)) return;
    fetch("/api/manager/stats")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(s => { setStats(s); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [status, session]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <Loader2 size={22} className="animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
        <p className="text-sm">Failed to load dashboard data.</p>
        <button onClick={() => { setError(false); setLoading(true); router.refresh(); }}
          className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90">
          Retry
        </button>
      </div>
    );
  }

  const activeCount =
    (stats.statusCounts["SUBMITTED"] ?? 0) +
    (stats.statusCounts["UNDER_REVIEW"] ?? 0) +
    (stats.statusCounts["ASSIGNED"] ?? 0) +
    (stats.statusCounts["IN_PROGRESS"] ?? 0);
  const resolvedCount = stats.statusCounts["RESOLVED"] ?? 0;
  const resolutionRate = stats.total ? Math.round((resolvedCount / stats.total) * 100) : 0;

  const pieData = Object.entries(stats.statusCounts).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  const barData = Object.entries(stats.categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name: name.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()), value }));
  const topLocations = Object.entries(stats.locationCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const userName = (session?.user as { name?: string })?.name?.split(" ")[0] ?? "Manager";

  return (
    <div className="min-h-screen bg-[#f5f6fa]">

      {/* Header */}
      <div className="bg-primary px-8 pt-8 pb-20">
        <div className="max-w-7xl mx-auto flex items-end justify-between">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Welcome back, {userName}</p>
            <h1 className="text-3xl font-black text-white tracking-tight">Operations Dashboard</h1>
          </div>
          <p className="text-blue-200/70 text-xs hidden sm:block">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 -mt-12 pb-16 space-y-6">

        {/* KPI row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard label="Total Cases"     value={stats.total}                        sub="All time"           barColor="#004CA0" icon={Droplets} />
          <KpiCard label="Active"          value={activeCount}                        sub="In pipeline"        barColor="#f97316" icon={Clock} />
          <KpiCard label="Pending Verify"  value={stats.pendingVerification.length}   sub="Awaiting sign-off"  barColor="#f59e0b" icon={AlertTriangle} />
          <KpiCard label="Resolution Rate" value={`${resolutionRate}%`}               sub={`${resolvedCount} resolved`} barColor="#36B34A" icon={TrendingUp} />
        </div>

        {/* ── Main grid: charts left, sidebar right ── */}
        <div className="grid xl:grid-cols-[1fr_320px] gap-6 items-start">

          {/* Left column */}
          <div className="space-y-6">

            {/* Bar chart — cases by category */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-6">Cases by Category</p>
              {barData.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f6fa" }} />
                    <Bar dataKey="value" name="Cases" radius={[6, 6, 0, 0]} fill="#004CA0" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Recent cases table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Recent Cases</p>
                <span className="text-xs text-gray-400">{Math.min(stats.recentReports.length, 10)} of {stats.total}</span>
              </div>
              {stats.recentReports.length === 0 ? (
                <p className="text-sm text-gray-400 px-6 py-10 text-center">No cases yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Ref", "Address", "Status", "Date", ""].map((h, i) => (
                        <th key={i} className={`text-left px-${i === 0 ? 6 : 4} py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider ${i === 1 ? "hidden md:table-cell" : ""} ${i === 3 ? "hidden sm:table-cell" : ""}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats.recentReports.slice(0, 10).map(r => (
                      <tr key={r.id} className="hover:bg-gray-50/70 transition-colors group">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary">{r.referenceNumber}</span>
                            {r.isHighPriority && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">HIGH</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="text-xs text-gray-500 truncate max-w-52 block">{r.address}</span>
                        </td>
                        <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                        <td className="px-4 py-3.5 hidden sm:table-cell text-xs text-gray-400">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link href={`/manager/cases/${r.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            View <ArrowUpRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">

            {/* Donut — status breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Status Breakdown</p>
              {pieData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No data yet.</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={78}
                        dataKey="value" paddingAngle={2} strokeWidth={0}>
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={STATUS_COLOR[entry.name.replace(/ /g, "_")] ?? "#9ca3af"} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {pieData.map(({ name, value }) => (
                      <div key={name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLOR[name.replace(/ /g, "_")] ?? "#9ca3af" }} />
                          <span className="text-xs text-gray-500">{name}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Top locations */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <MapPin size={12} className="text-primary" /> Top Locations
              </p>
              {topLocations.length === 0 ? (
                <p className="text-sm text-gray-400">No data yet.</p>
              ) : (
                <div className="space-y-3.5">
                  {topLocations.map(([loc, count], i) => (
                    <div key={loc} className="flex items-center gap-3">
                      <span className="text-[11px] font-black text-gray-300 w-4 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600 truncate">{loc}</span>
                          <span className="text-xs font-bold text-gray-700 ml-2 shrink-0">{count}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full"
                            style={{ width: `${(count / (topLocations[0]?.[1] ?? 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section tabs: High Priority / Workload / Verify */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100">
                {SECTION_TABS.map(tab => (
                  <button key={tab} onClick={() => setActiveSection(tab)}
                    className={`flex-1 py-3 text-[11px] font-semibold transition-colors relative ${
                      activeSection === tab ? "text-primary" : "text-gray-400 hover:text-gray-600"
                    }`}>
                    {tab === "High Priority" ? "Priority" : tab}
                    {tab === "High Priority" && stats.highPriority.length > 0 && (
                      <span className="ml-1 text-[10px] bg-red-100 text-red-500 font-bold px-1.5 py-0.5 rounded-full">{stats.highPriority.length}</span>
                    )}
                    {tab === "Verify" && stats.pendingVerification.length > 0 && (
                      <span className="ml-1 text-[10px] bg-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded-full">{stats.pendingVerification.length}</span>
                    )}
                    {activeSection === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                  </button>
                ))}
              </div>

              {/* High Priority */}
              {activeSection === "High Priority" && (
                <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                  {stats.highPriority.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-gray-300">
                      <CheckCircle2 size={28} className="mb-2" />
                      <p className="text-xs">No high priority cases</p>
                    </div>
                  ) : stats.highPriority.map(r => (
                    <Link key={r.id} href={`/manager/cases/${r.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 group">
                      <div className="min-w-0 mr-3">
                        <p className="font-mono text-xs font-bold text-primary truncate">{r.referenceNumber}</p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{r.address}</p>
                      </div>
                      <ArrowUpRight size={13} className="text-gray-300 group-hover:text-primary shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
              )}

              {/* Workload */}
              {activeSection === "Workload" && (
                <div className="p-4 space-y-4 max-h-72 overflow-y-auto">
                  {stats.technicians.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">No technicians found.</p>
                  ) : [...stats.technicians]
                    .sort((a, b) => b._count.assignedReports - a._count.assignedReports)
                    .map(t => {
                      const max = Math.max(...stats.technicians.map(x => x._count.assignedReports), 1);
                      const pct = Math.round((t._count.assignedReports / max) * 100);
                      const c = t._count.assignedReports >= 8 ? "#ef4444" : t._count.assignedReports >= 4 ? "#f59e0b" : "#36B34A";
                      return (
                        <div key={t.id} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-primary text-[10px] font-black">{t.name[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-medium text-gray-600 truncate">{t.name}</span>
                              <span className="text-[11px] font-bold ml-2 shrink-0" style={{ color: c }}>{t._count.assignedReports}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Verify */}
              {activeSection === "Verify" && (
                <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                  {stats.pendingVerification.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-gray-300">
                      <CheckCircle2 size={28} className="mb-2" />
                      <p className="text-xs">All resolutions verified</p>
                    </div>
                  ) : stats.pendingVerification.map(r => (
                    <div key={r.id} className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0 mr-3">
                        <p className="font-mono text-xs font-bold text-primary truncate">{r.referenceNumber}</p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{r.address}</p>
                      </div>
                      <Link href={`/manager/cases/${r.id}`}
                        className="shrink-0 bg-primary text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:opacity-90">
                        Verify
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
