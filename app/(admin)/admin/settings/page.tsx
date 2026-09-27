"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session, status } = useSession(); const router = useRouter();
  const [allowAnonymous, setAllowAnonymous] = useState(true); const [uploadLimit, setUploadLimit] = useState("10"); const [message, setMessage] = useState("");
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as { role?: string })?.role !== "SYSTEM_ADMINISTRATOR") router.push("/dashboard");
    if (status === "authenticated") void fetch("/api/settings").then(r => r.ok ? r.json() : []).then((rows: { key: string; value: string }[]) => {
      const values = Object.fromEntries(rows.map(row => [row.key, row.value]));
      setAllowAnonymous(values.allowAnonymousReports !== "false");
      setUploadLimit(values.uploadMaxMegabytes ?? "10");
    });
  }, [status, session, router]);
  async function save() {
    const response = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ allowAnonymousReports: String(allowAnonymous), uploadMaxMegabytes: uploadLimit }) });
    const data = await response.json();
    setMessage(response.ok ? "Settings saved and applied." : data.error ?? "Settings could not be saved.");
  }
  return <main className="max-w-3xl mx-auto p-8"><Link href="/admin/users" className="text-primary text-sm">← User management</Link><h1 className="text-2xl font-bold mt-4">System settings</h1><p className="text-sm text-gray-500 mt-1">Changes apply to new reports and photo uploads.</p><section className="mt-6 space-y-5 border rounded-xl bg-white p-5"><label className="flex items-center justify-between gap-4"><span><strong className="block">Allow anonymous reports</strong><span className="text-sm text-gray-500">Let visitors submit reports without an account.</span></span><input type="checkbox" checked={allowAnonymous} onChange={e => setAllowAnonymous(e.target.checked)} /></label><label className="block"><strong className="block">Maximum image size</strong><span className="text-sm text-gray-500">Megabytes per uploaded image (1–25).</span><input type="number" min={1} max={25} value={uploadLimit} onChange={e => setUploadLimit(e.target.value)} className="mt-2 border rounded px-3 py-2" /></label></section><button onClick={() => void save()} className="mt-5 bg-primary text-white rounded px-5 py-2">Save settings</button>{message&&<p role="status" className="mt-3 text-sm">{message}</p>}</main>;
}
