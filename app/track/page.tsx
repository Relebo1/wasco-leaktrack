"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ArrowLeft, Loader2, MapPin, CheckCircle2, Clock, Droplets } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Not Attended",
  UNDER_REVIEW: "Not Attended",
  ASSIGNED: "Not Attended",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Completed",
  CLOSED: "Completed",
};

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED: "bg-red-50 text-red-600 border-red-100",
  UNDER_REVIEW: "bg-red-50 text-red-600 border-red-100",
  ASSIGNED: "bg-red-50 text-red-600 border-red-100",
  IN_PROGRESS: "bg-orange-50 text-orange-600 border-orange-100",
  RESOLVED: "bg-green-50 text-green-600 border-green-100",
  CLOSED: "bg-green-50 text-green-600 border-green-100",
};

const STATUS_DOT: Record<string, string> = {
  SUBMITTED: "bg-red-500",
  UNDER_REVIEW: "bg-red-500",
  ASSIGNED: "bg-red-500",
  IN_PROGRESS: "bg-orange-500",
  RESOLVED: "bg-green-500",
  CLOSED: "bg-green-500",
};

const STAGES = [
  { label: "Submitted", keys: ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"] },
  { label: "Reviewing",  keys: ["UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"] },
  { label: "In Progress", keys: ["IN_PROGRESS", "RESOLVED", "CLOSED"] },
  { label: "Completed",  keys: ["RESOLVED", "CLOSED"] },
];

type Report = {
  referenceNumber: string;
  address: string;
  description: string;
  status: string;
  createdAt: string;
  category: string;
};

export default function TrackPage() {
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!ref.trim()) return;
    setError("");
    setReport(null);
    setLoading(true);
    const res = await fetch(`/api/track?ref=${encodeURIComponent(ref.trim())}`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    setReport(data);
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-white";

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* Header */}
      <div className="bg-primary px-6 pt-8 pb-16">
        <div className="max-w-xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-5 transition-colors">
            <ArrowLeft size={15} /> Back to home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Image src="/Logo.png" alt="WASCO" width={36} height={36} className="object-contain" />
            <div>
              <p className="font-extrabold text-white leading-none">WASCO</p>
              <p className="text-accent text-xs font-medium tracking-widest uppercase">Leak Track</p>
            </div>
          </div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Guest Tracking</p>
          <h1 className="text-2xl font-bold text-white">Track Your Report</h1>
          <p className="text-white/60 text-sm mt-1">Enter your reference number to check the status of your report.</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 -mt-8 pb-12 space-y-4">
        {/* Search card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={ref}
              onChange={e => setRef(e.target.value)}
              placeholder="e.g. LT-ABC12345"
              className={`${inputCls} flex-1 font-mono`}
            />
            <button
              type="submit"
              disabled={loading || !ref.trim()}
              className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>

          {error && (
            <p className="mt-4 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
          )}
        </div>

        {/* Result card */}
        {report && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Ref + status header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Reference Number</p>
                <p className="font-mono text-xl font-bold text-primary">{report.referenceNumber}</p>
              </div>
              <span className={`inline-flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-full border ${STATUS_COLOR[report.status] ?? "bg-gray-50 text-gray-600 border-gray-100"}`}>
                <span className={`h-2 w-2 rounded-full ${STATUS_DOT[report.status] ?? "bg-gray-400"}`} />
                {STATUS_LABEL[report.status] ?? report.status.replace(/_/g, " ")}
              </span>
            </div>

            {/* Details */}
            <div className="px-6 py-5 space-y-3 border-b border-gray-100">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                {report.address}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{report.description}</p>
              <p className="text-xs text-gray-400">Submitted: {new Date(report.createdAt).toLocaleString()}</p>
            </div>

            {/* Progress tracker */}
            <div className="px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Report Progress</p>
              <div className="flex items-center">
                {STAGES.map((stage, i) => {
                  const active = stage.keys.includes(report.status);
                  return (
                    <div key={stage.label} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${active ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}>
                          {active ? <CheckCircle2 size={14} /> : <Clock size={12} />}
                        </div>
                        <p className={`text-[10px] font-semibold whitespace-nowrap ${active ? "text-primary" : "text-gray-400"}`}>
                          {stage.label}
                        </p>
                      </div>
                      {i < STAGES.length - 1 && (
                        <div className={`flex-1 h-0.5 mb-4 mx-1 ${active && STAGES[i + 1].keys.includes(report.status) ? "bg-primary" : "bg-gray-100"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <div className="px-6 pb-6">
              <div className="bg-primary/5 border border-primary/10 rounded-2xl px-5 py-4 text-center">
                <p className="text-xs text-primary/70 mb-3">Create a free account to get status updates and respond to WASCO requests.</p>
                <div className="flex gap-3 justify-center">
                  <Link href="/register" className="bg-primary text-white px-5 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity">
                    Create Account
                  </Link>
                  <Link href="/login" className="border border-gray-200 text-gray-600 px-5 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors">
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
