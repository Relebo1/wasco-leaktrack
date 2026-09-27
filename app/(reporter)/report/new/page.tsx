"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Tag, FileText, Camera, Phone, ArrowLeft, Loader2 } from "lucide-react";

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={16} className="text-primary" />
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h2>
    </div>
  );
}

export default function NewReportPage() {
  const [form, setForm] = useState({
    address: "", description: "", category: "", latitude: "", longitude: "",
    contactName: "", contactPhone: "", contactEmail: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedReference, setSubmittedReference] = useState("");
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { fetch("/api/categories").then(r => r.ok ? r.json() : []).then(setCategories).catch(() => setCategories([])); }, []);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let photoUrls: string[] = [];
    if (files.length) {
      const fd = new FormData();
      files.forEach(f => fd.append("files", f));
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      if (!up.ok) { setError("Photo upload failed."); setLoading(false); return; }
      const { urls } = await up.json();
      photoUrls = urls;
    }

    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, latitude: form.latitude || null, longitude: form.longitude || null, photoUrls }),
    });

    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    setSubmittedReference(data.referenceNumber);
  }

  if (submittedReference) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4 flex items-center">
        <div className="max-w-lg w-full mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
            <span className="text-2xl" aria-hidden="true">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">Leak report submitted</h1>
          <p className="text-sm text-gray-600">WASCO has received your report. Keep this reference number for your records:</p>
          <p className="mt-4 mb-6 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 font-mono font-bold text-primary text-lg">{submittedReference}</p>
          <Link href="/" className="inline-flex bg-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:opacity-90">Return to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1 text-primary text-sm hover:underline mb-6">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-primary mb-1">Report a Water Leak</h1>
          <p className="text-gray-500 text-sm mb-5">Provide the leak details, then add photos and contact information.</p>

          <div className="flex items-center gap-3 mb-8" aria-label={`Step ${step} of 2`}>
            <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? "bg-primary" : "bg-gray-200"}`} />
            <span className="text-xs font-medium text-gray-500">Step {step} of 2</span>
            <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? "bg-primary" : "bg-gray-200"}`} />
          </div>

          {error && <p className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-6">{error}</p>}

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">

            {step === 1 && <>
            <h2 className="text-lg font-semibold text-gray-800">Leak details</h2>
            {/* Location */}
            <section>
              <SectionHeader icon={MapPin} title="Location" />
              <input
                required placeholder="Street address or area description"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.address} onChange={e => set("address", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <input
                  type="number" step="any" placeholder="Latitude (optional)"
                  className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.latitude} onChange={e => set("latitude", e.target.value)}
                />
                <input
                  type="number" step="any" placeholder="Longitude (optional)"
                  className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.longitude} onChange={e => set("longitude", e.target.value)}
                />
              </div>
            </section>

            {/* Category */}
            <section>
              <SectionHeader icon={Tag} title="Leak Category" />
              <select
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                value={form.category} onChange={e => set("category", e.target.value)}
              >
                <option value="">Select a category…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </section>

            {/* Description */}
            <section>
              <SectionHeader icon={FileText} title="Description" />
              <textarea
                required rows={4} placeholder="Describe the leak — size, severity, how long it has been present…"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                value={form.description} onChange={e => set("description", e.target.value)}
              />
            </section>

            <button
              type="button"
              onClick={() => {
                if (formRef.current?.reportValidity()) {
                  setError("");
                  setStep(2);
                }
              }}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Next
            </button>
            </>}

            {step === 2 && <>
            <h2 className="text-lg font-semibold text-gray-800">Photos and contact</h2>
            {/* Photos */}
            <section>
              <SectionHeader icon={Camera} title="Photos (optional)" />
              <input
                type="file" accept="image/*" multiple
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:opacity-90"
                onChange={e => setFiles(Array.from(e.target.files ?? []))}
              />
              {files.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">{files.length} file(s) selected</p>
              )}
            </section>

            {/* Contact */}
            <section>
              <SectionHeader icon={Phone} title="Contact Information (optional)" />
              <div className="space-y-3">
                <input
                  placeholder="Your name"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.contactName} onChange={e => set("contactName", e.target.value)}
                />
                <input
                  type="tel" placeholder="Phone number"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)}
                />
                <input
                  type="email" placeholder="Email address"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.contactEmail} onChange={e => set("contactEmail", e.target.value)}
                />
              </div>
            </section>

            <button
              type="submit" disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting report…</> : "Submit Report"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => { setError(""); setStep(1); }}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              Previous
            </button>
            </>}
          </form>
        </div>
      </div>
    </div>
  );
}
