import { Cinzel, EB_Garamond } from "next/font/google";

/**
 * BARMAN type system.
 *
 * Both faces are self-hosted by `next/font`, so the browser makes no request to
 * Google, the files are preloaded, and the generated CSS variables come with a
 * metrics-matched fallback that prevents layout shift.
 *
 * `display` — Cinzel: inscriptional Roman capitals with an even stroke weight.
 * The wordmark is cut out of the background, so the thin hairlines of a
 * high-contrast didone would disappear and leave the letters ambiguous; Cinzel
 * keeps every stroke present at any size, and reads as brass signage.
 *
 * `body` — EB Garamond: the Garamond revival, elegant at heading sizes and
 * still a real text face at 14px, which is what the menu is set in.
 */

export const display = Cinzel({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--font-display",
});

export const body = EB_Garamond({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--font-body",
});
