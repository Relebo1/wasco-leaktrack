"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Plus, X, KeyRound, ChevronLeft, ChevronRight } from "lucide-react";

type ManagedUser = { id: string; name: string; email: string; role: string; isActive: boolean };

const STAFF_ROLES: [string, string][] = [
  ["FIELD_TECHNICIAN", "Field Technician"],
  ["LEAKAGE_OFFICER", "Leakage Officer"],
  ["WASCO_MANAGER", "WASCO Manager"],
  ["SYSTEM_ADMINISTRATOR", "Administrator"],
];

const ALL_ROLES: [string, string][] = [
  ["REPORTER", "Reporter (Public)"],
  ...STAFF_ROLES,
];

const PAGE_SIZE = 10;

const emptyForm = { name: "", email: "", password: "", role: "FIELD_TECHNICIAN" };

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // modal state
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState(emptyForm);

  // pagination
  const [page, setPage] = useState(1);

  // inline password reset
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as { role?: string })?.role !== "SYSTEM_ADMINISTRATOR")
      router.push("/dashboard");
  }, [status, session, router]);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (!res.ok) { setError("You do not have permission to manage accounts."); setLoading(false); return; }
    setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated" && (session?.user as { role?: string })?.role === "SYSTEM_ADMINISTRATOR")
      loadUsers();
  }, [status, session, loadUsers]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setNotice("");
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newUser) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Account could not be created.");
    setNewUser(emptyForm);
    setShowAdd(false);
    setNotice(`Account created for ${data.email}.`);
    setPage(1);
    await loadUsers();
  }

  async function patch(id: string, updates: Record<string, unknown>, success: string) {
    setSaving(true); setError(""); setNotice("");
    const res = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Account could not be updated.");
    setNotice(success);
    setResetId(null); setResetPw("");
    await loadUsers();
  }

  if (status === "loading" || loading)
    return <div className="min-h-screen flex items-center justify-center text-gray-500"><Loader2 className="animate-spin mr-2" />Loading accounts…</div>;

  return (
    <main className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mt-5 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2"><ShieldCheck size={22} />User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create staff accounts, change roles, reset passwords, and enable or disable access.</p>
        </div>
        <button onClick={() => { setShowAdd(true); setError(""); setNotice(""); }}
          className="flex items-center gap-2 bg-primary text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:opacity-90">
          <Plus size={16} />Add User
        </button>
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{notice}</p>}

      {/* Table */}
      {(() => {
        const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
        const safePage = Math.min(page, totalPages);
        const paged = users.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
        return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-5 py-3 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No accounts found.</td></tr>
            )}
            {paged.map(user => (
              <Fragment key={user.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{user.name}</td>
                  <td className="px-5 py-3 text-gray-500">{user.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={user.role}
                      disabled={saving}
                      onChange={e => patch(user.id, { role: e.target.value }, "Role updated.")}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white"
                    >
                      {ALL_ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {user.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        disabled={saving}
                        onClick={() => { setResetId(resetId === user.id ? null : user.id); setResetPw(""); }}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                        title="Reset password"
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        disabled={saving}
                        onClick={() => patch(user.id, { isActive: !user.isActive }, user.isActive ? "Account disabled." : "Account enabled.")}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border disabled:opacity-50 ${user.isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-700 hover:bg-green-50"}`}
                      >
                        {user.isActive ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </td>
                </tr>
                {resetId === user.id && (
                  <tr className="bg-blue-50">
                    <td colSpan={5} className="px-5 py-3">
                      <div className="flex items-center gap-2 max-w-md">
                        <input
                          type="password"
                          minLength={12}
                          placeholder="New password (12+ characters)"
                          value={resetPw}
                          onChange={e => setResetPw(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                        <button
                          disabled={saving || resetPw.length < 12}
                          onClick={() => patch(user.id, { password: resetPw }, "Password reset.")}
                          className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button onClick={() => { setResetId(null); setResetPw(""); }} className="p-2 text-gray-400 hover:text-gray-600">
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {/* Pagination footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50 text-sm text-gray-500">
          <span>Showing {users.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, users.length)} of {users.length}</span>
          <div className="flex items-center gap-1">
            <button disabled={safePage === 1} onClick={() => setPage(safePage - 1)}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40">
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium border ${
                  p === safePage ? "bg-primary text-white border-primary" : "border-gray-200 hover:bg-gray-100"
                }`}>
                {p}
              </button>
            ))}
            <button disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
        );
      })()}

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-800 text-lg">Add User</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={createUser} className="flex flex-col gap-3">
              <input required placeholder="Full name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
              <input required type="email" placeholder="Email address" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
              <input required type="password" minLength={12} placeholder="Temporary password (12+ characters)" value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
              <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white">
                {STAFF_ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button disabled={saving} className="flex-1 bg-primary text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60">
                  {saving ? "Creating…" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
