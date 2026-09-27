"use client";
import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) return setError("Invalid email or password.");
    const signedInSession = await getSession();
    const role = (signedInSession?.user as { role?: string } | undefined)?.role;
    const destination: Record<string, string> = {
      SYSTEM_ADMINISTRATOR: "/admin/users",
      WASCO_MANAGER: "/manager/dashboard",
      LEAKAGE_OFFICER: "/officer/reports",
      FIELD_TECHNICIAN: "/technician/cases",
      REPORTER: "/dashboard",
    };
    router.push(destination[role ?? ""] ?? "/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <Image src="/Logo.png" alt="WASCO" width={52} height={52} className="object-contain mb-3" />
          <h1 className="text-2xl font-bold text-primary">Sign In</h1>
          <p className="text-gray-500 text-sm mt-1">WASCO Leak Track</p>
        </div>

        {params.get("registered") && (
          <p className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
            Account created! You can now sign in.
          </p>
        )}
        {error && <p className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email" required placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" required placeholder="Your password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-100 pt-5">
          <p className="text-xs text-gray-400 text-center mb-3">Demo accounts — click to fill</p>
          <div className="grid grid-cols-1 gap-2">
            {([
              { label: "System Administrator", email: "admin@wasco.com",       password: "Admin@Wasco2024!" },
              { label: "WASCO Manager",         email: "manager@wasco.com",     password: "Manager@Wasco2024!" },
              { label: "Leakage Officer",       email: "officer@wasco.com",     password: "Officer@Wasco2024!" },
              { label: "Field Technician",      email: "technician@wasco.com",  password: "Technician@Wasco2024!" },
              { label: "Reporter",              email: "reporter@wasco.com",    password: "Reporter@Wasco2024!" },
            ] as { label: string; email: string; password: string }[]).map(u => (
              <button
                key={u.email}
                type="button"
                onClick={() => setForm({ email: u.email, password: u.password })}
                className="flex justify-between items-center w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <span className="text-xs font-medium text-gray-700">{u.label}</span>
                <span className="text-xs text-gray-400">{u.email}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
