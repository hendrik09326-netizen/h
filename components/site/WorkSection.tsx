"use client";

import { useCallback, useEffect, useState } from "react";
import type { Section, Work } from "@/lib/types";
import Reveal from "./Reveal";

function platformOf(link?: string | null) {
  if (!link) return null;
  const l = link.toLowerCase();
  if (l.includes("youtu")) return "YouTube";
  if (l.includes("tiktok")) return "TikTok";
  if (l.includes("instagram")) return "Instagram";
  if (l.includes("vimeo")) return "Vimeo";
  if (l.includes("facebook") || l.includes("fb.watch")) return "Facebook";
  return "Tonton";
}

function hostOf(link?: string | null) {
  if (!link) return "";
  try {
    return new URL(link).host.replace(/^www\./, "");
  } catch {
    return link;
  }
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M3 11L11 3M11 3H4.5M11 3V9.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/* ---------------- Lightbox ---------------- */
function Lightbox({ items, index, onClose, onMove }: { items: Work[]; index: number; onClose: () => void; onMove: (d: number) => void }) {
  const w = items[index];
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onMove(1);
      if (e.key === "ArrowLeft") onMove(-1);
    };
    document.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = "";
    };
  }, [onClose, onMove]);

  if (!w) return null;
  return (
    <div className="lb" role="dialog" aria-modal="true" onClick={onClose}>
      <button className="lb-close mono" onClick={onClose}>Tutup ✕</button>
      {items.length > 1 && (
        <>
          <button className="lb-nav lb-prev" aria-label="Sebelumnya" onClick={(e) => { e.stopPropagation(); onMove(-1); }}>←</button>
          <button className="lb-nav lb-next" aria-label="Berikutnya" onClick={(e) => { e.stopPropagation(); onMove(1); }}>→</button>
        </>
      )}
      <div className="lb-img">
        {w.image_url && <img src={w.image_url} alt={w.title} onClick={(e) => e.stopPropagation()} />}
      </div>
      <div className="lb-info" onClick={(e) => e.stopPropagation()}>
        <div>
          <span className="mono">{String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}{w.meta ? ` · ${w.meta}` : ""}</span>
          <h3>{w.title}</h3>
          {w.description && <p>{w.description}</p>}
        </div>
        {w.link && (
          <a className="btn btn-ghost" href={w.link} target="_blank" rel="noopener noreferrer">
            Lihat proyek <Arrow />
          </a>
        )}
      </div>
    </div>
  );
}

/* ---------------- Card gambar ---------------- */
function ImageCard({ w, onOpen }: { w: Work; onOpen: () => void }) {
  return (
    <button className="c-card" onClick={onOpen} aria-label={`Buka ${w.title}`}>
      <div className="c-img">
        {w.image_url && <img src={w.image_url} alt={w.title} loading="lazy" decoding="async" />}
      </div>
      <div className="c-cap">
        <span>{w.title}</span>
        <span>{w.tags?.[0] ?? w.meta ?? ""}</span>
      </div>
    </button>
  );
}

/* ---------------- Section ---------------- */
export default function WorkSection({ section, index }: { section: Section & { works: Work[] }; index: number }) {
  const works = section.works;
  const [open, setOpen] = useState<number | null>(null);
  const move = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + works.length) % works.length)), [works.length]);
  const close = useCallback(() => setOpen(null), []);

  const num = String(index + 1).padStart(2, "0");
  const [first, ...rest] = section.title.split(" ");

  return (
    <section className="block" id={index === 0 ? "karya" : undefined}>
      <div className="wrap">
        <Reveal className="head">
          <div>
            <span className="mono">{num} — {section.subtitle ?? "Karya"}</span>
            <h2>
              {first} {rest.length > 0 && <em>{rest.join(" ")}</em>}
            </h2>
          </div>
          <span className="count">{String(works.length).padStart(2, "0")} karya</span>
        </Reveal>

        {section.layout === "carousel" && <Carousel works={works} onOpen={setOpen} />}

        {section.layout === "grid" && (
          <div className="masonry">
            {works.map((w, i) => (
              <Reveal key={w.id} delay={(i % 3) * 80}>
                <ImageCard w={w} onOpen={() => setOpen(i)} />
              </Reveal>
            ))}
          </div>
        )}

        {section.layout === "video" && (
          <div className="v-grid">
            {works.map((w, i) => (
              <Reveal key={w.id} delay={(i % 3) * 80}>
                <a className="v-card" href={w.link ?? "#"} target="_blank" rel="noopener noreferrer">
                  <div className="v-thumb">
                    {w.image_url && <img src={w.image_url} alt={w.title} loading="lazy" decoding="async" />}
                    <div className="v-play">
                      <i>
                        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M4 2.5v11l9.5-5.5z" fill="currentColor" /></svg>
                      </i>
                    </div>
                    {platformOf(w.link) && <span className="v-plat">{platformOf(w.link)}</span>}
                  </div>
                  <div className="v-info">
                    <h3>{w.title}</h3>
                    {(w.meta || w.description) && <p>{w.meta ?? w.description}</p>}
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        )}

        {section.layout === "website" && (
          <div className="w-list">
            {works.map((w, i) => (
              <Reveal key={w.id} className="w-item">
                <a className="w-browser" href={w.link ?? "#"} target="_blank" rel="noopener noreferrer" aria-label={`Kunjungi ${w.title}`}>
                  <div className="w-bar">
                    <i /><i /><i />
                    <span className="w-url">{hostOf(w.link) || "website"}</span>
                  </div>
                  <div className="w-screen">
                    {w.image_url && <img src={w.image_url} alt={w.title} loading="lazy" decoding="async" />}
                  </div>
                </a>
                <div className="w-text">
                  <span className="w-num">{String(i + 1).padStart(2, "0")}{w.meta ? ` · ${w.meta}` : ""}</span>
                  <h3>{w.title}</h3>
                  {w.description && <p>{w.description}</p>}
                  {w.tags?.length > 0 && (
                    <div className="tags">
                      {w.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
                    </div>
                  )}
                  {w.link && (
                    <a className="btn btn-ghost" href={w.link} target="_blank" rel="noopener noreferrer">
                      Kunjungi website <Arrow />
                    </a>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {open !== null && section.layout !== "video" && section.layout !== "website" && (
        <Lightbox items={works} index={open} onClose={close} onMove={move} />
      )}
    </section>
  );
}

/* ---------------- Carousel berjalan ---------------- */
function Carousel({ works, onOpen }: { works: Work[]; onOpen: (i: number) => void }) {
  // Lebih dari 7 karya → dua baris berlawanan arah
  const rows = works.length > 7 ? [works.filter((_, i) => i % 2 === 0), works.filter((_, i) => i % 2 === 1)] : [works];

  return (
    <>
      {rows.map((row, r) => {
        const base = row.length < 5 ? [...row, ...row, ...row].slice(0, Math.max(5, row.length)) : row;
        const loop = [...base, ...base];
        return (
          <div className="carousel" key={r}>
            <div className={`c-track ${r === 1 ? "rev" : ""}`} style={{ ["--dur" as string]: `${base.length * 8}s` }}>
              {loop.map((w, i) => (
                <ImageCard key={`${w.id}-${i}`} w={w} onOpen={() => onOpen(works.indexOf(w))} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
