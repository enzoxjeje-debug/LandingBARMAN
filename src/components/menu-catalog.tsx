"use client";

import { useId, useMemo, useState } from "react";
import LanguageToggle from "@/components/language-toggle";
import ProductArt from "@/components/ui/product-art";
import { useLocale } from "@/lib/locale";
import { copy } from "@/lib/i18n";
import { useReveal } from "@/lib/use-reveal";
import {
  DEFAULT_SEED,
  generateMenu,
  formatAbv,
  formatMeasure,
  formatPrice,
  formatRating,
  formatStock,
  type CategoryId,
  type Product,
} from "@/lib/catalog";

type Filter = CategoryId | "all";

/**
 * The bar's list: beers, wines, spirits and house cocktails.
 *
 * Every number on these cards is generated from a seed (see lib/catalog), so a
 * first render is identical on the server and the client. "Reshuffle" draws a
 * fresh seed in the browser only, which is why it never breaks hydration.
 *
 * The language only changes the words: `generateMenu` draws the same numbers
 * for a given seed in either locale.
 */
export default function MenuCatalog({ initialSeed = DEFAULT_SEED }: { initialSeed?: number }) {
  const { locale, t } = useLocale();
  const [seed, setSeed] = useState(initialSeed);
  const [filter, setFilter] = useState<Filter>("all");
  const menu = useMemo(() => generateMenu(seed, locale), [seed, locale]);
  const headingId = `bar-menu-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const headRef = useReveal<HTMLDivElement>();
  const tonightRef = useReveal<HTMLDivElement>(120);
  const filtersRef = useReveal<HTMLDivElement>(200);

  const visible = filter === "all" ? menu.products : menu.products.filter((item) => item.category === filter);
  const countFor = (id: Filter) =>
    id === "all" ? menu.products.length : menu.products.filter((item) => item.category === id).length;

  return (
    <section data-bar-menu aria-labelledby={headingId}>
      <style>{`
        [data-bar-menu]{display:flex;width:100%;flex-direction:column;gap:clamp(1.75rem,4svh,2.75rem);}
        [data-bar-menu] button{font-family:inherit;}
        [data-bar-eyebrow],[data-bar-tonight-label],[data-bar-filter],[data-bar-shuffle],[data-bar-card-style]{font-family:var(--font-display,Georgia),Georgia,"Times New Roman",serif;font-weight:500;}
        [data-bar-head]{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:1.5rem;}
        [data-bar-head-copy]{display:flex;max-width:34rem;flex-direction:column;gap:.65rem;}
        [data-bar-eyebrow]{color:var(--bar-accent);font-size:.75rem;font-weight:500;letter-spacing:.22em;text-transform:uppercase;}
        [data-bar-title]{color:var(--bar-text);font-size:clamp(1.5rem,1rem + 1.6cqw,2rem);font-weight:400;line-height:1.2;text-wrap:balance;}
        [data-bar-lede]{color:var(--bar-text-muted);font-size:1rem;line-height:1.6;}
        [data-bar-tools]{display:flex;flex-direction:column;align-items:flex-start;gap:.55rem;}
        [data-bar-tools-row]{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem;}
        [data-bar-shuffle]{min-height:44px;padding:0 1.15rem;border:1px solid var(--bar-accent-line-strong);border-radius:var(--bar-radius);background:var(--bar-surface-raised);color:var(--bar-accent);font-size:.8125rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;transition:background .18s,color .18s,border-color .18s;}
        [data-bar-shuffle]:hover{background:var(--bar-accent);border-color:var(--bar-accent);color:var(--bar-bg);}
        [data-bar-status]{color:var(--bar-text-subtle);font-size:.75rem;letter-spacing:.06em;font-variant-numeric:tabular-nums;}
        [data-bar-tonight]{display:flex;flex-direction:column;gap:.9rem;padding:1.15rem 1.25rem;border:1px solid var(--bar-accent-line);border-radius:var(--bar-radius);background:linear-gradient(180deg,var(--bar-accent-faint),transparent);}
        [data-bar-tonight-list]{display:grid;gap:.85rem;grid-template-columns:1fr;list-style:none;}
        [data-bar-tonight-item]{display:grid;grid-template-columns:clamp(1.5rem,7%,1.875rem) minmax(0,1fr);column-gap:.7rem;row-gap:.2rem;align-items:center;}
        [data-bar-tonight-art]{width:100%;aspect-ratio:2/5;grid-row:1/3;}
        [data-bar-tonight-label]{color:var(--bar-accent);font-size:.6875rem;font-weight:500;letter-spacing:.2em;text-transform:uppercase;}
        [data-bar-tonight-name]{color:var(--bar-text);font-size:1.0625rem;font-weight:500;line-height:1.25;}
        [data-bar-tonight-meta]{color:var(--bar-text-subtle);font-size:.8125rem;line-height:1.5;}
        [data-bar-filters]{display:flex;flex-wrap:wrap;gap:.5rem;}
        [data-bar-filter]{min-height:44px;padding:0 1rem;border:1px solid var(--bar-border);border-radius:999px;background:var(--bar-surface);color:var(--bar-text-muted);font-size:.8125rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:background .18s,color .18s,border-color .18s;}
        [data-bar-filter]:hover{border-color:var(--bar-border-strong);color:var(--bar-text);}
        [data-bar-filter][aria-pressed=true]{background:var(--bar-accent);border-color:var(--bar-accent);color:var(--bar-bg);}
        [data-bar-grid]{display:grid;width:100%;gap:1rem;grid-template-columns:1fr;list-style:none;}
        [data-bar-card]{display:grid;height:100%;grid-template-columns:clamp(2.75rem,16%,3.5rem) minmax(0,1fr);column-gap:1rem;padding:1.15rem 1.25rem 1.25rem;border:1px solid var(--bar-border);border-radius:var(--bar-radius);background:linear-gradient(180deg,var(--bar-surface-raised),var(--bar-surface));transition:border-color .18s,transform .18s;}
        [data-bar-card]:hover{border-color:var(--bar-accent-line-strong);transform:translateY(-2px);}
        [data-bar-card-art]{width:100%;aspect-ratio:2/5;align-self:center;}
        [data-bar-card-art] svg{transition:transform .25s;transform-origin:50% 100%;}
        [data-bar-card]:hover [data-bar-card-art] svg{transform:translateY(-2px) rotate(-1.6deg);}
        [data-bar-card-body]{display:flex;min-width:0;flex-direction:column;gap:.55rem;}
        [data-bar-card][data-bar-featured=true]{border-top-color:var(--bar-accent);}
        [data-bar-card-head]{display:flex;align-items:baseline;justify-content:space-between;gap:.75rem;}
        [data-bar-card-style]{color:var(--bar-text-subtle);font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;}
        [data-bar-card-price]{color:var(--bar-accent-bright);font-size:.9375rem;font-weight:500;font-variant-numeric:tabular-nums;white-space:nowrap;}
        [data-bar-card-name]{color:var(--bar-text);font-size:1.125rem;font-weight:500;line-height:1.2;}
        [data-bar-card-origin]{color:var(--bar-text-subtle);font-size:.875rem;line-height:1.5;}
        [data-bar-card-notes]{color:var(--bar-text-muted);font-size:.9375rem;line-height:1.6;}
        [data-bar-card-tasting]{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.1rem;list-style:none;}
        [data-bar-card-tasting] li{padding:.25rem .55rem;border:1px solid var(--bar-border);border-radius:999px;color:var(--bar-text-subtle);font-size:.75rem;letter-spacing:.06em;}
        [data-bar-card-meta]{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:auto;padding-top:.85rem;border-top:1px solid var(--bar-border);color:var(--bar-text-subtle);font-size:.8125rem;font-variant-numeric:tabular-nums;}
        [data-bar-card-meta]>*+*::before{content:"·";margin-right:.5rem;}
        [data-bar-card-foot]{display:flex;align-items:baseline;justify-content:space-between;gap:.75rem;color:var(--bar-text-subtle);font-size:.8125rem;font-variant-numeric:tabular-nums;}
        [data-bar-card-rating]{color:var(--bar-accent);letter-spacing:.06em;}
        @container(min-width:620px){[data-bar-grid]{grid-template-columns:repeat(2,minmax(0,1fr));}[data-bar-tonight-list]{grid-template-columns:repeat(3,minmax(0,1fr));}}
        @container(min-width:1024px){[data-bar-grid]{grid-template-columns:repeat(3,minmax(0,1fr));}}
        @media(prefers-reduced-motion:reduce){[data-bar-card]{transition:none;}[data-bar-card]:hover{transform:none;}[data-bar-card-art] svg{transition:none;}[data-bar-card]:hover [data-bar-card-art] svg{transform:none;}}
        @media(forced-colors:active){[data-bar-card]{background:Canvas;}}
      `}</style>

      <div data-bar-head data-reveal="out" ref={headRef}>
        <div data-bar-head-copy>
          <p data-bar-eyebrow>{t(copy.menu.eyebrow)}</p>
          <h2 id={headingId} data-bar-title>
            {t(copy.menu.title)(menu.products.length)}
          </h2>
          <p data-bar-lede>{t(copy.menu.lede)}</p>
        </div>
        <div data-bar-tools>
          <div data-bar-tools-row>
            <button
              type="button"
              data-bar-shuffle
              onClick={() => setSeed(Math.floor(Math.random() * 2 ** 31))}
            >
              {t(copy.menu.reshuffle)}
            </button>
            {/* Also here, not only in the hero: reading the list is exactly when
                someone wants the other language. */}
            <LanguageToggle />
          </div>
          <p data-bar-status role="status">
            {t(copy.menu.status)(menu.seed)}
          </p>
        </div>
      </div>

      <div data-bar-tonight data-reveal="out" ref={tonightRef}>
        <p data-bar-tonight-label>{t(copy.menu.tonight)}</p>
        <ul data-bar-tonight-list>
          {menu.featured.map((product) => (
            <li key={product.id} data-bar-tonight-item>
              <span data-bar-tonight-art>
                <ProductArt product={product} compact />
              </span>
              <span data-bar-tonight-name>{product.name}</span>
              <span data-bar-tonight-meta>
                {product.style} · {formatPrice(product.price, locale)} · {t(copy.menu.pairsWith)(product.pairing)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div data-bar-filters role="group" aria-label={t(copy.menu.filterGroup)} data-reveal="out" ref={filtersRef}>
        <button
          type="button"
          data-bar-filter
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          {t(copy.menu.everything)(countFor("all"))}
        </button>
        {menu.categories.map((category) => (
          <button
            key={category.id}
            type="button"
            data-bar-filter
            aria-pressed={filter === category.id}
            onClick={() => setFilter(category.id)}
          >
            {t(category.label)} {countFor(category.id)}
          </button>
        ))}
      </div>

      <ul data-bar-grid>
        {visible.map((product, index) => (
          <li key={product.id}>
            <ProductCard product={product} delay={(index % 3) * 90} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductCard({ product, delay }: { product: Product; delay: number }) {
  const ref = useReveal<HTMLElement>(delay);
  const { locale, t } = useLocale();
  return (
    <article
      data-bar-card
      data-reveal="out"
      ref={ref}
      data-bar-category={product.category}
      data-bar-featured={product.featured ? "true" : undefined}
    >
      {/* The drawing is generated from this very product — see ui/product-art. */}
      <div data-bar-card-art>
        <ProductArt product={product} />
      </div>
      <div data-bar-card-body>
        <div data-bar-card-head>
          <span data-bar-card-style>{product.style}</span>
          <span data-bar-card-price>{formatPrice(product.price, locale)}</span>
        </div>
        <h3 data-bar-card-name>{product.name}</h3>
        {product.featured && <p data-bar-sr>{t(copy.menu.tonightPick)}</p>}
        <p data-bar-card-origin>
          {product.producer} · {product.origin}
        </p>
        <p data-bar-card-notes>{product.notes}</p>
        <ul data-bar-card-tasting aria-label={t(copy.menu.tastingAria)(product.name)}>
          {product.tasting.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <div data-bar-card-meta>
          <span>{formatAbv(product.abv, locale)}</span>
          <span>{formatMeasure(product, locale)}</span>
          {product.vintage !== null && <span>{t(copy.menu.vintage)(product.vintage)}</span>}
        </div>
        <div data-bar-card-foot>
          <span data-bar-card-rating>
            <span aria-hidden="true">★ {formatRating(product.rating, locale)}</span>
            <span data-bar-sr>{t(copy.menu.rated)(formatRating(product.rating, locale))}</span>
          </span>
          <span>{formatStock(product)}</span>
        </div>
      </div>
    </article>
  );
}
