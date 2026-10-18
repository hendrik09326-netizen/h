"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/upload";

export default function ImageUpload({
  value,
  onChange,
  folder,
  hint = "Klik atau seret gambar ke sini",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState("");

  async function handle(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErr("File harus berupa gambar.");
    setErr("");
    setBusy(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div
        className={`up ${drag ? "drag" : ""}`}
        onClick={() => !value && input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]); }}
      >
        {value ? (
          <>
            <img src={value} alt="" />
            <div className="up-tools">
              <button type="button" className="b b-sm" onClick={(e) => { e.stopPropagation(); input.current?.click(); }}>Ganti</button>
              <button type="button" className="b b-sm b-danger" onClick={(e) => { e.stopPropagation(); onChange(null); }}>Hapus</button>
            </div>
          </>
        ) : (
          <div className="up-empty">
            <b>↑ Upload gambar</b>
            <span>{hint}</span>
            <span style={{ fontSize: 11 }}>Otomatis dikompres ke WebP agar ringan</span>
          </div>
        )}
        {busy && <div className="up-busy">Mengunggah…</div>}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }} />
      {err && <p className="err-text">{err}</p>}
    </div>
  );
}
