import { createRandom, type Product } from "@/lib/catalog";

/**
 * BARMAN — one drawing per product, generated from the product itself.
 *
 * There is not a single image file here. Every bottle and glass on the menu is
 * an inline SVG whose **silhouette** comes from the shelf it sits on, whose
 * **glassware** comes from how the drink is served, and whose **colour** is the
 * `pour` recorded in the catalogue: an Imperial Porter under its crown cap,
 * pale-gold Chablis, water-clear London Dry Gin, brick-red barrel-aged Negroni.
 *
 * The small stuff — how tall the label sits, where the glass highlight falls,
 * the tilt of the ice cube, the angle of the garnish, how many bubbles rise —
 * is hashed from the product id. So a bottle looks the same on every render, in
 * both languages and after a reshuffle (the bottle did not change, only its
 * numbers did), while no two products are drawn alike. Nothing here reads
 * translated text, which is why switching language never repaints a drink.
 *
 * Decorative on purpose: the drawing is `aria-hidden`, because the card already
 * names the bottle, its style, its origin and its measures. Repeating that as
 * SVG text would only make the list noisier for screen-reader users.
 */

/* ── Palette ────────────────────────────────────────────────────────────── */

const GLASS = "rgb(255 241 216 / 12%)";
const GLASS_EDGE = "rgb(255 241 216 / 30%)";
const RIM = "rgb(255 246 228 / 55%)";
const PAPER = "#efe4cf";
const INK = "#2a1e12";
const FOIL = "#b98b3f";
const CORK = "#8a5a2c";
const SHADOW = "rgb(0 0 0 / 32%)";
const DISPLAY = "var(--font-display, Georgia), Georgia, serif";

/* ── What is in the glass ───────────────────────────────────────────────── */

/** The seven silhouettes this menu draws: bottles by category, glasses by serve. */
type Shape = "beer" | "wine" | "spirit" | "rocks" | "coupe" | "flute" | "highball";

/**
 * A cocktail knows its own glassware (`product.glass`); everything else on the
 * list is a bottle, and which bottle it is follows from the shelf it sits on.
 */
function silhouetteFor(product: Product): Shape {
  if (product.category === "cocktail") return product.glass === "bottle" ? "rocks" : product.glass;
  return product.category;
}

/** Where the paper label sits on each bottle silhouette (y is per shape). */
const BOTTLE_LABEL: Record<"beer" | "wine" | "spirit", { x: number; w: number; y: number }> = {
  beer: { x: 10.5, w: 27, y: 74 },
  wine: { x: 12, w: 24, y: 80 },
  spirit: { x: 10, w: 28, y: 78 },
};

const GARNISH_ANCHOR: Record<Shape, { x: number; y: number } | null> = {
  beer: null,
  wine: null,
  spirit: null,
  rocks: { x: 35, y: 52 },
  coupe: { x: 36, y: 42 },
  flute: { x: 28, y: 26 },
  highball: { x: 33, y: 26 },
};

/* ── The generation ─────────────────────────────────────────────────────── */

/** FNV-1a — a string in, a seed out, identical in every engine. */
function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function draw(product: Product) {
  const random = createRandom(hashString(product.id));

  // Every product draws the same jitter in the same order, so the drawing is
  // stable across renders, languages and reshuffles.
  const jitter = {
    label: random.int(0, 4),
    sheen: random.range(-1.6, 1.6),
    tilt: random.range(-16, -5),
    garnish: random.range(-14, 14),
    level: random.range(-4, 4),
  };

  const shape = silhouetteFor(product);
  const carbonated = shape === "flute" || shape === "highball";
  const bubbles = Array.from({ length: carbonated ? random.int(6, 10) : 0 }, () => ({
    x: 0.16 + random.next() * 0.68,
    y: 0.12 + random.next() * 0.76,
    r: 0.6 + random.next() * 1.1,
  }));

  return {
    jitter,
    liquid: product.pour,
    shape,
    garnish: product.garnish,
    ice: shape === "rocks",
    bubbles,
  };
}

