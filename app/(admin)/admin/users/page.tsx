"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, UserPlus, ShieldCheck } from "lucide-react";

type ManagedUser = { id: string; name: string; email: string; role: string; isActive: boolean };
const ROLES = [
  ["REPORTER", "Public User"],
  ["FIELD_TECHNICIAN", "Field Technician"],
  ["LEAKAGE_OFFICER", "Leakage Officer"],
  ["WASCO_MANAGER", "WASCO Manager"],
  ["SYSTEM_ADMINISTRATOR", "Administrator"],
];

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "FIELD_TECHNICIAN" });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as { role?: string })?.role !== "SYSTEM_ADMINISTRATOR") router.push("/dashboard");
  }, [status, session, router]);

  const loadUsers = useCallback(async () => {
    const response = await fetch("/api/users");
    if (!response.ok) {
      setError("You do not have permission to manage accounts.");
      setLoading(false);
      return;
    }
    setUsers(await response.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated" && (session?.user as { role?: string })?.role === "SYSTEM_ADMINISTRATOR") loadUsers();
  }, [status, session, loadUsers]);

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    const response = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newUser),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setError(data.error ?? "Account could not be created.");
    setNewUser({ name: "", email: "", password: "", role: "FIELD_TECHNICIAN" });
    setNotice(`Account created for ${data.email}.`);
    await loadUsers();
  }

  async function updateUser(id: string, updates: Record<string, unknown>, success: string) {
    setSaving(true); setError(""); setNotice("");
    const response = await fetch(`/api/users/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setError(data.error ?? "Account could not be updated.");
    setNotice(success);
    setPasswords(current => ({ ...current, [id]: "" }));
    await loadUsers();
  }

  if (status === "loading" || loading) return <div className="min-h-screen flex items-center justify-center text-gray-500"><Loader2 className="animate-spin mr-2" />Loading accounts…</div>;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/manager/dashboard" className="text-sm text-primary hover:underline">← Management dashboard</Link>
        <nav className="flex gap-4 mt-3 text-sm"><Link href="/admin/categories" className="text-primary hover:underline">Leak categories</Link><Link href="/admin/settings" className="text-primary hover:underline">System settings</Link><Link href="/admin/audit" className="text-primary hover:underline">Audit log</Link></nav>
        <div className="mt-5 mb-7">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2"><ShieldCheck size={23} /> User management</h1>
          <p className="text-sm text-gray-500 mt-1">Create staff accounts, change roles, reset passwords, and enable or disable access.</p>
        </div>

        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{notice}</p>}

        <form onSubmit={createUser} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-7">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4"><UserPlus size={18} /> Create account</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input required aria-label="Full name" placeholder="Full name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
            <input required type="email" aria-label="Email address" placeholder="Email address" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
            <input required type="password" minLength={12} aria-label="Temporary password" placeholder="Temporary password (12+ characters)" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
            <select aria-label="Account role" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white">
              {ROLES.map(([role, label]) => <option key={role} value={role}>{label}</option>)}
            </select>
          </div>
          <button disabled={saving} className="mt-4 bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60">{saving ? "Saving…" : "Create account"}</button>
        </form>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-800">Accounts ({users.length})</h2></div>
          {users.length === 0 ? <p className="p-5 text-sm text-gray-500">No accounts found.</p> : <div className="divide-y divide-gray-100">
            {users.map(user => <article key={user.id} className="p-5 grid lg:grid-cols-[1fr_180px_120px] gap-4 items-center">
              <div className="min-w-0">
                <p className="font-medium text-gray-800 truncate">{user.name}</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                <span className={`inline-block mt-1 text-xs font-medium ${user.isActive ? "text-green-700" : "text-red-600"}`}>{user.isActive ? "Active" : "Disabled"}</span>
              </div>
              <select aria-label={`Role for ${user.email}`} value={user.role} disabled={saving} onChange={e => updateUser(user.id, { role: e.target.value }, "Account role updated.")} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                {ROLES.map(([role, label]) => <option key={role} value={role}>{label}</option>)}
              </select>
              <button disabled={saving} onClick={() => updateUser(user.id, { isActive: !user.isActive }, user.isActive ? "Account disabled." : "Account enabled.")} className="border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60">{user.isActive ? "Disable" : "Enable"}</button>
              <div className="lg:col-span-3 flex flex-col sm:flex-row gap-2">
                <input type="password" minLength={12} aria-label={`New password for ${user.email}`} placeholder="New password (12+ characters)" value={passwords[user.id] ?? ""} onChange={e => setPasswords({ ...passwords, [user.id]: e.target.value })} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <button type="button" disabled={saving || (passwords[user.id] ?? "").length < 12} onClick={() => updateUser(user.id, { password: passwords[user.id] }, "Password reset.")} className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Reset password</button>
              </div>
            </article>)}
          </div>}
        </section>
      </div>
    </main>
  );
}
