"use client";
import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, MapPin, Tag, FileText, Camera, Wrench,
  CheckCircle2, Clock, Send, Loader2, ExternalLink,
  ClipboardList, AlertCircle,
} from "lucide-react";

type ReportDetail = {
  id: string; referenceNumber: string; status: string; category: string;
  address: string; description: string; createdAt: string;
  latitude: string | null; longitude: string | null;
  photos: { id: string; url: string }[];
  assignments: { notes: string | null; assignedBy: { name: string } | null; createdAt: string }[];
  findings: {
    id: string; notes: string; createdAt: string;
    technician: { name: string };
    photos: { id: string; url: string }[];
  }[];
};

type RepairRecord = {
  id: string; actions: string; isCompleted: boolean; completedAt: string | null;
  createdAt: string; technician: { name: string };
};

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: "bg-purple-100 text-purple-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

const STATUSES = ["IN_PROGRESS"];

export default function TechnicianCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [repairRecords, setRepairRecords] = useState<RepairRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Form states
  const [newStatus, setNewStatus] = useState("");
  const [findingNotes, setFindingNotes] = useState("");
  const [findingFiles, setFindingFiles] = useState<File[]>([]);
  const [repairActions, setRepairActions] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  async function loadData() {
    const [r, rr] = await Promise.all([
      fetch(`/api/reports/${id}`).then(res => res.json()),
      fetch(`/api/reports/${id}/repair`).then(res => res.json()),
    ]);
    setReport(r);
    setNewStatus(r.status);
    setRepairRecords(rr);
    setLoading(false);
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, status]);

  async function act(fn: () => Promise<Response>, successMsg: string, onSuccess?: () => void) {
    setSaving(true);
    setFeedback(null);
    const res = await fn();
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setFeedback({ type: "error", msg: data.error });
    setFeedback({ type: "success", msg: successMsg });
    onSuccess?.();
    await loadData();
  }

  async function submitFinding() {
    let photoUrls: string[] = [];
    if (findingFiles.length) {
      const fd = new FormData();
      findingFiles.forEach(f => fd.append("files", f));
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      if (!up.ok) return setFeedback({ type: "error", msg: "Photo upload failed." });
      const { urls } = await up.json();
      photoUrls = urls;
    }
    await act(
      () => fetch(`/api/reports/${id}/findings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: findingNotes, photoUrls }),
      }),
      "Finding recorded successfully.",
      () => { setFindingNotes(""); setFindingFiles([]); }
    );
  }

  if (loading || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <Loader2 size={24} className="animate-spin mr-2" /> Loading…
      </div>
    );
  }

  const isComplete = repairRecords.some(r => r.isCompleted);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/technician/cases" className="inline-flex items-center gap-1 text-primary text-sm hover:underline mb-6">
          <ArrowLeft size={16} /> Back to My Cases
        </Link>

        {feedback && (
          <div className={`rounded-xl px-5 py-3 mb-6 text-sm flex items-center gap-2 ${feedback.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {feedback.msg}
          </div>
        )}

        {/* Case Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono font-bold text-primary text-lg">{report.referenceNumber}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[report.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {report.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-xs text-gray-400">Assigned {new Date(report.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Location — US-022 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Location</p>
                <p className="text-sm font-medium text-gray-700">{report.address}</p>
                {report.latitude && report.longitude && (
                  <a
                    href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                  >
                    <ExternalLink size={12} /> Open in Google Maps
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Tag size={16} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Category</p>
                <p className="text-sm font-medium text-gray-700 capitalize">{report.category.replace(/_/g, " ").toLowerCase()}</p>
              </div>
            </div>
            {/* Description — US-023 */}
            <div className="flex items-start gap-2 md:col-span-2">
              <FileText size={16} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Description</p>
                <p className="text-sm text-gray-700">{report.description}</p>
              </div>
            </div>
            {report.assignments[0]?.notes && (
              <div className="md:col-span-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
                <span className="font-semibold">Assignment note:</span> {report.assignments[0].notes}
              </div>
            )}
          </div>

          {/* Reporter photos — US-023 */}
          {report.photos.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-3">
                <Camera size={16} className="text-primary" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reporter Photos</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                {report.photos.map(p => (
                  <Image key={p.id} src={p.url} alt="Leak" width={100} height={100} className="rounded-lg object-cover border border-gray-200" />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Update Status — US-024 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-primary" />
              <h2 className="font-semibold text-gray-800">Update Status</h2>
            </div>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
              value={newStatus} onChange={e => setNewStatus(e.target.value)}
            >
              {report.status !== "IN_PROGRESS" && <option value={report.status}>{report.status.replace(/_/g, " ")}</option>}
              {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
            <button
              disabled={saving || newStatus === report.status}
              onClick={() => act(
                () => fetch(`/api/reports/${id}/status`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: newStatus }),
                }),
                "Status updated."
              )}
              className="w-full bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : "Save Status"}
            </button>
          </div>

          {/* Record Repair — US-027 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Wrench size={18} className="text-primary" />
              <h2 className="font-semibold text-gray-800">Record Repair Actions</h2>
            </div>
            <textarea
              rows={3} placeholder="Describe the repair actions performed…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-3"
              value={repairActions} onChange={e => setRepairActions(e.target.value)}
            />
            <button
              disabled={saving || !repairActions.trim()}
              onClick={() => act(
                () => fetch(`/api/reports/${id}/repair`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ actions: repairActions }),
                }),
                "Repair actions recorded.",
                () => setRepairActions("")
              )}
              className="w-full bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Send size={14} /> Save Repair Record
            </button>
          </div>
        </div>

        {/* Investigation Findings — US-025, US-026 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mt-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={18} className="text-primary" />
            <h2 className="font-semibold text-gray-800">Record Investigation Finding</h2>
          </div>
          <textarea
            rows={3} placeholder="Describe what you found on-site — cause, severity, conditions…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-3"
            value={findingNotes} onChange={e => setFindingNotes(e.target.value)}
          />
          {/* Photo upload — US-026 */}
          <div className="mb-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              <Camera size={14} className="text-primary" /> Field Photos
            </label>
            <input
              type="file" accept="image/*" multiple
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:opacity-90"
              onChange={e => setFindingFiles(Array.from(e.target.files ?? []))}
            />
            {findingFiles.length > 0 && <p className="text-xs text-gray-400 mt-1">{findingFiles.length} file(s) selected</p>}
          </div>
          <button
            disabled={saving || !findingNotes.trim()}
            onClick={submitFinding}
            className="w-full bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} /> Submit Finding</>}
          </button>

          {/* Previous findings */}
          {report.findings.length > 0 && (
            <div className="mt-5 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Previous Findings</p>
              {report.findings.map(f => (
                <div key={f.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-700">{f.notes}</p>
                  {f.photos.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {f.photos.map(p => (
                        <Image key={p.id} src={p.url} alt="Finding" width={80} height={80} className="rounded-lg object-cover border border-gray-200" />
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">{f.technician.name} · {new Date(f.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Repair Records & Mark Complete — US-027, US-028 */}
        {repairRecords.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Wrench size={18} className="text-primary" />
              <h2 className="font-semibold text-gray-800">Repair Records</h2>
            </div>
            <div className="space-y-3">
              {repairRecords.map(r => (
                <div key={r.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{r.actions}</p>
                      <p className="text-xs text-gray-400 mt-1">{r.technician.name} · {new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                    {r.isCompleted ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-accent bg-green-50 px-2.5 py-1 rounded-full shrink-0">
                        <CheckCircle2 size={12} /> Completed
                      </span>
                    ) : !isComplete && (
                      <button
                        disabled={saving}
                        onClick={() => act(
                          () => fetch(`/api/reports/${id}/repair`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ repairRecordId: r.id }),
                          }),
                          "Repair marked as complete. Officer has been notified."
                        )}
                        className="flex items-center gap-1 bg-accent text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-90 disabled:opacity-60 shrink-0"
                      >
                        <CheckCircle2 size={12} /> Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
