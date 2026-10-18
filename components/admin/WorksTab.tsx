"use client";

import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteImage, uploadImage } from "@/lib/upload";
import { LAYOUT_LABEL, type Layout, type Section, type Work } from "@/lib/types";
import ImageUpload from "./ImageUpload";

type Notify = (msg: string, err?: boolean) => void;

const LAYOUT_HINT: Record<Layout, string> = {
  carousel: "Gambar berjalan otomatis, klik untuk memperbesar. Cocok untuk desain & UI.",
  grid: "Susunan masonry, cocok untuk gambar dengan ukuran berbeda-beda.",
  video: "Thumbnail 16:9 + tombol play, mengarah ke link video (YouTube/TikTok/IG).",
  website: "Screenshot dalam bingkai browser, bergulir saat disorot, dengan tombol kunjungi.",
};

export default function WorksTab({
  initialSections,
  initialWorks,
  onSaved,
  notify,
}: {
  initialSections: Section[];
  initialWorks: Work[];
  onSaved: () => void;
  notify: Notify;
}) {
  const supabase = createClient();
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [works, setWorks] = useState<Work[]>(initialWorks);
  const [activeId, setActiveId] = useState<string | null>(initialSections[0]?.id ?? null);
  const [secEdit, setSecEdit] = useState<Partial<Section> | null>(null);
  const [workEdit, setWorkEdit] = useState<(Partial<Work> & { tagsText?: string }) | null>(null);
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);
  const bulkInput = useRef<HTMLInputElement>(null);

  const active = sections.find((s) => s.id === activeId) ?? null;
  const items = useMemo(
    () => works.filter((w) => w.section_id === activeId).sort((a, b) => a.sort_order - b.sort_order),
    [works, activeId]
  );

  /* ---------- Seksi ---------- */
  async function saveSection() {
    if (!secEdit?.title?.trim()) return notify("Judul seksi wajib diisi", true);
    const payload = {
      title: secEdit.title.trim(),
      subtitle: secEdit.subtitle || null,
      layout: (secEdit.layout ?? "carousel") as Layout,
      visible: secEdit.visible ?? true,
    };
    if (secEdit.id) {
      const { error } = await supabase.from("sections").update(payload).eq("id", secEdit.id);
      if (error) return notify(error.message, true);
      setSections((l) => l.map((s) => (s.id === secEdit.id ? { ...s, ...payload } : s)));
    } else {
      const { data, error } = await supabase.from("sections").insert({ ...payload, sort_order: sections.length + 1 }).select().single();
      if (error) return notify(error.message, true);
      setSections((l) => [...l, data as Section]);
      setActiveId((data as Section).id);
    }
    setSecEdit(null);
    notify("Seksi tersimpan");
    onSaved();
  }

  async function removeSection(s: Section) {
    const n = works.filter((w) => w.section_id === s.id).length;
    if (!confirm(`Hapus seksi "${s.title}" beserta ${n} karya di dalamnya?`)) return;
    const toDelete = works.filter((w) => w.section_id === s.id);
    const { error } = await supabase.from("sections").delete().eq("id", s.id);
    if (error) return notify(error.message, true);
    toDelete.forEach((w) => deleteImage(w.image_url).catch(() => {}));
    setSections((l) => l.filter((x) => x.id !== s.id));
    setWorks((l) => l.filter((w) => w.section_id !== s.id));
    setActiveId(sections.find((x) => x.id !== s.id)?.id ?? null);
    notify("Seksi dihapus");
    onSaved();
  }

  async function moveSection(i: number, d: number) {
    const j = i + d;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    setSections(next);
    await Promise.all(next.map((s, k) => supabase.from("sections").update({ sort_order: k + 1 }).eq("id", s.id)));
    onSaved();
  }

  /* ---------- Karya ---------- */
  async function saveWork() {
    if (!workEdit || !activeId) return;
    if (!workEdit.title?.trim()) return notify("Judul karya wajib diisi", true);
    const payload = {
      section_id: workEdit.section_id ?? activeId,
      title: workEdit.title.trim(),
      description: workEdit.description || null,
      image_url: workEdit.image_url || null,
      link: workEdit.link?.trim() || null,
      meta: workEdit.meta || null,
      tags: (workEdit.tagsText ?? "").split(",").map((t) => t.trim()).filter(Boolean),
      visible: workEdit.visible ?? true,
    };
    if (workEdit.id) {
      const { error } = await supabase.from("works").update(payload).eq("id", workEdit.id);
      if (error) return notify(error.message, true);
      setWorks((l) => l.map((w) => (w.id === workEdit.id ? { ...w, ...payload } : w)));
    } else {
      const { data, error } = await supabase.from("works").insert({ ...payload, sort_order: items.length + 1 }).select().single();
      if (error) return notify(error.message, true);
      setWorks((l) => [...l, data as Work]);
    }
    setWorkEdit(null);
    notify("Karya tersimpan");
    onSaved();
  }

  async function removeWork(w: Work) {
    if (!confirm(`Hapus "${w.title}"?`)) return;
    const { error } = await supabase.from("works").delete().eq("id", w.id);
    if (error) return notify(error.message, true);
    deleteImage(w.image_url).catch(() => {});
    setWorks((l) => l.filter((x) => x.id !== w.id));
    notify("Karya dihapus");
    onSaved();
  }

  async function toggleWork(w: Work) {
    const { error } = await supabase.from("works").update({ visible: !w.visible }).eq("id", w.id);
    if (error) return notify(error.message, true);
    setWorks((l) => l.map((x) => (x.id === w.id ? { ...x, visible: !w.visible } : x)));
    onSaved();
  }

  async function moveWork(i: number, d: number) {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    const order = new Map(next.map((w, k) => [w.id, k + 1]));
    setWorks((l) => l.map((w) => (order.has(w.id) ? { ...w, sort_order: order.get(w.id)! } : w)));
    await Promise.all(next.map((w, k) => supabase.from("works").update({ sort_order: k + 1 }).eq("id", w.id)));
    onSaved();
  }

  /** Upload banyak gambar sekaligus — tiap gambar jadi satu karya. */
  async function bulkUpload(files: FileList | null) {
    if (!files?.length || !activeId) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setBulk({ done: 0, total: list.length });
    let order = items.length;
    const added: Work[] = [];
    for (const f of list) {
      try {
        const url = await uploadImage(f, `works/${activeId}`);
        const title = f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Tanpa judul";
        const { data, error } = await supabase
          .from("works")
          .insert({ section_id: activeId, title, image_url: url, sort_order: ++order })
          .select()
          .single();
        if (error) throw error;
        added.push(data as Work);
      } catch (e) {
        notify(`Gagal: ${f.name} — ${e instanceof Error ? e.message : ""}`, true);
      }
      setBulk((b) => (b ? { ...b, done: b.done + 1 } : b));
    }
    setWorks((l) => [...l, ...added]);
    setBulk(null);
    if (added.length) {
      notify(`${added.length} karya ditambahkan`);
      onSaved();
    }
  }

  const layout = active?.layout ?? "carousel";

  return (
    <>
      <h1 className="adm-title">Karya</h1>
      <p className="adm-sub">Buat seksi (Design, UI, Video, Website, apa pun) lalu isi karyanya.</p>

      <div className="split">
        {/* Daftar seksi */}
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 4px 12px" }}>
            <b style={{ fontSize: 13 }}>Seksi</b>
            <button className="b b-sm" onClick={() => setSecEdit({ title: "", layout: "carousel", visible: true })}>+ Seksi</button>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {sections.map((s, i) => (
              <div key={s.id} style={{ display: "flex", gap: 4, alignItems: "stretch" }}>
                <button className={`sec-item ${s.id === activeId ? "on" : ""}`} onClick={() => setActiveId(s.id)} style={{ opacity: s.visible ? 1 : 0.5 }}>
                  <div>
                    {s.title}
                    <small>{works.filter((w) => w.section_id === s.id).length} karya{!s.visible && " · disembunyikan"}</small>
                  </div>
                  <span className="pill">{s.layout}</span>
                </button>
                <div style={{ display: "grid", gap: 4 }}>
                  <button className="b b-icon b-sm" onClick={() => moveSection(i, -1)} disabled={i === 0} aria-label="Naik">↑</button>
                  <button className="b b-icon b-sm" onClick={() => moveSection(i, 1)} disabled={i === sections.length - 1} aria-label="Turun">↓</button>
                </div>
              </div>
            ))}
            {sections.length === 0 && <p className="empty">Belum ada seksi.</p>}
          </div>
        </div>

        {/* Isi seksi */}
        <div className="card">
          {!active ? (
            <p className="empty">Pilih atau buat seksi terlebih dahulu.</p>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                <div>
                  <h3 style={{ fontSize: 22, marginBottom: 2 }}>{active.title}</h3>
                  <p className="muted" style={{ fontSize: 13 }}>{LAYOUT_LABEL[layout]} — {LAYOUT_HINT[layout]}</p>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "start" }}>
                  <button className="b b-sm" onClick={() => setSecEdit(active)}>Atur seksi</button>
                  <button className="b b-sm b-danger" onClick={() => removeSection(active)}>Hapus</button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "18px 0" }}>
                <button className="b b-pri" onClick={() => setWorkEdit({ title: "", tagsText: "", visible: true })}>+ Tambah karya</button>
                {(layout === "carousel" || layout === "grid") && (
                  <button className="b" onClick={() => bulkInput.current?.click()} disabled={!!bulk}>
                    {bulk ? `Mengunggah ${bulk.done}/${bulk.total}…` : "↑ Upload banyak gambar"}
                  </button>
                )}
                <input ref={bulkInput} type="file" accept="image/*" multiple hidden onChange={(e) => { bulkUpload(e.target.files); e.target.value = ""; }} />
              </div>

              {items.length === 0 ? (
                <p className="empty">Seksi ini masih kosong. Seksi kosong tidak tampil di website.</p>
              ) : (
                <div className="rows">
                  {items.map((w, i) => (
                    <div className={`row ${w.visible ? "" : "hidden-item"}`} key={w.id}>
                      <div className="row-thumb">{w.image_url && <img src={w.image_url} alt="" />}</div>
                      <div className="row-main">
                        <b>{w.title}</b>
                        <span>{w.link || w.meta || w.description || "—"}</span>
                      </div>
                      <div className="row-btns">
                        <button className="b b-icon b-sm" onClick={() => moveWork(i, -1)} disabled={i === 0} aria-label="Naik">↑</button>
                        <button className="b b-icon b-sm" onClick={() => moveWork(i, 1)} disabled={i === items.length - 1} aria-label="Turun">↓</button>
                        <button className="b b-sm" onClick={() => toggleWork(w)} title="Tampilkan / sembunyikan">{w.visible ? "Tampil" : "Sembunyi"}</button>
                        <button className="b b-sm" onClick={() => setWorkEdit({ ...w, tagsText: (w.tags ?? []).join(", ") })}>Ubah</button>
                        <button className="b b-sm b-danger" onClick={() => removeWork(w)} aria-label="Hapus">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal seksi */}
      {secEdit && (
        <div className="modal-bg" onClick={() => setSecEdit(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{secEdit.id ? "Atur seksi" : "Seksi baru"}</h3>
            <div className="form-grid">
              <div className="fld full">
                <label>Judul seksi</label>
                <input className="inp" autoFocus value={secEdit.title ?? ""} onChange={(e) => setSecEdit({ ...secEdit, title: e.target.value })} placeholder="Branding" />
                <small>Kata kedua dan seterusnya tampil miring dengan warna aksen.</small>
              </div>
              <div className="fld full">
                <label>Subjudul</label>
                <input className="inp" value={secEdit.subtitle ?? ""} onChange={(e) => setSecEdit({ ...secEdit, subtitle: e.target.value })} placeholder="Logo dan identitas visual" />
              </div>
              <div className="fld full">
                <label>Gaya tampilan</label>
                <select className="inp" value={secEdit.layout ?? "carousel"} onChange={(e) => setSecEdit({ ...secEdit, layout: e.target.value as Layout })}>
                  {(Object.keys(LAYOUT_LABEL) as Layout[]).map((k) => (
                    <option key={k} value={k}>{LAYOUT_LABEL[k]}</option>
                  ))}
                </select>
                <small>{LAYOUT_HINT[(secEdit.layout ?? "carousel") as Layout]}</small>
              </div>
              <label className="switch">
                <input type="checkbox" checked={secEdit.visible ?? true} onChange={(e) => setSecEdit({ ...secEdit, visible: e.target.checked })} />
                <span />
                Tampilkan di website
              </label>
            </div>
            <div className="save-bar">
              <button className="b" onClick={() => setSecEdit(null)}>Batal</button>
              <button className="b b-pri" onClick={saveSection}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal karya */}
      {workEdit && active && (
        <div className="modal-bg" onClick={() => setWorkEdit(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{workEdit.id ? "Ubah karya" : "Karya baru"}</h3>
            <div className="form-grid">
              <div className="fld full">
                <label>{layout === "video" ? "Thumbnail video" : layout === "website" ? "Screenshot website" : "Gambar"}</label>
                <ImageUpload
                  value={workEdit.image_url ?? null}
                  onChange={(u) => setWorkEdit((w) => (w ? { ...w, image_url: u } : w))}
                  folder={`works/${active.id}`}
                  hint={layout === "website" ? "Screenshot halaman penuh (panjang) akan bergulir saat disorot" : layout === "video" ? "Rasio 16:9" : "Screenshot atau file asli desain"}
                />
              </div>
              <div className="fld full">
                <label>Judul</label>
                <input className="inp" value={workEdit.title ?? ""} onChange={(e) => setWorkEdit({ ...workEdit, title: e.target.value })} />
              </div>
              <div className="fld full">
                <label>Deskripsi</label>
                <textarea className="inp" rows={3} value={workEdit.description ?? ""} onChange={(e) => setWorkEdit({ ...workEdit, description: e.target.value })} />
              </div>
              <div className="fld full">
                <label>Link {layout === "video" ? "video" : layout === "website" ? "website" : "(opsional)"}</label>
                <input className="inp" type="url" value={workEdit.link ?? ""} onChange={(e) => setWorkEdit({ ...workEdit, link: e.target.value })} placeholder="https://" />
              </div>
              <div className="fld">
                <label>Info singkat</label>
                <input className="inp" value={workEdit.meta ?? ""} onChange={(e) => setWorkEdit({ ...workEdit, meta: e.target.value })} placeholder={layout === "video" ? "120K views · 2026" : "Klien · 2026"} />
              </div>
              <div className="fld">
                <label>Tag</label>
                <input className="inp" value={workEdit.tagsText ?? ""} onChange={(e) => setWorkEdit({ ...workEdit, tagsText: e.target.value })} placeholder="Poster, Branding" />
                <small>Pisahkan dengan koma.</small>
              </div>
              <div className="fld full">
                <label>Pindahkan ke seksi</label>
                <select className="inp" value={workEdit.section_id ?? active.id} onChange={(e) => setWorkEdit({ ...workEdit, section_id: e.target.value })}>
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <label className="switch">
                <input type="checkbox" checked={workEdit.visible ?? true} onChange={(e) => setWorkEdit({ ...workEdit, visible: e.target.checked })} />
                <span />
                Tampilkan di website
              </label>
            </div>
            <div className="save-bar">
              <button className="b" onClick={() => setWorkEdit(null)}>Batal</button>
              <button className="b b-pri" onClick={saveWork}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