/* ── Shared pieces ──────────────────────────────────────────────────────── */

function Label({
  box,
  monogram,
  height,
}: {
  box: { x: number; w: number; y: number };
  monogram: string;
  height: number;
}) {
  return (
    <g>
      <rect x={box.x} y={box.y} width={box.w} height={height} rx="1.4" fill={PAPER} opacity=".94" />
      <rect x={box.x} y={box.y} width={box.w} height="1.5" fill={FOIL} opacity=".6" />
      <rect x={box.x} y={box.y + height - 1.5} width={box.w} height="1.5" fill={FOIL} opacity=".6" />
      {monogram && (
        <text
          x={box.x + box.w / 2}
          y={box.y + height / 2 + 3.6}
          textAnchor="middle"
          style={{ fontFamily: DISPLAY }}
          fontSize="11"
          fontWeight="600"
          fill={INK}
        >
          {monogram}
        </text>
      )}
    </g>
  );
}

function Bubbles({
  bubbles,
  box,
}: {
  bubbles: { x: number; y: number; r: number }[];
  box: { x: number; y: number; w: number; h: number };
}) {
  return (
    <g fill={RIM} opacity=".7">
      {bubbles.map((bubble, index) => (
        <circle
          key={index}
          cx={box.x + bubble.x * box.w}
          cy={box.y + bubble.y * box.h}
          r={bubble.r}
        />
      ))}
    </g>
  );
}

function Ice({ tilt }: { tilt: number }) {
  return (
    <g transform={`rotate(${tilt} 25 78)`}>
      <rect
        x="19"
        y="70"
        width="13"
        height="13"
        rx="1.6"
        fill="#ffffff"
        fillOpacity=".18"
        stroke="#ffffff"
        strokeOpacity=".38"
        strokeWidth=".9"
      />
      <path d="M20.6 80 L25 73" stroke="#ffffff" strokeOpacity=".26" strokeWidth=".9" />
    </g>
  );
}

/* ── The component ──────────────────────────────────────────────────────── */

/**
 * `compact` drops the monogram, which is texture rather than information at
 * thumbnail size — the label band stays, so the bottle still reads as labelled.
 */
