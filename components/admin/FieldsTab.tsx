"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Field } from "@/lib/types";

type Notify = (msg: string, err?: boolean) => void;

export default function FieldsTab({ initial, onSaved, notify }: { initial: Field[]; onSaved: () => void; notify: Notify }) {
  const [list, setList] = useState<Field[]>(initial);
  const [edit, setEdit] = useState<Partial<Field> | null>(null);
  const supabase = createClient();

  async function save() {
    if (!edit?.title?.trim()) return notify("Judul wajib diisi", true);
    const payload = { title: edit.title.trim(), description: edit.description || null };
    if (edit.id) {
      const { error } = await supabase.from("fields").update(payload).eq("id", edit.id);
      if (error) return notify(error.message, true);
      setList((l) => l.map((f) => (f.id === edit.id ? { ...f, ...payload } : f)));
    } else {
      const { data, error } = await supabase.from("fields").insert({ ...payload, sort_order: list.length + 1 }).select().single();
      if (error) return notify(error.message, true);
      setList((l) => [...l, data as Field]);
    }
    setEdit(null);
    notify("Bidang tersimpan");
    onSaved();
  }

  async function remove(f: Field) {
    if (!confirm(`Hapus "${f.title}"?`)) return;
    const { error } = await supabase.from("fields").delete().eq("id", f.id);
    if (error) return notify(error.message, true);
    setList((l) => l.filter((x) => x.id !== f.id));
    notify("Bidang dihapus");
    onSaved();
  }

  async function move(i: number, d: number) {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
    await Promise.all(next.map((f, k) => supabase.from("fields").update({ sort_order: k + 1 }).eq("id", f.id)));
    onSaved();
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 className="adm-title">Bidang</h1>
          <p className="adm-sub">Keahlian yang tampil di teks berjalan dan bagian “Tentang”.</p>
        </div>
        <button className="b b-pri" onClick={() => setEdit({ title: "", description: "" })}>+ Tambah bidang</button>
      </div>

      <div className="card">
        {list.length === 0 ? (
          <p className="empty">Belum ada bidang.</p>
        ) : (
          <div className="rows">
            {list.map((f, i) => (
              <div className="row" key={f.id}>
                <span className="mono" style={{ width: 24 }}>{String(i + 1).padStart(2, "0")}</span>
                <div className="row-main">
                  <b>{f.title}</b>
                  <span>{f.description}</span>
                </div>
                <div className="row-btns">
                  <button className="b b-icon b-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Naik">↑</button>
                  <button className="b b-icon b-sm" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Turun">↓</button>
                  <button className="b b-sm" onClick={() => setEdit(f)}>Ubah</button>
                  <button className="b b-sm b-danger" onClick={() => remove(f)}>Hapus</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {edit && (
        <div className="modal-bg" onClick={() => setEdit(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{edit.id ? "Ubah bidang" : "Bidang baru"}</h3>
            <div className="fld" style={{ marginBottom: 14 }}>
              <label>Judul</label>
              <input className="inp" autoFocus value={edit.title ?? ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} placeholder="Motion Graphic" />
            </div>
            <div className="fld">
              <label>Deskripsi singkat</label>
              <textarea className="inp" rows={3} value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
            </div>
            <div className="save-bar">
              <button className="b" onClick={() => setEdit(null)}>Batal</button>
              <button className="b b-pri" onClick={save}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
