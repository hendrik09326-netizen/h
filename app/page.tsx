import type { Metadata } from "next";
import { getSiteData } from "@/lib/data";
import Nav from "@/components/site/Nav";
import RotatingText from "@/components/site/RotatingText";
import Marquee from "@/components/site/Marquee";
import Reveal from "@/components/site/Reveal";
import WorkSection from "@/components/site/WorkSection";

// Halaman di-cache dan diperbarui otomatis saat kamu menyimpan di dashboard.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getSiteData();
  if (!profile) return {};
  return {
    title: `${profile.name} — ${profile.role ?? "Portofolio"}`,
    description: profile.headline ?? undefined,
    openGraph: {
      title: profile.name,
      description: profile.headline ?? undefined,
      images: profile.photo_url ? [profile.photo_url] : undefined,
    },
  };
}

function waLink(n: string) {
  const d = n.replace(/\D/g, "").replace(/^0/, "62");
  return `https://wa.me/${d}`;
}

function handleLink(v: string, base: string) {
  if (/^https?:\/\//.test(v)) return v;
  return base + v.replace(/^@/, "");
}

export default async function Home() {
  const { profile, fields, sections } = await getSiteData();

  if (!profile) {
    return (
      <main className="empty-site">
        <div>
          <p className="mono">Belum terhubung</p>
          <h1 className="serif" style={{ fontSize: 56 }}>Portofolio belum siap</h1>
          <p style={{ color: "var(--muted)" }}>Jalankan supabase/schema.sql dan isi .env.local, lalu buka /admin.</p>
        </div>
      </main>
    );
  }

  const p = profile;
  const nameParts = p.name.trim().split(/\s+/);
  const line1 = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : p.name;
  const line2 = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const words = p.rotating_words?.filter(Boolean) ?? [];
  const accent = p.accent_color || "#ff6a3d";

  const socials = [
    p.instagram && { label: "Instagram", href: handleLink(p.instagram, "https://instagram.com/") },
    p.tiktok && { label: "TikTok", href: handleLink(p.tiktok, "https://tiktok.com/@") },
    p.youtube && { label: "YouTube", href: handleLink(p.youtube, "https://youtube.com/@") },
    p.linkedin && { label: "LinkedIn", href: handleLink(p.linkedin, "https://linkedin.com/in/") },
    p.github && { label: "GitHub", href: handleLink(p.github, "https://github.com/") },
    p.whatsapp && { label: "WhatsApp", href: waLink(p.whatsapp) },
  ].filter(Boolean) as { label: string; href: string }[];

  const spinText = `${p.available ? "Terbuka untuk proyek" : p.role ?? "Portofolio"} • ${new Date().getFullYear()} • `;

  return (
    <div style={{ ["--accent" as string]: accent }}>
      <Nav name={p.name} available={p.available} />

      <main id="top">
        {/* ---------- HERO ---------- */}
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <div className="hero-meta">
                <span className="mono">Portofolio — {new Date().getFullYear()}</span>
                {p.location && <span className="mono">{p.location}</span>}
              </div>
              <h1 className="hero-name">
                <span className="line"><span>{line1}</span></span>
                {line2 && <span className="line"><span>{line2}</span></span>}
              </h1>
              <div className="hero-role">
                <span className="serif">Saya seorang</span>
                <RotatingText words={words.length ? words : [p.role ?? "Creative"]} />
              </div>
              {p.headline && <p className="hero-lead">{p.headline}</p>}
              <div className="hero-cta">
                <a href="#karya" className="btn btn-primary">Lihat karya ↓</a>
                {p.email && <a href={`mailto:${p.email}`} className="btn btn-ghost">Hubungi saya</a>}
                {p.cv_url && <a href={p.cv_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Unduh CV</a>}
              </div>
            </div>

            <div className="portrait">
              <div className="portrait-frame">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} fetchPriority="high" />
                ) : (
                  <div className="portrait-empty">{p.name.charAt(0)}</div>
                )}
              </div>
              <div className="badge-spin" aria-hidden>
                <svg viewBox="0 0 112 112">
                  <defs>
                    <path id="circ" d="M56,56 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0" />
                  </defs>
                  <text>
                    <textPath href="#circ" textLength="262">{spinText}</textPath>
                  </text>
                </svg>
                <b>✦</b>
              </div>
            </div>
          </div>
        </section>

        <Marquee items={fields.map((f) => f.title)} />

        {/* ---------- KARYA ---------- */}
        {sections.map((s, i) => (
          <WorkSection key={s.id} section={s} index={i} />
        ))}

        {/* ---------- TENTANG ---------- */}
        <section className="block" id="tentang">
          <div className="wrap">
            <Reveal className="head">
              <div>
                <span className="mono">{String(sections.length + 1).padStart(2, "0")} — Tentang</span>
                <h2>Tentang <em>saya</em></h2>
              </div>
            </Reveal>
            <div className="about">
              <Reveal>
                {p.bio && <p className="about-bio">{p.bio}</p>}
              </Reveal>
              {fields.length > 0 && (
                <ul className="f-list">
                  {fields.map((f, i) => (
                    <Reveal as="li" key={f.id} className="f-item" delay={i * 70}>
                      <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <h3>{f.title}</h3>
                        {f.description && <p>{f.description}</p>}
                      </div>
                    </Reveal>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* ---------- KONTAK ---------- */}
        <section className="contact" id="kontak">
          <div className="wrap">
            <Reveal>
              <span className="mono">Punya proyek?</span>
              <h2>
                Mari bekerja <em>sama.</em>
              </h2>
              {p.email && (
                <a className="contact-mail" href={`mailto:${p.email}`}>{p.email}</a>
              )}
              {socials.length > 0 && (
                <div className="socials">
                  {socials.map((s) => (
                    <a key={s.label} className="btn btn-ghost" href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
                  ))}
                </div>
              )}
            </Reveal>
          </div>
        </section>
      </main>

      <Marquee items={[p.name, ...(words.length ? words : [])]} reverse />

      <footer className="footer">
        <div className="wrap">
          <span className="mono">© {new Date().getFullYear()} {p.name}</span>
          <a className="mono" href="#top">Kembali ke atas ↑</a>
        </div>
      </footer>
    </div>
  );
}
