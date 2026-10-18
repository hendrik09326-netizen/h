"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setErr("Email atau kata sandi salah.");
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="login">
      <form className="card" onSubmit={submit}>
        <span className="mono">Dashboard</span>
        <h1>Masuk</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>Kelola isi portofolio kamu.</p>
        <div className="fld" style={{ marginBottom: 14 }}>
          <label>Email</label>
          <input className="inp" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="fld" style={{ marginBottom: 20 }}>
          <label>Kata sandi</label>
          <input className="inp" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <button className="b b-pri" style={{ width: "100%", padding: 12 }} disabled={busy}>
          {busy ? "Memeriksa…" : "Masuk"}
        </button>
        {err && <p className="err-text">{err}</p>}
      </form>
    </main>
  );
}
