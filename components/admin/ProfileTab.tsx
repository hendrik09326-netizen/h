"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import ImageUpload from "./ImageUpload";

type Notify = (msg: string, err?: boolean) => void;

export default function ProfileTab({ initial, onSaved, notify }: { initial: Profile; onSaved: () => void; notify: Notify }) {
  const [p, setP] = useState<Profile>(initial);
  const [words, setWords] = useState((initial.rotating_words ?? []).join(", "));
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));
  const txt = (k: keyof Profile) => ({
    value: (p[k] as string | null) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, (e.target.value || null) as never),
  });

  async function save() {
    setBusy(true);
    const { id: _id, ...rest } = p;
    void _id;
    const { error } = await createClient()
      .from("profile")
      .update({
        ...rest,
        name: p.name || "Nama Kamu",
        rotating_words: words.split(",").map((w) => w.trim()).filter(Boolean),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    setBusy(false);
    if (error) return notify(error.message, true);
    notify("Profil tersimpan");
    onSaved();
  }

  return (
    <>
      <h1 className="adm-title">Profil</h1>
      <p className="adm-sub">Foto, nama, narasi, dan kontak yang tampil di halaman utama.</p>

      <div className="card">
        <h3>Foto & identitas</h3>
        <div className="form-grid">
          <div className="fld">
            <label>Foto profil</label>
            <ImageUpload value={p.photo_url} onChange={(u) => set("photo_url", u)} folder="profile" hint="Rasio potret 4:5 paling bagus" />
          </div>
          <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
            <div className="fld">
              <label>Nama lengkap</label>
              <input className="inp" {...txt("name")} />
              <small>Kata terakhir tampil miring dengan warna aksen.</small>
            </div>
            <div className="fld">
              <label>Peran utama</label>
              <input className="inp" {...txt("role")} placeholder="Designer & Content Creator" />
            </div>
            <div className="fld">
              <label>Lokasi</label>
              <input className="inp" {...txt("location")} />
            </div>
            <label className="switch">
              <input type="checkbox" checked={p.available} onChange={(e) => set("available", e.target.checked)} />
              <span />
              Terbuka untuk proyek baru
            </label>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Narasi</h3>
        <div className="form-grid">
          <div className="fld full">
            <label>Teks berganti di hero</label>
            <input className="inp" value={words} onChange={(e) => setWords(e.target.value)} placeholder="Graphic Designer, UI Designer, Content Creator" />
            <small>Pisahkan dengan koma. Tampil bergantian setelah “Saya seorang…”.</small>
          </div>
          <div className="fld full">
            <label>Kalimat pembuka (headline)</label>
            <textarea className="inp" rows={2} {...txt("headline")} />
          </div>
          <div className="fld full">
            <label>Tentang saya (bio)</label>
            <textarea className="inp" rows={6} {...txt("bio")} />
            <small>Tekan Enter untuk paragraf baru.</small>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Kontak & media sosial</h3>
        <div className="form-grid">
          <div className="fld"><label>Email</label><input className="inp" type="email" {...txt("email")} /></div>
          <div className="fld"><label>WhatsApp</label><input className="inp" {...txt("whatsapp")} placeholder="0812xxxx" /></div>
          <div className="fld"><label>Instagram</label><input className="inp" {...txt("instagram")} placeholder="@username atau link" /></div>
          <div className="fld"><label>TikTok</label><input className="inp" {...txt("tiktok")} placeholder="@username atau link" /></div>
          <div className="fld"><label>YouTube</label><input className="inp" {...txt("youtube")} placeholder="@channel atau link" /></div>
          <div className="fld"><label>LinkedIn</label><input className="inp" {...txt("linkedin")} placeholder="username atau link" /></div>
          <div className="fld"><label>GitHub</label><input className="inp" {...txt("github")} placeholder="username atau link" /></div>
          <div className="fld"><label>Link CV (opsional)</label><input className="inp" {...txt("cv_url")} placeholder="https://drive.google.com/..." /></div>
        </div>
      </div>

      <div className="card">
        <h3>Tampilan</h3>
        <div className="fld">
          <label>Warna aksen</label>
          <div className="color-row">
            <input type="color" value={p.accent_color ?? "#ff6a3d"} onChange={(e) => set("accent_color", e.target.value)} />
            <input className="inp" style={{ maxWidth: 140 }} {...txt("accent_color")} />
            {["#ff6a3d", "#c8ff3d", "#7aa2ff", "#f5d061", "#ff5fa2"].map((c) => (
              <button key={c} type="button" onClick={() => set("accent_color", c)} aria-label={c}
                style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: p.accent_color === c ? "2px solid var(--text)" : "none" }} />
            ))}
          </div>
        </div>
      </div>

      <div className="save-bar">
        <button className="b b-pri" onClick={save} disabled={busy}>{busy ? "Menyimpan…" : "Simpan profil"}</button>
      </div>
    </>
  );
}
