"use client";
import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, MapPin, Tag, FileText, User, Camera,
  CheckCircle2, XCircle, UserCheck, MessageSquare,
  HelpCircle, Clock, Loader2, Send,
} from "lucide-react";

type ReportDetail = {
  id: string; referenceNumber: string; status: string; category: string;
  isHighPriority: boolean; isVerified: boolean; verificationNote: string | null;
  address: string; description: string; createdAt: string;
  latitude: string | null; longitude: string | null;
  contactName: string | null; contactPhone: string | null; contactEmail: string | null;
  isValid: boolean | null; validationNote: string | null;
  submittedBy: { id: string; name: string; email: string } | null;
  photos: { id: string; url: string }[];
  assignments: { id: string; assignedTo: { id: string; name: string }; notes: string | null; createdAt: string }[];
  investigationNotes: { id: string; note: string; createdAt: string; author: { name: string; role: string } }[];
  infoRequests: { id: string; message: string; response: string | null; status: string; createdAt: string }[];
  findings: { id: string; notes: string; createdAt: string; technician: { name: string }; photos: { id: string; url: string }[] }[];
  repairRecords: { id: string; actions: string; isCompleted: boolean; completedAt: string | null; technician: { name: string } }[];
};

type Technician = { id: string; name: string };

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  ASSIGNED: "bg-purple-100 text-purple-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

const STATUSES = ["UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"];

