"use client";

import { useEffect, useState } from "react";

export default function Nav({ name, available }: { name: string; available: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const first = name.split(" ")[0] || name;

  return (
    <header className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="wrap nav-in">
        <a href="#top" className="brand">
          {first}
          <i>.</i>
        </a>
        <nav className="nav-links">
          <a href="#karya">Karya</a>
          <a href="#tentang">Tentang</a>
          <a href="#kontak">Kontak</a>
          <span className="status">
            <span className={`dot ${available ? "" : "off"}`} />
            {available ? "Terbuka untuk proyek" : "Sedang penuh"}
          </span>
        </nav>
      </div>
    </header>
  );
}
