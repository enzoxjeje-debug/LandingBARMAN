"use client";

import { useEffect, useState } from "react";
import GlyphPortal from "@/components/ui/glyph-portal";
import ParticleField from "@/components/ui/particle-field";
import LanguageToggle from "@/components/language-toggle";
import MenuCatalog from "@/components/menu-catalog";
import { copy, pillars } from "@/lib/i18n";
import { LocaleProvider, useLocale } from "@/lib/locale";
import { body, display } from "@/lib/fonts";
import { useReveal } from "@/lib/use-reveal";

/** The wordmark is the bar's name: the same six letters in either language. */
const settings = { word: "BARMAN", scrollLength: 2.4, interactive: true, annotations: false };

/** Cinzel holds up at 700; at 900 the counters start to close up again. */
const WORD_WEIGHT = 700;
const wordmark = display.style.fontFamily;
const bodyCopy = body.style.fontFamily;

function Pillar({ number, title, copy, delay }: { number: string; title: string; copy: string; delay: number }) {
  const ref = useReveal<HTMLDivElement>(delay);
  return (
    <div data-slipstream-feature data-reveal="out" ref={ref}>
      <h3>
        <span data-slipstream-no>{number}</span>
        {title}
      </h3>
      <p>{copy}</p>
    </div>
  );
}

export default function Home() {
  return (
    <LocaleProvider>
      <Landing />
    </LocaleProvider>
  );
}

