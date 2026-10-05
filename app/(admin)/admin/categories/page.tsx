"use client";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Tag, Plus, Loader2, ToggleLeft, ToggleRight, Pencil, Check, X } from "lucide-react";

type Category = { id: string; label: string; isActive: boolean };

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newId, setNewId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as { role?: string })?.role !== "SYSTEM_ADMINISTRATOR")
      router.push("/dashboard");
  }, [status, session, router]);

  const load = useCallback(async () => {
    const r = await fetch("/api/categories");
    if (r.ok) setRows(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [status, load]);

  async function upsert(id: string, label: string, extra?: Partial<Category>) {
    setSaving(true); setError(""); setNotice("");
    const r = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, label, ...extra }),
    });
    const data = await r.json();
    setSaving(false);
    if (!r.ok) { setError(data.error ?? "Could not save category."); return false; }
    return true;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const ok = await upsert(newId, newLabel);
    if (ok) { setNewId(""); setNewLabel(""); setNotice("Category created."); await load(); }
  }

  async function handleRename(c: Category) {
    if (editLabel.trim() === c.label) { setEditingId(null); return; }
    const ok = await upsert(c.id, editLabel.trim());
    if (ok) { setEditingId(null); setNotice("Category updated."); await load(); }
  }

  async function handleToggle(c: Category) {
    const ok = await upsert(c.id, c.label, { isActive: !c.isActive });
    if (ok) { setNotice(c.isActive ? "Category deactivated." : "Category activated."); await load(); }
  }

  const active = rows.filter(r => r.isActive);
  const inactive = rows.filter(r => !r.isActive);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <Loader2 size={22} className="animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa]">

      {/* Header band */}
      <div className="bg-primary px-8 pt-8 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Tag size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Leak Categories</h1>
              <p className="text-blue-200 text-sm mt-0.5">Create, rename, and toggle report categories.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 -mt-10 pb-12 space-y-6">

        {/* Feedback */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <X size={15} className="shrink-0" /> {error}
          </div>
        )}
        {notice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <Check size={15} className="shrink-0" /> {notice}
          </div>
        )}

        {/* Create card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Plus size={13} /> New Category
          </p>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <input
              required
              aria-label="Category code"
              placeholder="CATEGORY_CODE"
              value={newId}
              onChange={e => setNewId(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))}
              className="font-mono text-sm border border-gray-200 rounded-xl px-4 py-2.5 w-44 shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <input
              required
              aria-label="Category label"
              placeholder="Human-readable label"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-4 py-2.5 flex-1 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity shrink-0"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : "Add"}
            </button>
          </form>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Active categories */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active</p>
              <span className="text-xs font-bold text-accent bg-emerald-50 px-2.5 py-1 rounded-full">{active.length}</span>
            </div>
            {active.length === 0 ? (
              <p className="text-sm text-gray-400 px-6 py-8 text-center">No active categories.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {active.map(c => (
                  <CategoryRow
                    key={c.id}
                    category={c}
                    editing={editingId === c.id}
                    editLabel={editLabel}
                    saving={saving}
                    onStartEdit={() => { setEditingId(c.id); setEditLabel(c.label); }}
                    onCancelEdit={() => setEditingId(null)}
                    onSaveEdit={() => handleRename(c)}
                    onEditLabelChange={setEditLabel}
                    onToggle={() => handleToggle(c)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Inactive categories */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Inactive</p>
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{inactive.length}</span>
            </div>
            {inactive.length === 0 ? (
              <p className="text-sm text-gray-400 px-6 py-8 text-center">No inactive categories.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {inactive.map(c => (
                  <CategoryRow
                    key={c.id}
                    category={c}
                    editing={editingId === c.id}
                    editLabel={editLabel}
                    saving={saving}
                    onStartEdit={() => { setEditingId(c.id); setEditLabel(c.label); }}
                    onCancelEdit={() => setEditingId(null)}
                    onSaveEdit={() => handleRename(c)}
                    onEditLabelChange={setEditLabel}
                    onToggle={() => handleToggle(c)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function CategoryRow({ category, editing, editLabel, saving, onStartEdit, onCancelEdit, onSaveEdit, onEditLabelChange, onToggle }: {
  category: Category;
  editing: boolean;
  editLabel: string;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditLabelChange: (v: string) => void;
  onToggle: () => void;
}) {
  const { id, label, isActive } = category;
  return (
    <div className={`flex items-center gap-4 px-6 py-4 transition-colors ${!isActive ? "opacity-50" : ""}`}>
      <span className="font-mono text-xs font-bold text-primary bg-primary/8 px-2.5 py-1.5 rounded-lg shrink-0 w-44 truncate">
        {id}
      </span>

      {editing ? (
        <input
          autoFocus
          value={editLabel}
          onChange={e => onEditLabelChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") onSaveEdit(); if (e.key === "Escape") onCancelEdit(); }}
          className="flex-1 text-sm border border-primary/40 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      ) : (
        <span className="flex-1 text-sm text-gray-700 font-medium">{label}</span>
      )}

      <div className="flex items-center gap-1 shrink-0">
        {editing ? (
          <>
            <button onClick={onSaveEdit} disabled={saving}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
              <Check size={15} />
            </button>
            <button onClick={onCancelEdit}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
              <X size={15} />
            </button>
          </>
        ) : (
          <button onClick={onStartEdit}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <Pencil size={14} />
          </button>
        )}
        <button onClick={onToggle} disabled={saving}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            isActive ? "text-accent hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-100"
          }`}>
          {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
        </button>
      </div>
    </div>
  );
}
