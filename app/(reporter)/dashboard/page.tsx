"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2, Clock, AlertCircle, Droplets,
  Camera, Plus, Loader2,
} from "lucide-react";

type Report = {
  id: string; referenceNumber: string; status: string;
  category: string; address: string; description: string; createdAt: string;
  photos: { url: string }[];
};

type Notification = { id: string; message: string; isRead: boolean; createdAt: string };

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  ASSIGNED: "bg-purple-100 text-purple-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Submitted", UNDER_REVIEW: "Under Review", ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress", RESOLVED: "Resolved", CLOSED: "Closed",
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      const role = (session?.user as { role?: string })?.role;
      const destination: Record<string, string> = {
        SYSTEM_ADMINISTRATOR: "/manager/dashboard",
        WASCO_MANAGER: "/manager/dashboard",
        LEAKAGE_OFFICER: "/officer/reports",
        FIELD_TECHNICIAN: "/technician/cases",
      };
      if (role && destination[role]) router.replace(destination[role]);
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/reports").then(r => r.json()),
    ]).then(([r]) => {
      setReports(r);
      setLoading(false);
    });
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <Loader2 size={24} className="animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
        {/* Success banner */}
        {params.get("submitted") && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-5 py-4 mb-6 text-sm flex items-center gap-2">
            <CheckCircle2 size={16} />
            Report <strong>{params.get("submitted")}</strong> submitted successfully. We will keep you updated.
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary">My Reports</h1>
            <p className="text-gray-500 text-sm mt-1">Track the status of your submitted leak reports.</p>
          </div>
          <Link
            href="/report/new"
            className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus size={16} /> Report a Leak
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", count: reports.length, color: "text-primary", icon: Droplets },
            { label: "In Progress", count: reports.filter(r => r.status === "IN_PROGRESS").length, color: "text-orange-500", icon: Clock },
            { label: "Resolved", count: reports.filter(r => r.status === "RESOLVED" || r.status === "CLOSED").length, color: "text-accent", icon: CheckCircle2 },
            { label: "Pending", count: reports.filter(r => ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED"].includes(r.status)).length, color: "text-yellow-500", icon: AlertCircle },
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

        {/* Reports list */}
        {reports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Droplets size={40} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">You haven&apos;t submitted any reports yet.</p>
            <Link href="/report/new" className="inline-flex items-center gap-2 mt-4 bg-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:opacity-90">
              <Plus size={16} /> Report a Leak
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => (
              <div key={report.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Link href={`/report/${report.id}`} className="font-mono text-sm font-bold text-primary hover:underline">{report.referenceNumber}</Link>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[report.status]}`}>
                        {STATUS_LABEL[report.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium truncate">{report.address}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{report.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{new Date(report.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500 mt-1 capitalize">{report.category.replace(/_/g, " ").toLowerCase()}</p>
                    {report.photos.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center justify-end gap-1">
                        <Camera size={12} /> {report.photos.length} photo(s)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
