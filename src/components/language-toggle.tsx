"use client";

import { LOCALES, LOCALE_NAMES, copy } from "@/lib/i18n";
import { useLocale } from "@/lib/locale";

/**
 * The language switch. A two-segment control rather than a single toggling
 * button, so the language in effect is readable at a glance and either one is
 * a single click away.
 *
 * Each segment is labelled with its full name in the accessible name (and the
 * visible code kept in it, per WCAG 2.5.3), because "ES" alone out of context
 * is not a label.
 */
export default function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <>
      <style>{`
        [data-lang-switch]{display:inline-flex;flex:none;align-items:center;gap:.15rem;padding:.2rem;border:1px solid var(--bar-border-strong);border-radius:999px;background:var(--bar-surface);}
        [data-lang-option]{min-width:46px;min-height:40px;padding:0 .6rem;border:0;border-radius:999px;background:transparent;color:var(--bar-text-subtle);font-family:var(--font-display,Georgia),Georgia,"Times New Roman",serif;font-size:.75rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;transition:background .18s,color .18s;}
        [data-lang-option]:hover{color:var(--bar-text);}
        [data-lang-option][aria-pressed=true]{background:var(--bar-accent);color:var(--bar-bg);}
        [data-lang-option]:focus-visible{outline:2px solid var(--bar-focus);outline-offset:2px;}
        @media(prefers-reduced-motion:reduce){[data-lang-option]{transition:none;}}
        @media(forced-colors:active){[data-lang-switch]{border-color:ButtonBorder;}[data-lang-option]{color:ButtonText;}[data-lang-option][aria-pressed=true]{background:Highlight;color:HighlightText;}}
      `}</style>
      <div data-lang-switch role="group" aria-label={t(copy.language)}>
        {LOCALES.map((id) => (
          <button
            key={id}
            type="button"
            data-lang-option
            aria-pressed={locale === id}
            aria-label={`${LOCALE_NAMES[id]} (${id.toUpperCase()})`}
            onClick={() => setLocale(id)}
          >
            {id.toUpperCase()}
          </button>
        ))}
      </div>
    </>
  );
}
