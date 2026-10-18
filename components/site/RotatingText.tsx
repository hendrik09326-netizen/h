"use client";

import { useEffect, useState } from "react";

export default function RotatingText({ words, interval = 2400 }: { words: string[]; interval?: number }) {
  const list = words.length ? words : ["Creative"];
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);

  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => {
      setI((cur) => {
        setPrev(cur);
        return (cur + 1) % list.length;
      });
    }, interval);
    return () => clearInterval(t);
  }, [list.length, interval]);

  return (
    <span className="rotator" aria-live="polite">
      {list.map((w, idx) => (
        <span key={w + idx} className={idx === i ? "on" : idx === prev ? "out" : ""} aria-hidden={idx !== i}>
          {w}
        </span>
      ))}
    </span>
  );
}
