"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, User, Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    router.push("/login?registered=1");
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-white";

  const pwStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][pwStrength];
  const strengthColor = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"][pwStrength];

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] shrink-0 flex-col justify-between bg-primary px-12 py-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
            <Image src="/Logo.png" alt="WASCO" width={28} height={28} className="object-contain" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">WASCO</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mt-0.5">Leak Track</p>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Join the community.<br />Make a difference.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            Create a free reporter account to submit water leak reports and track them in real time. Staff accounts are managed by WASCO administrators.
          </p>
          {[
            "Free to register — no fees",
            "Report leaks from anywhere",
            "Track your reports in real time",
          ].map(f => (
            <div key={f} className="flex items-center gap-2.5 mb-3">
              <CheckCircle2 size={15} className="text-green-400 shrink-0" />
              <p className="text-sm text-white/70">{f}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-white/25">© {new Date().getFullYear()} Water and Sewerage Company</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-gray-50/60">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Image src="/Logo.png" alt="WASCO" width={26} height={26} className="object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">WASCO</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-0.5">Leak Track</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
            <p className="text-sm text-gray-400 mb-2">Join WASCO Leak Track to report water leaks.</p>
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-xl px-3 py-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Account type</span>
              <span className="ml-auto text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Reporter</span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="text" required placeholder="Your full name"
                    className={`${inputCls} pl-10`}
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="email" required placeholder="you@example.com"
                    className={`${inputCls} pl-10`}
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type={showPw ? "text" : "password"} required minLength={12} placeholder="Min. 12 characters"
                    className={`${inputCls} pl-10 pr-11`}
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= pwStrength ? strengthColor : "bg-gray-100"}`} />
                      ))}
                    </div>
                    <span className={`text-[11px] font-semibold ${["", "text-red-500", "text-orange-500", "text-yellow-500", "text-green-600"][pwStrength]}`}>
                      {strengthLabel}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type={showPw ? "text" : "password"} required placeholder="Repeat your password"
                    className={`${inputCls} pl-10 ${form.confirm && form.confirm !== form.password ? "border-red-300 focus:ring-red-200" : ""}`}
                    value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
                </div>
                {form.confirm && form.confirm !== form.password && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                {loading ? <><Loader2 size={15} className="animate-spin" /> Creating account…</> : "Create Account"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-5">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
