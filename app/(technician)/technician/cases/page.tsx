"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wrench, MapPin, Clock,
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

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
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
    <div className="p-6 max-w-5xl mx-auto">
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
  );
}
