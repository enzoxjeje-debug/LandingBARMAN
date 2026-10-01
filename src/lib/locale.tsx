"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, isLocale, pick, type Locale, type Localized } from "@/lib/i18n";

/**
 * The copy dissolves out, the language changes behind the blank, and the new
 * words dissolve back in. How long each half takes.
 *
 * Written per frame as one custom property (`--locale-fade`) rather than as a
 * CSS transition, for two reasons: the hero and the caption already have an
 * opacity driven by a scroll variable, and multiplying both by a single number
 * keeps them in step; and the fade then works in browsers that refuse to run
 * CSS animation at all — Chromium blocks transitions and keyframes outright
 * when the operating system asks for reduced motion.
 *
 * Kept under `prefers-reduced-motion` on purpose. Unlike the zoom, the reveal
 * and the drifting dust, this moves nothing: a dissolve is the least alarming
 * way to tell someone the page just changed language, and dropping it would
 * leave a hard snap.
 */
export const LOCALE_FADE_OUT_MS = 200;
export const LOCALE_FADE_IN_MS = 320;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  /** Resolve an { es, en } pair against the locale in effect. */
  t: <T,>(value: Localized<T>) => T;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** The cubic the portal already uses for the zoom, so the two feel related. */
const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Which language the bar is speaking.
 *
 * The page is prerendered statically in Spanish, so the default is the server's
 * answer and the stored preference is applied after mount. Reading
 * localStorage during render would make that first client render disagree with
 * the HTML and React would rebail the whole tree as a hydration error.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const frame = useRef(0);
  const value = useRef(1);

  const stop = useCallback(() => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
  }, []);

  /** `null` hands the property back to the stylesheet's own value. */
  const paint = useCallback((next: number | null) => {
    const root = document.documentElement;
    if (next === null) root.style.removeProperty("--locale-fade");
    else {
      // Three decimals is finer than a screen can show, and keeps the DOM tidy.
      value.current = Math.round(next * 1000) / 1000;
      root.style.setProperty("--locale-fade", String(value.current));
    }
  }, []);

  const fadeTo = useCallback(
    (to: number, ms: number, done: () => void) => {
      const from = value.current;
      const started = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - started) / ms);
        paint(from + (to - from) * ease(t));
        if (t < 1) frame.current = requestAnimationFrame(step);
        else {
          frame.current = 0;
          done();
        }
      };
      frame.current = requestAnimationFrame(step);
    },
    [paint],
  );

  const commit = useCallback(
    (next: Locale) => {
      // Clicking the other segment mid-fade picks up from where the dissolve is.
      stop();
      const root = document.documentElement;
      root.dataset.localeSwap = "on";
      fadeTo(0, LOCALE_FADE_OUT_MS, () => {
        setLocaleState(next);
        try {
          window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
        } catch {
          // A browser in private mode can throw on write; the switch still works.
        }
        // The new copy has to be in the DOM before it is allowed to fade back
        // in, or the first frames would show the old words returning. One frame
        // of blank is enough for React to commit a state update made here.
        frame.current = requestAnimationFrame(() => {
          fadeTo(1, LOCALE_FADE_IN_MS, () => {
            paint(null);
            delete root.dataset.localeSwap;
          });
        });
      });
    },
    [fadeTo, paint, stop],
  );

  const setLocale = useCallback(
    (next: Locale) => {
      // Pressing the segment you are already reading should not dissolve anything.
      if (next !== locale) commit(next);
    },
    [commit, locale],
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    // No fade on the way in: there is nothing on screen to dissolve from yet.
    if (isLocale(stored)) setLocaleState(stored);
  }, []);

  // lang drives screen-reader pronunciation and hyphenation, so the document
  // has to follow the switch, not the server default.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const root = document.documentElement;
    return () => {
      stop();
      paint(null);
      delete root.dataset.localeSwap;
    };
  }, [paint, stop]);

  const context = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: (input) => pick(input, locale) }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={context}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale() must be used inside <LocaleProvider>");
  return context;
}
