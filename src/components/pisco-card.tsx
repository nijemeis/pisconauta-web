"use client";
import Link from "next/link";
import type { PiscoCard as Card } from "@/lib/types";
import { fmt, img } from "@/lib/format";
import { useT } from "./session";

const LADDER = [200, 400, 600, 800, 1200, 1600];

/**
 * Responsive photo: the browser picks a derivative for its actual pixel density from the
 * width ladder in /media, so Retina screens get 2× sources instead of an upscaled 400px.
 * `sizes` describes the rendered CSS width; `w` is the fallback for browsers without srcset.
 */
export function Photo({ src, alt, w = 400, eager, sizes }: { src: string | null; alt: string; w?: number; eager?: boolean; sizes?: string }) {
  const url = img(src, w);
  if (!url) return <div className="skeleton" style={{ width: "100%", height: "100%" }} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} srcSet={LADDER.map((x) => `${img(src, x)} ${x}w`).join(", ")} sizes={sizes ?? `${w}px`} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" />;
}

export function PiscoCard({ p, children }: { p: Card; children?: React.ReactNode }) {
  const { cardMeta, dec } = fmt(useT().locale);
  return (
    <Link href={`/pisco/${p.slug}`} className={`card${p.featured ? " featured" : ""}`}>
      {children}
      <div className="photo"><Photo src={p.photo} alt={`${p.name} · ${p.producer.name}`} sizes="(max-width: 900px) 50vw, (max-width: 1200px) 33vw, 320px" /></div>
      <div className="name">{p.name}</div>
      <div className="by">{p.producer.name}</div>
      <div className="foot">
        <span className="meta">{cardMeta(p)}</span>
        <span className="score">{dec(p.avgRating)}</span>
      </div>
    </Link>
  );
}

export function PiscoRow({ p, right }: { p: Card; right?: React.ReactNode }) {
  const { cardMeta, dec } = fmt(useT().locale);
  return (
    <Link href={`/pisco/${p.slug}`} className="row">
      <div className="ph"><Photo src={p.photo} alt={p.name} w={200} /></div>
      <div style={{ minWidth: 0 }}>
        <div className="n">{p.name}</div>
        <div style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 3 }}>{p.producer.name}{p.region ? ` · ${p.region.name}` : ""}</div>
        <div className="mono" style={{ letterSpacing: "0.1em", marginTop: 5 }}>{cardMeta(p)}</div>
      </div>
      {right ?? (
        <div className="score">{dec(p.avgRating)}<div className="mono" style={{ letterSpacing: "0.1em", fontSize: 9 }}>{p.ratingsCount}</div></div>
      )}
    </Link>
  );
}
