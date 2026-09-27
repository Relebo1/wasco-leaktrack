"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Bell, LogOut, Search, Filter, ChevronRight,
  Droplets, Clock, CheckCircle2, AlertCircle, Loader2, UserCheck,
} from "lucide-react";

type Report = {
  id: string; referenceNumber: string; status: string; category: string;
  address: string; description: string; createdAt: string;
  submittedBy: { name: string; email: string } | null;
  _count: { investigationNotes: number };
};

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  ASSIGNED: "bg-purple-100 text-purple-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

const STATUSES = ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export default function OfficerReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/categories").then(r => r.ok ? r.json() : []).then(setCategories);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      const role = (session?.user as { role?: string })?.role ?? "";
      if (!["LEAKAGE_OFFICER", "WASCO_MANAGER", "SYSTEM_ADMINISTRATOR"].includes(role))
        router.push("/dashboard");
    }
  }, [status, session, router]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    if (filterCategory) params.set("category", filterCategory);
    if (filterLocation) params.set("location", filterLocation);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const res = await fetch(`/api/reports?${params}`);
    const data = await res.json();
    setReports(data);
    setLoading(false);
  }, [search, filterStatus, filterCategory, filterLocation, dateFrom, dateTo]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchReports();
    fetch("/api/notifications").then(r => r.json()).then(n => setUnread(n.filter((x: { isRead: boolean }) => !x.isRead).length));
  }, [status, fetchReports]);

  const counts = {
    total: reports.length,
    submitted: reports.filter(r => r.status === "SUBMITTED").length,
    inProgress: reports.filter(r => r.status === "IN_PROGRESS").length,
    resolved: reports.filter(r => ["RESOLVED", "CLOSED"].includes(r.status)).length,
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400"><Loader2 size={24} className="animate-spin mr-2" /> Loading…</div>;
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
          <Link href="/officer/reports" className="text-sm font-medium text-primary border-b-2 border-primary pb-0.5">Reports</Link>
          <div className="relative">
            <Link href="/officer/notifications" className="relative p-2 rounded-full hover:bg-gray-100 transition-colors inline-flex">
              <Bell size={20} className="text-gray-600" />
              {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unread}</span>}
            </Link>
          </div>
          <span className="text-sm text-gray-600 hidden sm:block">{session?.user?.name}</span>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">Leak Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Review, validate and manage all submitted reports.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", count: counts.total, color: "text-primary", icon: Droplets },
            { label: "New Submissions", count: counts.submitted, color: "text-blue-500", icon: AlertCircle },
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

        {/* Search & Filter — US-012 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1 border border-gray-300 rounded-lg px-3 py-2">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              placeholder="Search by reference, address or description…"
              className="flex-1 text-sm outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchReports()}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={16} className="text-gray-400 shrink-0" />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <input aria-label="Filter by location" placeholder="Location" value={filterLocation} onChange={e=>setFilterLocation(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input aria-label="Start date" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input aria-label="End date" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <button onClick={fetchReports} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
              Search
            </button>
          </div>
        </div>

        {/* Reports table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-6 text-xs font-semibold text-gray-500 uppercase px-6 py-3 border-b border-gray-100 bg-gray-50">
            <span>Ref #</span>
            <span className="col-span-2">Address</span>
            <span>Category</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {reports.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">No reports found.</div>
          ) : (
            reports.map(report => (
              <div key={report.id} className="grid grid-cols-6 items-center px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <span className="font-mono text-xs font-bold text-primary">{report.referenceNumber}</span>
                <span className="col-span-2 text-sm text-gray-700 truncate pr-4">{report.address}</span>
                <span className="text-xs text-gray-500 capitalize">{report.category.replace(/_/g, " ").toLowerCase()}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${STATUS_COLORS[report.status]}`}>
                  {report.status.replace(/_/g, " ")}
                </span>
                <Link href={`/officer/reports/${report.id}`} className="flex items-center gap-1 text-primary text-xs font-medium hover:underline">
                  <UserCheck size={14} /> Review <ChevronRight size={14} />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
