"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  MapPin, Tag, FileText, Camera, Phone, ArrowLeft,
  Loader2, LocateFixed, CheckCircle2, X, ImageIcon, LogIn,
} from "lucide-react";

export default function NewReportPage() {
  const { status: sessionStatus } = useSession();
  const isGuest = sessionStatus === "unauthenticated";
  const [form, setForm] = useState({
    address: "", description: "", category: "", latitude: "", longitude: "",
    contactName: "", contactPhone: "", contactEmail: "",
  });
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedReference, setSubmittedReference] = useState("");
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetch("/api/categories").then(r => r.ok ? r.json() : []).then(setCategories).catch(() => setCategories([]));
  }, []);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleFiles(selected: File[]) {
    setFiles(selected);
    setPreviews(selected.map(f => URL.createObjectURL(f)));
  }

  async function detectLocation() {
    setLocateError("");
    if (!navigator.geolocation) { setLocateError("Geolocation is not supported by your browser."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm(f => ({ ...f, latitude: String(latitude), longitude: String(longitude) }));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          if (data.display_name) setForm(f => ({ ...f, address: data.display_name }));
        } catch { /* user can type manually */ }
        setLocating(false);
      },
      (err) => {
        setLocateError(err.code === 1 ? "Location access denied. Please allow location or enter manually." : "Unable to detect location.");
        setLocating(false);
      },
      { timeout: 10000 }
    );
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

    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Unable to submit your report. Please try again.");
    setSubmittedReference(data.referenceNumber);
  }

  if (submittedReference) {
    return (
      <div className="min-h-screen bg-gray-50/60 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Report Submitted!</h1>
            <p className="text-sm text-gray-500 mb-6">WASCO has received your report. Save your reference number to track progress.</p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Reference Number</p>
              <p className="font-mono text-xl font-bold text-primary">{submittedReference}</p>
            </div>
            {isGuest ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">Create a free account to track this report and get status updates.</p>
                <div className="flex gap-3">
                  <Link href="/register" className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity text-center">
                    Create Account
                  </Link>
                  <Link href="/login" className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors text-center">
                    Sign In
                  </Link>
                </div>
                <Link href="/" className="block text-xs text-gray-400 hover:text-gray-600 transition-colors">Return to home</Link>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link href="/dashboard" className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity text-center">
                  Track Report
                </Link>
                <Link href="/report/new" className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors text-center">
                  New Report
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-white";

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* Header */}
      <div className="bg-primary px-6 pt-8 pb-16">
        <div className="max-w-2xl mx-auto">
          <Link href={isGuest ? "/" : "/dashboard"} className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-5 transition-colors">
            <ArrowLeft size={15} /> {isGuest ? "Back to home" : "Back to dashboard"}
          </Link>
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">New Report</p>
          <h1 className="text-2xl font-bold text-white">Report a Water Leak</h1>
          <p className="text-white/60 text-sm mt-1">Help WASCO respond faster by providing accurate details.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-8 pb-12">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Step indicator */}
          <div className="px-8 pt-7 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-3 flex-1">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    step === s ? "bg-primary text-white" : step > s ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                  }`}>
                    {step > s ? <CheckCircle2 size={14} /> : s}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold ${step === s ? "text-gray-800" : "text-gray-400"}`}>
                      {s === 1 ? "Leak Details" : "Photos & Contact"}
                    </p>
                  </div>
                  {s < 2 && <div className={`h-px flex-1 ${step > s ? "bg-green-400" : "bg-gray-200"}`} />}
                </div>
              ))}
            </div>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="px-8 py-7 space-y-6">
            {isGuest && (
              <div className="flex items-center justify-between gap-3 bg-primary/5 border border-primary/10 rounded-xl px-4 py-3">
                <p className="text-xs text-primary/80">
                  <span className="font-semibold">Reporting as guest.</span> Create an account to track your report.
                </p>
                <Link href="/register" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline shrink-0">
                  <LogIn size={12} /> Sign up
                </Link>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                <X size={15} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}

            {step === 1 && (
              <>
                {/* Location */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400 mb-2.5">
                    <MapPin size={12} /> Location
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      required
                      placeholder="Street address or area description"
                      className={`${inputCls} flex-1`}
                      value={form.address}
                      onChange={e => set("address", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={locating}
                      title="Detect my location"
                      className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-colors disabled:opacity-50 shrink-0"
                    >
                      {locating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
                      <span className="hidden sm:inline text-xs">{locating ? "Detecting…" : "Detect"}</span>
                    </button>
                  </div>
                  {locateError && <p className="text-xs text-red-500 mt-1">{locateError}</p>}
                  {form.latitude && form.longitude && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mt-2">
                      <MapPin size={11} />
                      GPS captured: {parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input type="number" step="any" placeholder="Latitude" className={inputCls}
                      value={form.latitude} onChange={e => set("latitude", e.target.value)} />
                    <input type="number" step="any" placeholder="Longitude" className={inputCls}
                      value={form.longitude} onChange={e => set("longitude", e.target.value)} />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400 mb-2.5">
                    <Tag size={12} /> Leak Category
                  </label>
                  <select
                    required
                    className={inputCls}
                    value={form.category}
                    onChange={e => set("category", e.target.value)}
                  >
                    <option value="">Select a category…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400 mb-2.5">
                    <FileText size={12} /> Description
                  </label>
                  <textarea
                    required rows={4}
                    placeholder="Describe the leak — size, severity, how long it has been present…"
                    className={`${inputCls} resize-none`}
                    value={form.description}
                    onChange={e => set("description", e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => { if (formRef.current?.reportValidity()) { setError(""); setStep(2); } }}
                  className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Continue →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                {/* Photos */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400 mb-2.5">
                    <Camera size={12} /> Photos <span className="normal-case font-normal text-gray-400">(optional)</span>
                  </label>
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-8 cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-colors">
                    <ImageIcon size={22} className="text-gray-300" />
                    <p className="text-sm text-gray-400">Click to upload photos</p>
                    <p className="text-xs text-gray-300">PNG, JPG up to 10MB each</p>
                    <input
                      type="file" accept="image/*" multiple className="hidden"
                      onChange={e => handleFiles(Array.from(e.target.files ?? []))}
                    />
                  </label>
                  {previews.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {previews.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contact */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400 mb-2.5">
                    <Phone size={12} /> Contact Info <span className="normal-case font-normal text-gray-400">(optional)</span>
                  </label>
                  <div className="space-y-2">
                    <input placeholder="Your name" className={inputCls}
                      value={form.contactName} onChange={e => set("contactName", e.target.value)} />
                    <input type="tel" placeholder="Phone number" className={inputCls}
                      value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} />
                    <input type="email" placeholder="Email address" className={inputCls}
                      value={form.contactEmail} onChange={e => set("contactEmail", e.target.value)} />
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => { setError(""); setStep(1); }}
                    className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : "Submit Report"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
