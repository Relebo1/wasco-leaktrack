"use client";
export const dynamic = "force-dynamic";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Search, Filter, ArrowUpRight, AlertTriangle, ChevronLeft, ChevronRight,
} from "lucide-react";

type Report = {
  id: string; referenceNumber: string; status: string; category: string;
  address: string; createdAt: string; isHighPriority: boolean;
  submittedBy: { name: string } | null;
  assignments: { assignedTo: { name: string } }[];
};

const STATUS_BADGE: Record<string, string> = {
  SUBMITTED:    "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  ASSIGNED:     "bg-violet-100 text-violet-700",
  IN_PROGRESS:  "bg-orange-100 text-orange-700",
  RESOLVED:     "bg-emerald-100 text-emerald-700",
  CLOSED:       "bg-gray-100 text-gray-500",
};

const STATUSES = ["SUBMITTED","UNDER_REVIEW","ASSIGNED","IN_PROGRESS","RESOLVED","CLOSED"];
const PAGE_SIZE = 15;

export default function ManagerCasesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      const role = (session?.user as { role?: string })?.role ?? "";
      if (!["WASCO_MANAGER", "SYSTEM_ADMINISTRATOR"].includes(role)) router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.ok ? r.json() : []).then(setCategories);
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    if (filterCategory) params.set("category", filterCategory);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const res = await fetch(`/api/reports?${params}`);
    const data = await res.json();
    let rows: Report[] = Array.isArray(data) ? data : [];
    if (filterPriority === "high") rows = rows.filter(r => r.isHighPriority);
    if (filterPriority === "normal") rows = rows.filter(r => !r.isHighPriority);
    setReports(rows);
    setPage(1);
    setLoading(false);
  }, [search, filterStatus, filterCategory, filterPriority, dateFrom, dateTo]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const role = (session?.user as { role?: string })?.role ?? "";
    if (!["WASCO_MANAGER", "SYSTEM_ADMINISTRATOR"].includes(role)) return;
    fetchReports();
  }, [status, session, fetchReports]);

  const totalPages = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = reports.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (status === "loading" || loading)
    return <div className="min-h-screen flex items-center justify-center text-gray-400"><Loader2 size={22} className="animate-spin mr-2" />Loading…</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">All Cases</h1>
        <p className="text-sm text-gray-500 mt-1">View, filter and manage every reported leak.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input placeholder="Search ref, address, description…" className="flex-1 text-sm outline-none"
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchReports()} />
        </div>
        <Filter size={15} className="text-gray-400 shrink-0" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All Priority</option>
          <option value="high">High Priority</option>
          <option value="normal">Normal</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <button onClick={fetchReports} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Ref #</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Address</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Category</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Assigned To</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Date</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paged.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">No cases found.</td></tr>
            )}
            {paged.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 group">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{r.referenceNumber}</span>
                    {r.isHighPriority && <AlertTriangle size={13} className="text-red-500 shrink-0" />}
                  </div>
                </td>
                <td className="px-5 py-3 hidden md:table-cell text-gray-600 max-w-48 truncate">{r.address}</td>
                <td className="px-5 py-3 hidden lg:table-cell text-gray-500 text-xs capitalize">
                  {r.category.replace(/_/g, " ").toLowerCase()}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[r.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {r.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-5 py-3 hidden lg:table-cell text-xs text-gray-500">
                  {r.assignments[0]?.assignedTo.name ?? <span className="text-gray-300">Unassigned</span>}
                </td>
                <td className="px-5 py-3 hidden sm:table-cell text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/manager/cases/${r.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Manage <ArrowUpRight size={13} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50 text-sm text-gray-500">
          <span>
            {reports.length === 0 ? "0" : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, reports.length)}`} of {reports.length}
          </span>
          <div className="flex items-center gap-1">
            <button disabled={safePage === 1} onClick={() => setPage(safePage - 1)}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40">
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium border ${p === safePage ? "bg-primary text-white border-primary" : "border-gray-200 hover:bg-gray-100"}`}>
                {p}
              </button>
            ))}
            <button disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