export default function OfficerReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [newStatus, setNewStatus] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [validationNote, setValidationNote] = useState("");
  const [newNote, setNewNote] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch(`/api/reports/${id}`).then(r => r.json()),
      fetch("/api/users?role=FIELD_TECHNICIAN").then(r => r.json()),
      fetch("/api/categories").then(r => r.ok ? r.json() : []),
    ]).then(([r, t, c]) => {
      setReport(r);
      setNewStatus(r.status);
      setTechnicians(t);
      setCategories(c);
      setLoading(false);
    });
  }, [id, status]);

  async function act(fn: () => Promise<Response>, successMsg: string) {
    setSaving(true);
    setFeedback(null);
    const res = await fn();
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setFeedback({ type: "error", msg: data.error });
    setFeedback({ type: "success", msg: successMsg });
    // Refresh report
    const updated = await fetch(`/api/reports/${id}`).then(r => r.json());
    setReport(updated);
    setNewStatus(updated.status);
  }

  if (loading || !report) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400"><Loader2 size={24} className="animate-spin mr-2" /> Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/officer/reports" className="inline-flex items-center gap-1 text-primary text-sm hover:underline mb-6">
          <ArrowLeft size={16} /> Back to Reports
        </Link>

        {feedback && (
          <div className={`rounded-xl px-5 py-3 mb-6 text-sm flex items-center gap-2 ${feedback.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {feedback.msg}
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono font-bold text-primary text-lg">{report.referenceNumber}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[report.status]}`}>
                  {report.status.replace(/_/g, " ")}
                </span>
                {report.isValid === true && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Valid</span>}
                {report.isValid === false && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">Invalid</span>}
                {report.isHighPriority && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">Critical</span>}
                {report.isVerified && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Verified</span>}
              </div>
              <p className="text-xs text-gray-400">Submitted {new Date(report.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-5">
            <div className="flex items-start gap-2">
              <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Location</p>
                <p className="text-sm font-medium text-gray-700">{report.address}</p>
                {report.latitude && <p className="text-xs text-gray-400">{report.latitude}, {report.longitude}</p>}
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
            {(report.contactName || report.contactPhone) && (
              <div className="flex items-start gap-2">
                <User size={16} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Contact</p>
                  <p className="text-sm font-medium text-gray-700">{report.contactName}</p>
                  <p className="text-xs text-gray-400">{report.contactPhone} {report.contactEmail}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Completeness check</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                ["Description", Boolean(report.description.trim())],
                ["Location", Boolean(report.address.trim())],
                ["Map coordinates", Boolean(report.latitude && report.longitude)],
                ["Photo evidence", report.photos.length > 0],
                ["Reporter contact", Boolean(report.contactName || report.contactPhone || report.contactEmail)],
              ].map(([label, complete]) => <span key={String(label)} className={`rounded-full px-2.5 py-1 ${complete ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"}`}>{complete ? "✓" : "!"} {String(label)}</span>)}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
            <label className="text-xs font-medium text-gray-500">Categorise</label>
            <select aria-label="Leak category" value={report.category} onChange={e => act(() => fetch(`/api/reports/${id}/category`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: e.target.value }) }), "Category updated.")} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button disabled={saving} onClick={() => act(() => fetch(`/api/reports/${id}/priority`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ highPriority: !report.isHighPriority }) }), report.isHighPriority ? "Priority cleared." : "Leak marked critical.")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${report.isHighPriority ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
              {report.isHighPriority ? "Critical priority · Clear" : "Mark critical"}
            </button>
            {report.isHighPriority || (Date.now() - new Date(report.createdAt).getTime() >= 48 * 60 * 60 * 1000 && !["RESOLVED", "CLOSED"].includes(report.status)) ? (
              <button disabled={saving} onClick={() => act(() => fetch(`/api/reports/${id}/escalate`, { method: "POST" }), "Escalated to management.")} className="rounded-lg bg-red-600 text-white px-3 py-2 text-sm font-semibold disabled:opacity-60">Escalate to management</button>
            ) : null}
          </div>

          {/* Photos — US-013 */}
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

        <div className="grid md:grid-cols-2 gap-6">
          {/* Validate — US-014 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={18} className="text-primary" />
              <h2 className="font-semibold text-gray-800">Validate Report</h2>
            </div>
            <textarea
              rows={2} placeholder="Validation note (required if invalid)…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-3"
              value={validationNote} onChange={e => setValidationNote(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                disabled={saving}
                onClick={() => act(() => fetch(`/api/reports/${id}/validate`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isValid: true, validationNote }) }), "Report marked as valid.")}
                className="flex-1 bg-accent text-white py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-1"
              >
                <CheckCircle2 size={14} /> Valid
              </button>
              <button
                disabled={saving}
                onClick={() => act(() => fetch(`/api/reports/${id}/validate`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isValid: false, validationNote }) }), "Report marked as invalid.")}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-1"
              >
                <XCircle size={14} /> Invalid
              </button>
            </div>
          </div>

          {/* Change Status — US-015 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-primary" />
              <h2 className="font-semibold text-gray-800">Update Status</h2>
            </div>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
              value={newStatus} onChange={e => setNewStatus(e.target.value)}
            >
              {!STATUSES.includes(report.status) && <option value={report.status}>{report.status.replace(/_/g, " ")}</option>}
              {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
            <button
              disabled={saving || newStatus === report.status}
              onClick={() => act(() => fetch(`/api/reports/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) }), "Status updated.")}
              className="w-full bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Save Status"}
            </button>
          </div>

          {/* Assign — US-016 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck size={18} className="text-primary" />
              <h2 className="font-semibold text-gray-800">Assign to Technician</h2>
            </div>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
              value={technicianId} onChange={e => setTechnicianId(e.target.value)}
            >
              <option value="">Select a technician…</option>
              {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <textarea
              rows={2} placeholder="Assignment notes (optional)…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-3"
              value={assignNotes} onChange={e => setAssignNotes(e.target.value)}
            />
            <button
              disabled={saving || !technicianId}
              onClick={() => act(() => fetch(`/api/reports/${id}/assign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ technicianId, notes: assignNotes }) }), "Report assigned successfully.")}
              className="w-full bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              Assign
            </button>
            {report.assignments.length > 0 && (
              <div className="mt-3 space-y-1">
                {report.assignments.map(a => (
                  <p key={a.id} className="text-xs text-gray-400">Assigned to <span className="font-medium text-gray-600">{a.assignedTo.name}</span> on {new Date(a.createdAt).toLocaleDateString()}</p>
                ))}
              </div>
            )}
          </div>

          {/* Request Info — US-018 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle size={18} className="text-primary" />
              <h2 className="font-semibold text-gray-800">Request More Information</h2>
            </div>
            <textarea
              rows={3} placeholder="What additional information do you need from the reporter?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-3"
              value={infoMessage} onChange={e => setInfoMessage(e.target.value)}
            />
            <button
              disabled={saving || !infoMessage.trim()}
              onClick={() => act(() => fetch(`/api/reports/${id}/info-request`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: infoMessage }) }), "Information request sent.").then(() => setInfoMessage(""))}
              className="w-full bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Send size={14} /> Send Request
            </button>
            {report.infoRequests.length > 0 && (
              <div className="mt-3 space-y-2">
                {report.infoRequests.map(r => (
                  <div key={r.id} className="text-xs bg-gray-50 rounded-lg p-2 border border-gray-100">
                    <p className="text-gray-600">{r.message}</p>
                    {r.response && <p className="text-accent mt-1">Response: {r.response}</p>}
                    <p className="text-gray-400 mt-1">{r.status} · {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Technician submissions</h2>
            <span className="text-xs text-gray-400">{report.findings.length} findings · {report.repairRecords.length} repair records</span>
          </div>
          {report.findings.length === 0 && report.repairRecords.length === 0 ? <p className="text-sm text-gray-400">No field submissions yet.</p> : <div className="space-y-3">
            {report.findings.map(f => <div key={f.id} className="rounded-xl bg-gray-50 p-4 border border-gray-100"><p className="text-sm text-gray-700">{f.notes}</p><p className="mt-2 text-xs text-gray-400">{f.technician.name} · {new Date(f.createdAt).toLocaleString()}</p>{f.photos.length > 0 && <div className="flex gap-2 mt-3 flex-wrap">{f.photos.map(photo => <Image key={photo.id} src={photo.url} alt="Technician submission" width={80} height={80} className="rounded-lg object-cover" />)}</div>}</div>)}
            {report.repairRecords.map(record => <div key={record.id} className="rounded-xl border border-gray-100 p-4"><p className="text-sm text-gray-700">{record.actions}</p><p className="mt-2 text-xs text-gray-400">{record.technician.name} · {record.isCompleted ? `Completed ${record.completedAt ? new Date(record.completedAt).toLocaleString() : ""}` : "Work in progress"}</p></div>)}
          </div>}
        </div>

        {report.status === "RESOLVED" && <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mt-6">
          <div className="flex items-center gap-2 mb-3"><CheckCircle2 size={18} className="text-primary"/><h2 className="font-semibold text-gray-800">Verify resolution</h2></div>
          <textarea rows={2} value={validationNote} onChange={e => setValidationNote(e.target.value)} placeholder="Verification note (required to send back for more work)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3" />
          <div className="flex gap-2"><button disabled={saving} onClick={() => act(() => fetch(`/api/reports/${id}/verify`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verified: true, note: validationNote }) }), "Leak verified and closed.")} className="flex-1 bg-accent text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-60">Verify and close</button><button disabled={saving || !validationNote.trim()} onClick={() => act(() => fetch(`/api/reports/${id}/verify`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verified: false, note: validationNote }) }), "Returned to the field team for further repair.")} className="flex-1 bg-orange-100 text-orange-800 py-2 rounded-lg text-sm font-semibold disabled:opacity-60">Reject · Request more work</button></div>
        </div>}

        {/* Investigation Notes — US-017 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mt-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={18} className="text-primary" />
            <h2 className="font-semibold text-gray-800">Investigation Notes</h2>
          </div>
          <div className="flex gap-3 mb-4">
            <textarea
              rows={2} placeholder="Add an investigation note…"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              value={newNote} onChange={e => setNewNote(e.target.value)}
            />
            <button
              disabled={saving || !newNote.trim()}
              onClick={() => act(() => fetch(`/api/reports/${id}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note: newNote }) }), "Note added.").then(() => setNewNote(""))}
              className="bg-primary text-white px-4 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center gap-1"
            >
              <Send size={14} /> Add
            </button>
          </div>
          {report.investigationNotes.length === 0 ? (
            <p className="text-sm text-gray-400">No notes yet.</p>
          ) : (
            <div className="space-y-3">
              {report.investigationNotes.map(n => (
                <div key={n.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-700">{n.note}</p>
                  <p className="text-xs text-gray-400 mt-2">{n.author.name} · {n.author.role.replace(/_/g, " ")} · {new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
