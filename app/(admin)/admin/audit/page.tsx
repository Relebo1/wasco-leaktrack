"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Row = { id: string; action: string; detail: string | null; createdAt: string; user: { name: string; email: string; role: string } | null; report: { referenceNumber: string } | null };
type Page = { logs: Row[]; nextCursor: string | null };
export default function AuditPage() {
  const { data: session, status } = useSession(); const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]); const [cursor, setCursor] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  async function load(next?: string) { setLoading(true); const response = await fetch(`/api/audit-logs${next ? `?cursor=${encodeURIComponent(next)}` : ""}`); const page: Page = response.ok ? await response.json() : { logs: [], nextCursor: null }; setRows(old => next ? [...old, ...page.logs] : page.logs); setCursor(page.nextCursor); setLoading(false); }
  // eslint-disable-next-line react-hooks/set-state-in-effect -- load asynchronously after session hydration.
  useEffect(() => { if (status === "unauthenticated") router.push("/login"); if (status === "authenticated" && (session?.user as { role?: string })?.role !== "SYSTEM_ADMINISTRATOR") router.push("/dashboard"); if (status === "authenticated") void load(); }, [status, session, router]);
  return <main className="max-w-5xl mx-auto p-8"><Link href="/admin/users" className="text-primary text-sm">← User management</Link><h1 className="text-2xl font-bold mt-4">Audit log</h1><p className="text-sm text-gray-500 mt-1">Recorded user and case activities.</p><div className="overflow-x-auto mt-5 border rounded bg-white"><table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="p-3">Time</th><th className="p-3">User</th><th className="p-3">Action</th><th className="p-3">Case</th><th className="p-3">Detail</th></tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-b"><td className="p-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td><td className="p-3">{r.user?.name??"System"}</td><td className="p-3">{r.action}</td><td className="p-3">{r.report?.referenceNumber??"—"}</td><td className="p-3">{r.detail??"—"}</td></tr>)}</tbody></table>{!rows.length&&!loading&&<p className="p-6 text-gray-500">No activity recorded.</p>}</div>{cursor&&<button disabled={loading} onClick={()=>void load(cursor)} className="mt-4 border rounded px-4 py-2 text-sm">{loading?"Loading…":"Load older activity"}</button>}</main>;
}
