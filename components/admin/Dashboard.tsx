"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { refreshSite } from "@/app/actions";
import type { Field, Profile, Section, Work } from "@/lib/types";
import ProfileTab from "./ProfileTab";
import FieldsTab from "./FieldsTab";
import WorksTab from "./WorksTab";

type Tab = "profil" | "bidang" | "karya";

export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profil");
  const [data, setData] = useState<{ profile: Profile; fields: Field[]; sections: Section[]; works: Work[] } | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const s = createClient();
    Promise.all([
      s.from("profile").select("*").eq("id", 1).single(),
      s.from("fields").select("*").order("sort_order"),
      s.from("sections").select("*").order("sort_order"),
      s.from("works").select("*").order("sort_order"),
    ]).then(([p, f, sec, w]) => {
      const err = p.error || f.error || sec.error || w.error;
      if (err) return setLoadErr(err.message);
      setData({
        profile: p.data as Profile,
        fields: (f.data ?? []) as Field[],
        sections: (sec.data ?? []) as Section[],
        works: (w.data ?? []) as Work[],
      });
    });
  }, []);

  const notify = useCallback((msg: string, err?: boolean) => {
    setToast({ msg, err });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // Perbarui halaman publik (digabung jika banyak perubahan beruntun)
  const onSaved = useCallback(() => {
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => { refreshSite().catch(() => {}); }, 800);
  }, []);

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <>
      <header className="adm-top">
        <div className="wrap">
          <span className="brand">Dashboard<i>.</i></span>
          <div className="adm-tabs">
            {(["profil", "bidang", "karya"] as Tab[]).map((t) => (
              <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="adm-actions">
            <a className="b b-sm" href="/" target="_blank" rel="noopener noreferrer">Lihat situs ↗</a>
            <button className="b b-sm" onClick={logout}>Keluar</button>
          </div>
        </div>
      </header>

      <main className="adm-body">
        <div className="wrap" style={{ maxWidth: 1100 }}>
          {loadErr && (
            <div className="card">
              <b>Gagal memuat data.</b>
              <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>{loadErr}</p>
              <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>Pastikan supabase/schema.sql sudah dijalankan dan email kamu ada di tabel admin_emails.</p>
            </div>
          )}
          {!data && !loadErr && <p className="empty">Memuat…</p>}
          {/* Semua tab tetap ter-mount agar perubahan tidak hilang saat berpindah tab */}
          {data && (
            <>
              <div hidden={tab !== "profil"}><ProfileTab initial={data.profile} onSaved={onSaved} notify={notify} /></div>
              <div hidden={tab !== "bidang"}><FieldsTab initial={data.fields} onSaved={onSaved} notify={notify} /></div>
              <div hidden={tab !== "karya"}>
                <WorksTab initialSections={data.sections} initialWorks={data.works} onSaved={onSaved} notify={notify} />
              </div>
            </>
          )}
        </div>
      </main>

      {toast && <div className={`toast ${toast.err ? "err" : ""}`}>{toast.msg}</div>}
    </>
  );
}
