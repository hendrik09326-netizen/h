export default function Marquee({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  if (!items.length) return null;
  // Ulangi supaya track cukup panjang, lalu gandakan untuk loop mulus
  const base = items.length < 4 ? [...items, ...items, ...items] : items;
  const loop = [...base, ...base];
  const dur = Math.max(24, base.length * 7);

  return (
    <div className="marquee" aria-hidden>
      <div className={`marquee-track ${reverse ? "rev" : ""}`} style={{ ["--dur" as string]: `${dur}s` }}>
        {loop.map((t, i) => (
          <span className="marquee-item" key={i}>
            {t}
            <span className="star">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