export default function ProductArt({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { jitter, liquid, shape, garnish, ice, bubbles } = draw(product);
  const anchor = GARNISH_ANCHOR[shape];
  const monogram = compact
    ? ""
    : product.name.replace(/[^A-Za-z\u00c1\u00c9\u00cd\u00d3\u00da\u00d1]/g, "").charAt(0).toUpperCase() || "·";

  return (
    <svg
      viewBox="0 0 48 120"
      aria-hidden="true"
      focusable="false"
      style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
    >
      <ellipse cx="24" cy="115" rx="13" ry="2.3" fill={SHADOW} />

      {shape === "beer" && (
        <g>
          <path
            d="M20 13 L28 13 L28 42 C28 45.4 37.5 46 37.5 55 L37.5 109 Q37.5 114 32.5 114 L15.5 114 Q10.5 114 10.5 109 L10.5 55 C10.5 46 20 45.4 20 42 Z"
            fill={liquid}
            stroke={GLASS_EDGE}
            strokeWidth="1.2"
          />
          <rect
            x={14 + jitter.sheen}
            y="60"
            width="3.2"
            height="46"
            rx="1.6"
            fill="#ffffff"
            opacity=".13"
          />
          <rect x="21.4" y="17" width="2" height="23" rx="1" fill="#ffffff" opacity=".13" />
          <rect x="18.4" y="7.5" width="11.2" height="6.4" rx="1.6" fill={FOIL} />
          <rect x="18.4" y="12" width="11.2" height="2" rx="1" fill={SHADOW} />
          <Label box={BOTTLE_LABEL.beer} monogram={monogram} height={22 + jitter.label} />
        </g>
      )}

      {shape === "wine" && (
        <g>
          <rect x="19.5" y="8" width="9" height="22" rx="2" fill={FOIL} />
          <rect x="19.5" y="27" width="9" height="2.4" rx="1" fill={SHADOW} />
          <path
            d="M20.5 11 L27.5 11 L27.5 41 C27.5 44.6 36 47 36 57 L36 108 Q36 114 30 114 L18 114 Q12 114 12 108 L12 57 C12 47 20.5 44.6 20.5 41 Z"
            fill={liquid}
            stroke={GLASS_EDGE}
            strokeWidth="1.2"
          />
          <rect
            x={14 + jitter.sheen}
            y="64"
            width="3.2"
            height="44"
            rx="1.6"
            fill="#ffffff"
            opacity=".13"
          />
          <rect x="20.6" y="14" width="1.8" height="22" rx=".9" fill="#ffffff" opacity=".13" />
          <Label box={BOTTLE_LABEL.wine} monogram={monogram} height={22 + jitter.label} />
        </g>
      )}

      {shape === "spirit" && (
        <g>
          <rect x="19.8" y="8" width="8.4" height="9" rx="1.6" fill={CORK} />
          <path
            d="M20 15 L28 15 L28 43 C28 46.5 38 47.5 38 56 L38 108 Q38 114 32 114 L16 114 Q10 114 10 108 L10 56 C10 47.5 20 46.5 20 43 Z"
            fill={liquid}
            stroke={GLASS_EDGE}
            strokeWidth="1.2"
          />
          <rect x="18.4" y="15" width="11.2" height="2.6" rx="1.2" fill={FOIL} />
          <rect
            x={13.5 + jitter.sheen}
            y="62"
            width="3.2"
            height="44"
            rx="1.6"
            fill="#ffffff"
            opacity=".13"
          />
          <rect x="21.4" y="20" width="2" height="20" rx="1" fill="#ffffff" opacity=".13" />
          <Label box={BOTTLE_LABEL.spirit} monogram={monogram} height={24 + jitter.label} />
        </g>
      )}

      {shape === "rocks" && (
        <g>
          <path
            d="M10.5 52 L37.5 52 L33.6 110 Q33.6 113 30.6 113 L17.4 113 Q14.4 113 14.4 110 Z"
            fill={GLASS}
            stroke={GLASS_EDGE}
            strokeWidth="1.2"
          />
          <path
            d={`M12.1 ${64 + jitter.level} L35.9 ${64 + jitter.level} L32.2 109.4 Q32.2 111.6 29.8 111.6 L18.2 111.6 Q15.8 111.6 15.8 109.4 Z`}
            fill={liquid}
          />
          {ice && <Ice tilt={jitter.tilt} />}
          <path d="M14.6 108 L33.4 108 L33.2 110.6 Q33.2 113 30.6 113 L17.4 113 Q14.8 113 14.8 110.6 Z" fill={GLASS_EDGE} />
          <path d="M11.1 53.2 L36.9 53.2" stroke={RIM} strokeWidth="1.1" strokeLinecap="round" />
        </g>
      )}

      {shape === "coupe" && (
        <g>
          <path
            d="M9.5 42 Q9.5 66 24 68 Q38.5 66 38.5 42 Z"
            fill={GLASS}
            stroke={GLASS_EDGE}
            strokeWidth="1.2"
          />
          <path
            d={`M12.4 ${51 + jitter.level} Q12.8 62.5 24 64.6 Q35.2 62.5 35.6 ${51 + jitter.level} Z`}
            fill={liquid}
          />
          <path d="M9.9 43.2 L38.1 43.2" stroke={RIM} strokeWidth="1.1" strokeLinecap="round" />
          <rect x="23" y="67" width="2.2" height="41" rx="1.1" fill={GLASS_EDGE} />
          <ellipse cx="24" cy="110.5" rx="11" ry="3" fill={GLASS} stroke={GLASS_EDGE} strokeWidth="1" />
        </g>
      )}

      {shape === "flute" && (
        <g>
          <path
            d="M18.4 26 L18.4 84 Q18.4 88.5 24 88.5 Q29.6 88.5 29.6 84 L29.6 26 Z"
            fill={GLASS}
            stroke={GLASS_EDGE}
            strokeWidth="1.2"
          />
          <path
            d={`M19.4 ${38 + jitter.level} L19.4 83 Q19.4 87 24 87 Q28.6 87 28.6 83 L28.6 ${38 + jitter.level} Z`}
            fill={liquid}
          />
          <Bubbles bubbles={bubbles} box={{ x: 20, y: 39, w: 8, h: 46 }} />
          <path d="M18.8 27.2 L29.2 27.2" stroke={RIM} strokeWidth="1.1" strokeLinecap="round" />
          <rect x="23.1" y="88" width="1.8" height="19" rx=".9" fill={GLASS_EDGE} />
          <ellipse cx="24" cy="109.5" rx="9" ry="2.8" fill={GLASS} stroke={GLASS_EDGE} strokeWidth="1" />
        </g>
      )}

      {shape === "highball" && (
        <g>
          <rect
            x="13.5"
            y="26"
            width="21"
            height="87"
            rx="3.4"
            fill={GLASS}
            stroke={GLASS_EDGE}
            strokeWidth="1.2"
          />
          <rect
            x="14.7"
            y={44 + jitter.level}
            width="18.6"
            height={66 - jitter.level}
            rx="3"
            fill={liquid}
          />
          <Bubbles bubbles={bubbles} box={{ x: 16, y: 46, w: 16, h: 60 }} />
          <path
            d="M29.5 21 L26.5 47"
            stroke={FOIL}
            strokeWidth="2.6"
            strokeLinecap="round"
            opacity=".85"
          />
          <path d="M14.2 27.4 L33.8 27.4" stroke={RIM} strokeWidth="1.1" strokeLinecap="round" />
        </g>
      )}

      {garnish && anchor && (
        <g transform={`translate(${anchor.x} ${anchor.y}) rotate(${jitter.garnish})`}>
          {garnish === "peel" && (
            <path d="M0 0 C4 -5.5 10 -4.5 11 1.5 C6.5 -1 3 -0.6 0 0 Z" fill="#d97a2a" />
          )}
          {garnish === "twist" && (
            <path
              d="M0 0 C4 -5.5 9.5 -4.5 10.5 1.5"
              fill="none"
              stroke="#e6c65a"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          )}
          {garnish === "wheel" && (
            <g>
              <circle cx="5" cy="1" r="5.2" fill="#e09a33" />
              <circle cx="5" cy="1" r="3.4" fill="#f2cd86" />
              <path d="M5 -3 V5 M1 1 L9 1" stroke="#d08a28" strokeWidth=".8" opacity=".8" />
            </g>
          )}
          {garnish === "sprig" && (
            <g>
              <path d="M0 1 C4 -6 9 -8.5 12.5 -7" fill="none" stroke="#7f8f5a" strokeWidth="1.5" />
              <ellipse cx="3.4" cy="-2.6" rx="2.1" ry="1.2" fill="#8fa465" transform="rotate(-32 3.4 -2.6)" />
              <ellipse cx="7.4" cy="-4.8" rx="2.1" ry="1.2" fill="#8fa465" transform="rotate(-24 7.4 -4.8)" />
              <ellipse cx="11" cy="-7.2" rx="1.9" ry="1.1" fill="#8fa465" transform="rotate(-16 11 -7.2)" />
            </g>
          )}
          {garnish === "bean" && (
            <g>
              <ellipse cx="4.4" cy="0" rx="4.2" ry="2.9" fill="#2a1a12" transform="rotate(-18 4.4 0)" />
              <path d="M1.2 0 C3 -1.4 5.8 1.4 7.6 0" fill="none" stroke="#5e3d28" strokeWidth=".9" />
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
