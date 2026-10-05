"use client";
import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, MapPin, Tag, FileText, User, Camera,
  CheckCircle2, XCircle, Clock, Loader2, Wrench, UserCheck,
} from "lucide-react";

type ReportDetail = {
  id: string; referenceNumber: string; status: string; category: string;
  isHighPriority: boolean; isVerified: boolean;
  address: string; description: string; createdAt: string;
  latitude: string | null; longitude: string | null;
  contactName: string | null; contactPhone: string | null;
  isValid: boolean | null; validationNote: string | null;
  submittedBy: { name: string; email: string } | null;
  photos: { id: string; url: string }[];
  assignments: { id: string; assignedTo: { name: string }; notes: string | null; createdAt: string }[];
  investigationNotes: { id: string; note: string; createdAt: string; author: { name: string; role: string } }[];
  findings: { id: string; notes: string; createdAt: string; technician: { name: string }; photos: { id: string; url: string }[] }[];
  repairRecords?: { id: string; actions: string; isCompleted: boolean; completedAt: string | null; technician: { name: string } }[];
};

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  ASSIGNED: "bg-purple-100 text-purple-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

export default function ManagerCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifyNote, setVerifyNote] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [assignTechId, setAssignTechId] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      const role = (session?.user as { role?: string })?.role ?? "";
      if (!["WASCO_MANAGER", "SYSTEM_ADMINISTRATOR"].includes(role)) router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(`/api/reports/${id}`)
      .then(r => r.json())
      .then(r => { setReport(r); setLoading(false); });
    fetch("/api/users?role=FIELD_TECHNICIAN")
      .then(r => r.ok ? r.json() : [])
      .then(setTechnicians);
  }, [id, status]);

  async function closeCase(approve: boolean) {
    setSaving(true);
    setFeedback(null);
    const res = await fetch(`/api/reports/${id}/verify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified: approve, note: verifyNote }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setFeedback({ type: "error", msg: data.error });
    setFeedback({
      type: "success",
      msg: approve ? "Case verified and closed." : "Case sent back to In Progress.",
    });
    const updated = await fetch(`/api/reports/${id}`).then(r => r.json());
    setReport(updated);
  }

  async function assignTechnician(e: React.FormEvent) {
    e.preventDefault();
    if (!assignTechId) return;
    setAssigning(true); setFeedback(null);
    const res = await fetch(`/api/reports/${id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ technicianId: assignTechId, notes: assignNote || undefined }),
    });
    const data = await res.json();
    setAssigning(false);
    if (!res.ok) return setFeedback({ type: "error", msg: data.error ?? "Assignment failed." });
    setFeedback({ type: "success", msg: "Technician assigned successfully." });
    setAssignNote("");
    const updated = await fetch(`/api/reports/${id}`).then(r => r.json());
    setReport(updated);
  }

  async function setPriority(highPriority: boolean) {
    const res = await fetch(`/api/reports/${id}/priority`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ highPriority }) });
    if (!res.ok) return;
    setReport(await res.json());
  }

  if (loading || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <Loader2 size={24} className="animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/manager/cases" className="inline-flex items-center gap-1 text-primary text-sm hover:underline mb-6">
          <ArrowLeft size={16} /> Back to All Cases
        </Link>

        {feedback && (
          <div className={`rounded-xl px-5 py-3 mb-6 text-sm flex items-center gap-2 ${feedback.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {feedback.msg}
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono font-bold text-primary text-lg">{report.referenceNumber}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[report.status]}`}>
                  {report.status.replace(/_/g, " ")}
                </span>
                {report.isHighPriority && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">High priority</span>}
              </div>
              <p className="text-xs text-gray-400">Submitted {new Date(report.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <button onClick={() => setPriority(!report.isHighPriority)} className="text-xs text-primary hover:underline">
            {report.isHighPriority ? "Remove high priority" : "Mark high priority"}
          </button>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Location</p>
                <p className="text-sm font-medium text-gray-700">{report.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Tag size={16} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Category</p>
                <p className="text-sm font-medium text-gray-700 capitalize">{report.category.replace(/_/g, " ").toLowerCase()}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 md:col-span-2">
              <FileText size={16} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Description</p>
                <p className="text-sm text-gray-700">{report.description}</p>
              </div>
            </div>
            {report.submittedBy && (
              <div className="flex items-start gap-2">
                <User size={16} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Submitted by</p>
                  <p className="text-sm font-medium text-gray-700">{report.submittedBy.name}</p>
                  <p className="text-xs text-gray-400">{report.submittedBy.email}</p>
                </div>
              </div>
            )}
            {report.assignments[0] && (
              <div className="flex items-start gap-2">
                <Wrench size={16} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Assigned Technician</p>
                  <p className="text-sm font-medium text-gray-700">{report.assignments[0].assignedTo.name}</p>
                  <p className="text-xs text-gray-400">{new Date(report.assignments[0].createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>

          {report.photos.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-3">
                <Camera size={16} className="text-primary" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Photos</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                {report.photos.map(p => (
                  <Image key={p.id} src={p.url} alt="Leak photo" width={100} height={100} className="rounded-lg object-cover border border-gray-200" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Findings */}
        {report.findings?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Wrench size={18} className="text-primary" />
              <h2 className="font-semibold text-gray-800">Field Findings</h2>
            </div>
            <div className="space-y-4">
              {report.findings.map(f => (
                <div key={f.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-700">{f.notes}</p>
                  <p className="text-xs text-gray-400 mt-2">{f.technician.name} · {new Date(f.createdAt).toLocaleString()}</p>
                  {f.photos.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {f.photos.map(p => (
                        <Image key={p.id} src={p.url} alt="Finding" width={80} height={80} className="rounded-lg object-cover border border-gray-200" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Investigation notes */}
        {report.investigationNotes?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-primary" />
              <h2 className="font-semibold text-gray-800">Investigation Notes</h2>
            </div>
            <div className="space-y-3">
              {report.investigationNotes.map(n => (
                <div key={n.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-700">{n.note}</p>
                  <p className="text-xs text-gray-400 mt-2">{n.author.name} · {n.author.role.replace(/_/g, " ")} · {new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assign / Reassign */}
        {report.status !== "CLOSED" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck size={18} className="text-primary" />
              <h2 className="font-semibold text-gray-800">
                {report.assignments[0] ? "Reassign Technician" : "Assign Technician"}
              </h2>
            </div>
            {report.assignments[0] && (
              <p className="text-sm text-gray-500 mb-4">
                Currently assigned to <span className="font-semibold text-gray-700">{report.assignments[0].assignedTo.name}</span>.
                Select a different technician below to reassign.
              </p>
            )}
            <form onSubmit={assignTechnician} className="flex flex-col sm:flex-row gap-3">
              <select required value={assignTechId} onChange={e => setAssignTechId(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white">
                <option value="">Select technician…</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input placeholder="Assignment note (optional)" value={assignNote} onChange={e => setAssignNote(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
              <button disabled={assigning || !assignTechId}
                className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60 shrink-0">
                {assigning ? "Assigning…" : report.assignments[0] ? "Reassign" : "Assign"}
              </button>
            </form>
          </div>
        )}

        {/* US-036: Resolution verification — only shown when RESOLVED */}
        {report.status === "RESOLVED" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={18} className="text-green-500" />
              <h2 className="font-semibold text-gray-800">Verify Resolution</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Review the findings and notes above, then approve to close this case or reject to send it back for further work.
            </p>
            <textarea
              rows={2}
              placeholder="Verification note (optional)…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-4"
              value={verifyNote}
              onChange={e => setVerifyNote(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                disabled={saving}
                onClick={() => closeCase(true)}
                className="flex-1 bg-accent text-white py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} /> Approve & Close
              </button>
              <button
                disabled={saving}
                onClick={() => closeCase(false)}
                className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <XCircle size={16} /> Reject — Reopen
              </button>
            </div>
          </div>
        )}

        {report.status === "CLOSED" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-semibold">Case Closed</p>
            <p className="text-green-600 text-sm mt-1">This case has been verified and closed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
