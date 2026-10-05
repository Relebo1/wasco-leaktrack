"use client";
import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Mail, Lock, ChevronRight, CheckCircle2 } from "lucide-react";

const DEMO_USERS = [
  { label: "Administrator",    email: "admin@wasco.com",       password: "Admin@Wasco2024!" },
  { label: "Manager",          email: "manager@wasco.com",     password: "Manager@Wasco2024!" },
  { label: "Leakage Officer",  email: "officer@wasco.com",     password: "Officer@Wasco2024!" },
  { label: "Field Technician", email: "technician@wasco.com",  password: "Technician@Wasco2024!" },
  { label: "Reporter",         email: "reporter@wasco.com",    password: "Reporter@Wasco2024!" },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    if (res?.error) return setError("Invalid email or password.");
    const s = await getSession();
    const role = (s?.user as { role?: string } | undefined)?.role;
    const dest: Record<string, string> = {
      SYSTEM_ADMINISTRATOR: "/admin/users", WASCO_MANAGER: "/manager/dashboard",
      LEAKAGE_OFFICER: "/officer/reports", FIELD_TECHNICIAN: "/technician/cases", REPORTER: "/dashboard",
    };
    router.push(dest[role ?? ""] ?? "/dashboard");
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-white";

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
            Report water leaks.<br />Track every fix.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            WASCO Leak Track helps communities report water leaks and gives WASCO the tools to respond fast.
          </p>
          {[
            "Submit reports with GPS location",
            "Track status in real time",
            "Get notified when your leak is fixed",
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-sm text-gray-400 mb-7">Sign in to your account to continue.</p>

            {params.get("registered") && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">
                <CheckCircle2 size={14} className="shrink-0" /> Account created! You can now sign in.
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <input type="password" required placeholder="Your password"
                    className={`${inputCls} pl-10`}
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : "Sign In"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-5">
              No account?{" "}
              <Link href="/register" className="text-primary font-semibold hover:underline">Create one</Link>
            </p>
          </div>

          {/* Demo accounts */}
          <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Demo accounts — click to fill</p>
            <div className="space-y-1.5">
              {DEMO_USERS.map(u => (
                <button key={u.email} type="button"
                  onClick={() => setForm({ email: u.email, password: u.password })}
                  className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/[0.03] transition-colors group">
                  <span className="text-xs font-semibold text-gray-700">{u.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-400">{u.email}</span>
                    <ChevronRight size={12} className="text-gray-300 group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
