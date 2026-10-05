"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2, Clock, AlertCircle, Droplets,
  Camera, Plus, Loader2, ChevronRight, MapPin, Calendar,
} from "lucide-react";

type Report = {
  id: string; referenceNumber: string; status: string;
  category: string; address: string; description: string; createdAt: string;
  photos: { url: string }[];
};

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED:    "bg-red-50 text-red-600 border border-red-100",
  UNDER_REVIEW: "bg-red-50 text-red-600 border border-red-100",
  ASSIGNED:     "bg-red-50 text-red-600 border border-red-100",
  IN_PROGRESS:  "bg-orange-50 text-orange-600 border border-orange-100",
  RESOLVED:     "bg-green-50 text-green-600 border border-green-100",
  CLOSED:       "bg-green-50 text-green-600 border border-green-100",
};

const STATUS_DOT: Record<string, string> = {
  SUBMITTED:    "bg-red-500",
  UNDER_REVIEW: "bg-red-500",
  ASSIGNED:     "bg-red-500",
  IN_PROGRESS:  "bg-orange-500",
  RESOLVED:     "bg-green-500",
  CLOSED:       "bg-green-500",
};

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Not Attended", UNDER_REVIEW: "Not Attended", ASSIGNED: "Not Attended",
  IN_PROGRESS: "In Progress", RESOLVED: "Completed", CLOSED: "Completed",
};

const STATUS_BAR: Record<string, string> = {
  SUBMITTED:    "bg-red-500",
  UNDER_REVIEW: "bg-red-500",
  ASSIGNED:     "bg-red-500",
  IN_PROGRESS:  "bg-orange-500",
  RESOLVED:     "bg-green-500",
  CLOSED:       "bg-green-500",
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;

    const role = (session?.user as { role?: string })?.role;
    const destination: Record<string, string> = {
      SYSTEM_ADMINISTRATOR: "/manager/dashboard",
      WASCO_MANAGER: "/manager/dashboard",
      LEAKAGE_OFFICER: "/officer/reports",
      FIELD_TECHNICIAN: "/technician/cases",
    };
    if (role && destination[role]) { router.replace(destination[role]); return; }

    // Only fetch for REPORTER role
    fetch("/api/reports", { cache: "no-store" })
      .then(async r => {
        const data = await r.json();
        if (!r.ok) { setFetchError(data.error ?? "Failed to load reports."); setLoading(false); return; }
        setReports(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => { setFetchError("Network error. Please refresh."); setLoading(false); });
  }, [status, session, router]);

  if (status === "loading" || (loading && !fetchError)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm text-gray-400">Loading your reports…</p>
        </div>
      </div>
    );
  }

  const notAttended = reports.filter(r => ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED"].includes(r.status)).length;
  const inProgress  = reports.filter(r => r.status === "IN_PROGRESS").length;
  const completed   = reports.filter(r => ["RESOLVED", "CLOSED"].includes(r.status)).length;

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* Page hero */}
      <div className="bg-primary px-6 pt-8 pb-16">
        <div className="max-w-4xl mx-auto">
          {params.get("submitted") && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-white backdrop-blur-sm">
              <CheckCircle2 size={15} className="shrink-0 text-green-300" />
              Report <strong className="font-semibold">{params.get("submitted")}</strong> submitted — we&apos;ll keep you updated.
            </div>
          )}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">Reporter Dashboard</p>
              <h1 className="text-2xl font-bold text-white">My Reports</h1>
              <p className="text-white/60 text-sm mt-1">Track every leak you&apos;ve reported in real time.</p>
            </div>
            <Link
              href="/report/new"
              className="flex items-center gap-2 bg-white text-primary px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-white/90 transition-colors shrink-0"
            >
              <Plus size={15} /> Report a Leak
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8">
        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Not Attended", count: notAttended, dot: "bg-red-500",    icon: AlertCircle,  text: "text-red-600",    bg: "bg-red-50" },
            { label: "In Progress",  count: inProgress,  dot: "bg-orange-500", icon: Clock,        text: "text-orange-600", bg: "bg-orange-50" },
            { label: "Completed",    count: completed,   dot: "bg-green-500",  icon: CheckCircle2, text: "text-green-600",  bg: "bg-green-50" },
          ].map(({ label, count, dot, icon: Icon, text, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${bg} mb-3`}>
                <Icon size={16} className={text} />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{count}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mb-5 px-0.5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Status</p>
          {[
            { dot: "bg-red-500",    label: "Not attended" },
            { dot: "bg-orange-500", label: "In progress" },
            { dot: "bg-green-500",  label: "Completed" },
          ].map(({ dot, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`h-2 w-2 rounded-full ${dot}`} />
              {label}
            </span>
          ))}
        </div>

        {/* Reports */}
        {fetchError ? (
          <div className="bg-white rounded-2xl border border-red-100 p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-red-600 mb-1">Could not load reports</p>
            <p className="text-xs text-gray-400">{fetchError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-primary font-semibold hover:underline"
            >
              Try again
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5">
              <Droplets size={26} className="text-primary/40" />
            </div>
            <p className="font-semibold text-gray-700">No reports yet</p>
            <p className="text-sm text-gray-400 mt-1">Submit your first leak report to get started.</p>
            <Link
              href="/report/new"
              className="inline-flex items-center gap-2 mt-5 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
            >
              <Plus size={15} /> Report a Leak
            </Link>
          </div>
        ) : (
          <div className="space-y-3 pb-10">
            {reports.map(report => (
              <Link
                key={report.id}
                href={`/report/${report.id}`}
                className="group flex items-stretch bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all overflow-hidden"
              >
                {/* Status bar */}
                <div className={`w-1 shrink-0 ${STATUS_BAR[report.status] ?? "bg-gray-300"}`} />

                <div className="flex flex-1 items-center gap-4 px-5 py-4 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="font-mono text-xs font-bold text-primary">{report.referenceNumber}</span>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[report.status]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[report.status]}`} />
                        {STATUS_LABEL[report.status]}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate flex items-center gap-1">
                      <MapPin size={11} className="shrink-0 text-gray-400" />
                      {report.address}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{report.description}</p>
                  </div>

                  <div className="shrink-0 text-right hidden sm:block">
                    <div className="flex items-center gap-1 text-xs text-gray-400 justify-end">
                      <Calendar size={11} />
                      {new Date(report.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    {report.photos.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 justify-end mt-1">
                        <Camera size={11} /> {report.photos.length} photo{report.photos.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>

                  <ChevronRight size={16} className="shrink-0 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