function Landing() {
  const s = settings;
  const { t } = useLocale();
  const [face, setFace] = useState<string | null>(null);
  useEffect(() => {
    let settled = false;
    const finish = (value: string) => { if (!settled) { settled = true; setFace(value); } };
    // The portal measures the glyph once and keeps those metrics, so the mark
    // is not mounted until the webfont is in. The timeout is the safety valve
    // for a browser where the font API never settles.
    const timeout = window.setTimeout(() => finish(wordmark), 1600);
    void document.fonts
      .load(`${WORD_WEIGHT} 100px ${wordmark}`, s.word)
      .then(() => document.fonts.ready)
      .then(() => finish(wordmark), () => finish(wordmark));
    return () => { settled = true; clearTimeout(timeout); };
  }, [s.word]);

  return (
    <div
      data-demo-scroll
      data-slipstream-demo
      tabIndex={0}
      role="region"
      aria-label={t(copy.scrollRegion)}
      style={{
        width: "100%",
        overflowY: "auto",
        background: "var(--bar-bg)",
        containerType: "inline-size",
        fontFamily: bodyCopy,
      }}
    >
      <style>{`
        [data-slipstream-demo] [data-gp-caption]{inset:calc(var(--gp-word-bottom,50%) + 82px) 24px auto;justify-content:center;}
        [data-slipstream-demo] [data-gp-hint]{display:none;}
        [data-slipstream-demo] [data-gp-enter]{min-height:46px;padding:0 20px;gap:28px;background:var(--bar-surface-raised);border:1px solid var(--bar-accent-line);border-radius:var(--bar-radius);color:var(--bar-accent);font-size:13px;font-weight:500;box-shadow:0 1px 2px var(--bar-shadow);transition:background .18s,box-shadow .18s,border-color .18s;}
        [data-slipstream-demo] [data-gp-enter]:hover{background:var(--bar-surface-hover);box-shadow:0 3px 8px var(--bar-shadow);border-color:var(--bar-accent-line-strong);}
        [data-slipstream-demo] [data-gp-enter]:focus-visible{outline:2px solid var(--bar-focus);outline-offset:4px;}
        [data-slipstream-demo] [data-gp-touch-picker]{top:auto;bottom:18px;left:50%;}
        [data-slipstream-demo] [data-gp-select]{border-color:var(--bar-border-strong);border-radius:8px;font-size:12px;color:var(--bar-text-subtle);background:var(--bar-surface);}
        [data-sublime-header]{position:absolute;inset:clamp(24px,4.5cqw,48px) clamp(24px,5cqw,64px) auto;display:flex;align-items:center;justify-content:space-between;gap:20px;}
        [data-sublime-aside]{display:flex;align-items:center;gap:clamp(14px,2.6cqw,26px);}
        [data-sublime-logo]{font-size:22px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--bar-accent);}
        [data-sublime-category]{font-size:12px;line-height:1.5;color:var(--bar-text-subtle);letter-spacing:.1em;text-transform:uppercase;}
        [data-sublime-eyebrow]{position:absolute;inset:auto 24px calc(100% - var(--gp-word-top,35%) + 32px);margin:0;text-align:center;font-size:14px;font-weight:400;line-height:1.5;letter-spacing:.04em;color:var(--bar-text-muted);}
        [data-sublime-support]{position:absolute;inset:calc(var(--gp-word-bottom,50%) + 32px) 24px auto;margin:0;text-align:center;font-size:16px;font-weight:400;line-height:1.55;color:var(--bar-text-muted);}
        [data-sublime-scroll]{position:absolute;inset:auto 24px 7%;text-align:center;color:var(--bar-text-subtle);font-size:11px;letter-spacing:.08em;text-transform:uppercase;}
        [data-sublime-logo],[data-sublime-category],[data-sublime-scroll],[data-slipstream-no]{font-family:var(--font-display,Georgia),Georgia,"Times New Roman",serif;font-weight:500;}
        @media(any-pointer:coarse){[data-sublime-scroll]{bottom:13%;}}
        @container(max-width:380px){[data-sublime-category]{display:none;}}
        @container(max-width:450px){[data-sublime-category]{max-width:12ch;text-align:right;}[data-sublime-eyebrow]{font-size:13px;}[data-sublime-support]{font-size:15px;}[data-slipstream-demo] [data-gp-caption]{top:calc(var(--gp-word-bottom,50%) + 76px);}}
        @container(max-height:479px){[data-sublime-header]{top:18px;}[data-sublime-support]{top:calc(var(--gp-word-bottom,50%) + 16px);}[data-slipstream-demo] [data-gp-caption]{top:calc(var(--gp-word-bottom,50%) + 60px);}[data-sublime-scroll]{display:none;}}
        [data-slipstream-demo] [data-gp-content]{padding:5.5rem clamp(1.25rem,5cqw,5rem) 6.5rem;font-family:inherit;}
        [data-slipstream-demo] section,[data-slipstream-demo] [data-gp-caption]{font-family:inherit;}
        [data-slipstream-copy]{display:flex;width:min(100%,80rem);margin:auto;flex-direction:column;align-items:flex-start;gap:clamp(2rem,5svh,3.5rem);}
        /* The language swap dissolves the copy: one number, written per frame by
           LocaleProvider, and every text layer follows it. The front and the
           caption are multiplied by it rather than replaced, because their own
           opacity is driven by the scroll, and the override has to outrank that
           layer's focus-visible escape hatch. The room, the mark and the dust
           behind the letters stay — the place is not translated, only the words. */
        html[data-locale-swap] [data-slipstream-copy]{opacity:var(--locale-fade,1);}
        html[data-locale-swap] [data-gp-front],html[data-locale-swap] [data-gp-caption]{opacity:calc(var(--gp-caption,1) * var(--locale-fade,1))!important;}
        [data-slipstream-copy] h2{max-width:48rem;margin:0;color:var(--bar-accent);font-size:clamp(1.75rem,1.1rem + 2.1cqw,2.25rem);font-weight:400;line-height:1.25;letter-spacing:0;text-wrap:balance;}
        [data-slipstream-features]{display:grid;width:100%;grid-template-columns:1fr;gap:1.75rem;}
        [data-slipstream-feature]{border-top:1px solid var(--bar-border);padding-top:1.1rem;}
        [data-slipstream-feature] h3{margin:0;color:var(--bar-text);font-size:1.125rem;font-weight:500;line-height:1.2;letter-spacing:0;}
        [data-slipstream-feature] p{margin:.55rem 0 0;color:var(--bar-text-muted);font-size:1rem;line-height:1.55;}
        [data-slipstream-no]{display:inline-block;margin-right:.7rem;color:var(--bar-accent);font:500 .75rem ui-monospace,monospace;letter-spacing:.08em;transform:translateY(-.1em);}
        @container(min-width:768px){[data-slipstream-features]{grid-template-columns:repeat(3,minmax(0,1fr));gap:3.5rem;}}
      `}</style>
      {/* Reveals are hidden until the observer flips them, so no-JS visitors
          get the content outright instead of a page of invisible blocks. */}
      <noscript>
        <style>{`[data-reveal="out"]{opacity:1;transform:none;}`}</style>
      </noscript>
      {face ? (
        <GlyphPortal
          word={s.word}
          fontFamily={face}
          fontWeight={WORD_WEIGHT}
          style={{
            // Roman capitals are for the mark only. Setting them here would
            // leak into every label the portal renders through font-family:inherit.
            fontFamily: bodyCopy,
            "--gp-paper": "var(--bar-bg)",
            "--gp-ink": "var(--bar-accent)",
            "--gp-field": "var(--bar-surface)",
            "--gp-foreground": "var(--bar-text)",
            "--gp-border": "var(--bar-border-strong)",
            "--gp-focus": "var(--bar-focus)",
          } as React.CSSProperties}
          scrollLength={s.scrollLength}
          interactive={s.interactive}
          annotations={s.annotations}
          enterLabel={t(copy.enter)}
          enterTravel={1200}
          labels={{
            choices: t(copy.glyph.choices),
            choice: (char, index, total) => t(copy.glyph.choice)(char, index, total),
            picker: t(copy.glyph.picker),
            pickerEmpty: t(copy.glyph.pickerEmpty),
            hint: t(copy.glyph.hint),
            passage: t(copy.glyph.passage),
          }}
          background={
            <>
              <div
                data-barman-field
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: "scale(var(--gp-field-scale,1))",
                  background:
                    "radial-gradient(circle at 18% 8%, var(--bar-accent-soft), transparent 34%), radial-gradient(circle at 82% 20%, var(--bar-accent-faint), transparent 28%), radial-gradient(circle at 48% 78%, var(--bar-warm), transparent 44%), linear-gradient(135deg,var(--bar-bg) 0%,var(--bar-bg-warm) 48%,var(--bar-bg-deep) 100%)",
                }}
              />
              {/*
                Light for the wordmark. The field is revealed *through* the
                letters, so this band is what makes them gold instead of
                near-black. It fades out with the opening frame (--gp-caption)
                long before the clip is released, so the full-bleed backdrop
                behind the menu stays dark.
              */}
              <div
                data-barman-wordmark
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: "calc(var(--gp-caption, 1) * 1.8)",
                  background:
                    "linear-gradient(180deg, var(--bar-wordmark-lit), var(--bar-wordmark) 58%, var(--bar-wordmark-dim) 78%)",
                }}
              />
              {/* Dust in the room, drifting through the letters and out over
                  the whole wall once the portal opens. */}
              <ParticleField density={12000} max={80} speed={5} />
            </>
          }
          front={
            <>
              {/* The opening frame only shows the paper, so the dust needs its
                  own layer here; it fades with the rest of the front. */}
              <ParticleField density={16000} max={48} speed={4} />
              <div data-sublime-header>
                <span data-sublime-logo>Barman</span>
                <div data-sublime-aside>
                  <span data-sublime-category>{t(copy.hero.category)}</span>
                  {/* The switch sits in the top-right corner of the opening
                      frame, and again beside the menu's own controls. */}
                  <LanguageToggle />
                </div>
              </div>
              <p data-sublime-eyebrow>{t(copy.hero.eyebrow)}</p>
              <p data-sublime-support>{t(copy.hero.support)}</p>
              <span data-sublime-scroll>{t(copy.hero.scroll)}</span>
            </>
          }
        >
          <div data-slipstream-copy>
            <h2>{t(copy.sectionTitle)}</h2>
            <div data-slipstream-features>
              {pillars.map((pillar, index) => (
                <Pillar
                  key={pillar.number}
                  number={pillar.number}
                  title={t(pillar.title)}
                  copy={t(pillar.copy)}
                  delay={index * 90}
                />
              ))}
            </div>
            <MenuCatalog />
          </div>
        </GlyphPortal>
      ) : (
        <div
          role="status"
          style={{
            height: "100%",
            display: "grid",
            placeItems: "center",
            color: "var(--bar-text-subtle)",
            fontSize: 12,
          }}
        >
          {t(copy.loading)}
        </div>
      )}
    </div>
  );
}
