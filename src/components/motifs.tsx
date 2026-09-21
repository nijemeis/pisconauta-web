/** Andean motifs as inline SVG; colour follows `currentColor` unless overridden. */
export function Chakana({ size = 24, color = "var(--gold)", className }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden className={className} style={{ flexShrink: 0 }}>
      <rect x="8.5" y="0" width="7" height="7" /><rect x="0" y="8.5" width="7" height="7" /><rect x="8.5" y="8.5" width="7" height="7" />
      <rect x="17" y="8.5" width="7" height="7" /><rect x="8.5" y="17" width="7" height="7" />
      <rect x="4.5" y="4.5" width="3" height="3" /><rect x="16.5" y="4.5" width="3" height="3" /><rect x="4.5" y="16.5" width="3" height="3" /><rect x="16.5" y="16.5" width="3" height="3" />
    </svg>
  );
}

export function SteppedBand({ opacity = 0.5, color = "var(--gold)", style }: { opacity?: number; color?: string; style?: React.CSSProperties }) {
  const id = `band-${String(opacity).replace(".", "")}`;
  return (
    <svg width="100%" height="12" aria-hidden style={{ display: "block", opacity, ...style }}>
      <defs>
        <pattern id={id} width="30" height="12" patternUnits="userSpaceOnUse" fill={color}>
          <rect x="0" y="7" width="7" height="5" /><rect x="7.5" y="3.5" width="7" height="5" /><rect x="15" y="0" width="7" height="5" /><rect x="22.5" y="3.5" width="7" height="5" />
        </pattern>
      </defs>
      <rect width="100%" height="12" fill={`url(#${id})`} />
    </svg>
  );
}

/** Stepped corner brackets: outer L + fainter inner L on all four corners of a positioned parent. */
export function Brackets({ outer = 14, inner = 9, offset = 9 }: { outer?: number; inner?: number; offset?: number }) {
  const corners = [["top", "left"], ["top", "right"], ["bottom", "left"], ["bottom", "right"]] as const;
  const cap = (s: string) => `border${s[0].toUpperCase()}${s.slice(1)}`;
  return (
    <>
      {corners.map(([v, h]) => (
        <span key={v + h} aria-hidden>
          <span style={{ position: "absolute", [v]: -1, [h]: -1, width: outer, height: outer, [cap(v)]: "2px solid var(--gold)", [cap(h)]: "2px solid var(--gold)" } as React.CSSProperties} />
          <span style={{ position: "absolute", [v]: offset, [h]: offset, width: inner, height: inner, [cap(v)]: "2px solid rgba(var(--gold-rgb),0.6)", [cap(h)]: "2px solid rgba(var(--gold-rgb),0.6)" } as React.CSSProperties} />
        </span>
      ))}
    </>
  );
}

export function SectionHead({ label, gloss }: { label: string; gloss?: string }) {
  return (
    <div className="section-head">
      <span className="label">{label}</span>
      <span className="rule" />
      <Chakana size={11} />
      {gloss && <span className="gloss">{gloss}</span>}
    </div>
  );
}
