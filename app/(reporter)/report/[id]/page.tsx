"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, MapPin, Loader2, MessageSquare, CheckCircle2, Clock, Send } from "lucide-react";

type RequestRow = { id: string; message: string; response: string | null; status: string; createdAt: string };
type Report = { referenceNumber: string; address: string; description: string; status: string; infoRequests: RequestRow[] };

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

export default function ReporterCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") router.push("/login");
    if (sessionStatus === "authenticated") {
      fetch(`/api/reports/${id}`)
        .then(async (r) => {
          if (!r.ok) { setError("Report not found or access denied."); return; }
          setReport(await r.json());
        })
        .finally(() => setLoading(false));
    }
  }, [id, sessionStatus, router]);

  async function reply(requestId: string) {
    setError("");
    setSending(requestId);
    const r = await fetch(`/api/reports/${id}/info-request`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ infoRequestId: requestId, response: answers[requestId] }),
    });
    const data = await r.json();
    setSending(null);
    if (!r.ok) return setError(data.error);
    setReport((x) => x ? { ...x, infoRequests: x.infoRequests.map((q) => q.id === requestId ? data : q) } : x);
    setAnswers((x) => ({ ...x, [requestId]: "" }));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm text-gray-400">Loading report…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* Header */}
      <div className={`px-6 pt-8 pb-16 ${report ? STATUS_BAR[report.status] ?? "bg-primary" : "bg-primary"}`}
        style={{ background: "var(--color-primary)" }}>
        <div className="max-w-3xl mx-auto">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-5 transition-colors">
            <ArrowLeft size={15} /> My reports
          </Link>
          {report && (
            <>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Leak Report</p>
                  <h1 className="font-mono text-2xl font-bold text-white">{report.referenceNumber}</h1>
                </div>
                <span className={`inline-flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-white backdrop-blur-sm`}>
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT[report.status] ?? "bg-gray-400"}`} />
                  {STATUS_LABEL[report.status] ?? report.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-white/60 text-sm">
                <MapPin size={13} /> {report.address}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-8 pb-12 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-5 py-4">
            {error}
          </div>
        )}

        {report && (
          <>
            {/* Description card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                <FileTextIcon />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Description</p>
              </div>
              <p className="px-6 py-5 text-sm text-gray-700 leading-relaxed">{report.description}</p>
            </div>

            {/* Status tracker */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Report Progress</p>
              <div className="flex items-center gap-0">
                {[
                  { key: ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"], label: "Submitted", always: true },
                  { key: ["UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"], label: "Reviewing" },
                  { key: ["IN_PROGRESS", "RESOLVED", "CLOSED"], label: "In Progress" },
                  { key: ["RESOLVED", "CLOSED"], label: "Completed" },
                ].map((stage, i, arr) => {
                  const active = stage.key.includes(report.status);
                  return (
                    <div key={stage.label} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          active ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                        }`}>
                          {active ? <CheckCircle2 size={14} /> : <Clock size={12} />}
                        </div>
                        <p className={`text-[10px] font-semibold whitespace-nowrap ${active ? "text-primary" : "text-gray-400"}`}>
                          {stage.label}
                        </p>
                      </div>
                      {i < arr.length - 1 && (
                        <div className={`flex-1 h-0.5 mb-4 mx-1 ${active && arr[i + 1].key.includes(report.status) ? "bg-primary" : "bg-gray-100"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info requests */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                <MessageSquare size={14} className="text-gray-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Information Requests
                  {report.infoRequests.length > 0 && (
                    <span className="ml-2 bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {report.infoRequests.length}
                    </span>
                  )}
                </p>
              </div>

              {report.infoRequests.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <MessageSquare size={24} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No information requests from WASCO yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {report.infoRequests.map((q) => (
                    <div key={q.id} className="px-6 py-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <p className="text-sm font-medium text-gray-800">{q.message}</p>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          q.response ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                        }`}>
                          {q.response ? "Answered" : "Pending"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mb-3">{new Date(q.createdAt).toLocaleString()}</p>

                      {q.response ? (
                        <div className="flex items-start gap-2.5 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                          <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                          <p className="text-sm text-green-700">{q.response}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <textarea
                            value={answers[q.id] ?? ""}
                            onChange={(e) => setAnswers((x) => ({ ...x, [q.id]: e.target.value }))}
                            placeholder="Write your response…"
                            rows={3}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                          />
                          <button
                            onClick={() => void reply(q.id)}
                            disabled={!answers[q.id]?.trim() || sending === q.id}
                            className="flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                          >
                            {sending === q.id ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                            Send Response
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FileTextIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
