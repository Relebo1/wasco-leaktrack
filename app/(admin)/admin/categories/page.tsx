"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Category = { id: string; label: string; isActive: boolean };
export default function CategoriesPage() {
  const { data: session, status } = useSession(); const router = useRouter();
  const [rows, setRows] = useState<Category[]>([]); const [id, setId] = useState(""); const [label, setLabel] = useState(""); const [error, setError] = useState("");
  async function load() { const r = await fetch("/api/categories"); if (r.ok) setRows(await r.json()); }
  // eslint-disable-next-line react-hooks/set-state-in-effect -- load asynchronously after session hydration.
  useEffect(() => { if (status === "unauthenticated") router.push("/login"); if (status === "authenticated" && (session?.user as {role?: string})?.role !== "SYSTEM_ADMINISTRATOR") router.push("/dashboard"); if (status === "authenticated") void load(); }, [status, session, router]);
  async function save(valueId = id, valueLabel = label) { setError(""); const r = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: valueId, label: valueLabel }) }); const data = await r.json(); if (!r.ok) return setError(data.error); setId(""); setLabel(""); await load(); }
  async function toggle(c: Category) { const r = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, label: c.label, isActive: !c.isActive }) }); if (!r.ok) setError("Could not update category."); await load(); }
  return <main className="max-w-3xl mx-auto p-8"><Link href="/admin/users" className="text-primary text-sm">← User management</Link><h1 className="text-2xl font-bold mt-4">Leak categories</h1><p className="text-sm text-gray-500 mt-1">Create, rename, and deactivate report categories.</p>{error && <p role="alert" className="text-red-600 mt-3">{error}</p>}<div className="flex gap-2 my-6"><input aria-label="Category code" placeholder="CATEGORY_CODE" value={id} onChange={e=>setId(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g,"_"))} className="border rounded px-3 py-2"/><input aria-label="Category label" placeholder="Category label" value={label} onChange={e=>setLabel(e.target.value)} className="border rounded px-3 py-2 flex-1"/><button onClick={()=>save()} className="bg-primary text-white rounded px-4">Save</button></div><div className="divide-y bg-white border rounded">{rows.map(c=><div key={c.id} className="flex items-center gap-2 p-3"><strong className="w-36">{c.id}</strong><input aria-label={`Label for ${c.id}`} defaultValue={c.label} className="border rounded px-2 py-1 flex-1" onBlur={e=>{if(e.target.value!==c.label) void save(c.id,e.target.value)}}/><button onClick={()=>void toggle(c)} className="text-primary">{c.isActive?"Deactivate":"Activate"}</button></div>)}</div></main>;
}
