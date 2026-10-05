"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Camera, Lock, CheckCircle2, Eye, EyeOff, X } from "lucide-react";
import Image from "next/image";

type Profile = { id: string; name: string; email: string; phone: string | null; avatarUrl: string | null; role: string };

const ROLE_LABEL: Record<string, string> = {
  SYSTEM_ADMINISTRATOR: "Administrator", WASCO_MANAGER: "WASCO Manager",
  LEAKAGE_OFFICER: "Leakage Officer", FIELD_TECHNICIAN: "Field Technician", REPORTER: "Reporter",
};

function initials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile").then(r => r.json()).then((data: Profile) => {
      setProfile(data); setName(data.name); setPhone(data.phone ?? ""); setLoading(false);
    });
  }, [status]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setNotice("");
    const res = await fetch("/api/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone: phone || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Could not save profile.");
    setProfile(data); await update({ name: data.name }); setNotice("Profile updated successfully.");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) return setError("New passwords do not match.");
    setSaving(true); setError(""); setNotice("");
    const res = await fetch("/api/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Could not change password.");
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setNotice("Password changed successfully.");
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(""); setNotice("");
    const fd = new FormData(); fd.append("files", file);
    const up = await fetch("/api/upload", { method: "POST", body: fd });
    if (!up.ok) { setUploading(false); return setError("Avatar upload failed."); }
    const { urls } = await up.json();
    const res = await fetch("/api/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl: urls[0] }),
    });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) return setError(data.error ?? "Could not save avatar.");
    setProfile(data); setNotice("Avatar updated.");
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm text-gray-400">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-white";

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* Hero */}
      <div className="bg-primary px-6 pt-8 pb-20">
        <div className="max-w-2xl mx-auto">
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Account</p>
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="text-white/60 text-sm mt-1">Manage your personal information and security.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-12 pb-12 space-y-4">
        {/* Alerts */}
        {error && (
          <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-5 py-3.5">
            <span>{error}</span>
            <button onClick={() => setError("")}><X size={14} /></button>
          </div>
        )}
        {notice && (
          <div className="flex items-center gap-2.5 bg-green-50 border border-green-100 text-green-700 text-sm rounded-2xl px-5 py-3.5">
            <CheckCircle2 size={15} className="shrink-0" /> {notice}
          </div>
        )}

        {/* Avatar card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
          <div className="relative shrink-0">
            {profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt={profile.name} width={72} height={72}
                className="rounded-2xl object-cover border border-gray-100" />
            ) : (
              <div className="w-[72px] h-[72px] rounded-2xl bg-primary flex items-center justify-center">
                <span className="text-white text-xl font-black">{initials(profile.name)}</span>
              </div>
            )}
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="absolute -bottom-1.5 -right-1.5 h-7 w-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors">
              {uploading ? <Loader2 size={12} className="animate-spin text-primary" /> : <Camera size={12} className="text-gray-600" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-lg leading-tight truncate">{profile.name}</p>
            <p className="text-sm text-gray-400 truncate">{profile.email}</p>
            <span className="inline-block mt-2 text-[11px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-2.5 py-1 rounded-full">
              {ROLE_LABEL[profile.role] ?? profile.role}
            </span>
          </div>
        </div>

        {/* Personal info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Personal Information</p>
          </div>
          <form onSubmit={saveProfile} className="px-6 py-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Full Name</label>
                <input required value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your full name" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Email</label>
                <input value={profile.email} disabled
                  className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400 bg-gray-50 cursor-not-allowed" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Phone Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. +266 5000 0000" className={inputCls} />
              </div>
            </div>
            <button disabled={saving}
              className="bg-primary text-white rounded-xl px-6 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
              {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Lock size={13} className="text-gray-400" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Change Password</p>
          </div>
          <form onSubmit={changePassword} className="px-6 py-6 space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Current Password</label>
              <input required type={showPw ? "text" : "password"} placeholder="Current password"
                value={currentPw} onChange={e => setCurrentPw(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">New Password</label>
              <div className="relative">
                <input required type={showPw ? "text" : "password"} minLength={12}
                  placeholder="Min. 12 characters" value={newPw}
                  onChange={e => setNewPw(e.target.value)} className={`${inputCls} pr-11`} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Confirm New Password</label>
              <input required type={showPw ? "text" : "password"} minLength={12}
                placeholder="Repeat new password" value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                className={`${inputCls} ${confirmPw && confirmPw !== newPw ? "border-red-300 focus:ring-red-200" : ""}`} />
              {confirmPw && confirmPw !== newPw && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            <button disabled={saving}
              className="bg-primary text-white rounded-xl px-6 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2 mt-1">
              {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
