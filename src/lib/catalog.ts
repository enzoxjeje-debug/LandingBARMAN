/**
 * BARMAN — deterministic random catalogue.
 *
 * The menu is generated, not hard-coded: a seeded PRNG (mulberry32) fills in
 * prices, ABV, vintages, ratings and stock from plausible ranges while the
 * names, producers and tasting copy come from the curated pools below.
 *
 * Seeded on purpose. `generateMenu()` must return the same catalogue on the
 * server and on the client, otherwise React hydrates against different numbers.
 * Pass a different seed (or one from `Date.now()`) to reshuffle.
 *
 * Language-aware rather than language-duplicated: the numbers are drawn exactly
 * the same way in every locale (the PRNG only ever sees ranges, never strings),
 * so switching language re-reads the same bottle with different words instead
 * of rolling a new menu.
 */

import { formatDecimal, formatInteger, pick, type Locale, type Localized } from "./i18n";

export const DEFAULT_SEED = 20260918;

export type CategoryId = "beer" | "wine" | "spirit" | "cocktail";

/** What a cocktail is drawn in. Bottles are decided by `category`. */
export type ServeGlass = "bottle" | "rocks" | "coupe" | "flute" | "highball";

/** The thing balanced on the rim of a glass, if any. */
export type Garnish = "peel" | "twist" | "wheel" | "sprig" | "bean" | null;

export type CategoryMeta = {
  id: CategoryId;
  label: Localized;
  tagline: Localized;
  /** Noun used for one serving, in the measure line. */
  unit: Localized;
  /** Plural noun counted in the stock line. */
  stockUnit: Localized;
};

export type Product = {
  id: string;
  category: CategoryId;
  name: string;
  style: string;
  producer: string;
  origin: string;
  vintage: number | null;
  abv: number;
  servingMl: number;
  /** What the till charges, in Argentine pesos (see `ARS_PER_EUR`). */
  price: number;
  rating: number;
  stock: number;
  notes: string;
  tasting: string[];
  pairing: string;
  servingUnit: string;
  stockUnit: string;
  /** What the bottle pours — the drawing renders this colour (see `Spec.pour`). */
  pour: string;
  glass: ServeGlass;
  garnish: Garnish;
  featured: boolean;
};

export type Menu = {
  seed: number;
  locale: Locale;
  categories: CategoryMeta[];
  products: Product[];
  featured: Product[];
};

/* ── Randomness ─────────────────────────────────────────────────────────── */

type Random = {
  next: () => number;
  int: (min: number, max: number) => number;
  range: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  sample: <T>(items: readonly T[], count: number) => T[];
};

/** mulberry32 — small, fast, and identical across engines. */
export function createRandom(seed: number): Random {
  let state = (Number.isFinite(seed) ? Math.trunc(seed) : DEFAULT_SEED) >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min;
  const range = (min: number, max: number) => next() * (max - min) + min;
  const pick = <T,>(items: readonly T[]): T => items[int(0, items.length - 1)];
  const sample = <T,>(items: readonly T[], count: number): T[] => {
    const pool = [...items];
    const taken: T[] = [];
    while (taken.length < count && pool.length > 0) {
      taken.push(pool.splice(int(0, pool.length - 1), 1)[0]);
    }
    return taken;
  };
  return { next, int, range, pick, sample };
}

/* ── Money ──────────────────────────────────────────────────────────────── */

/**
 * The bar prices in pesos, and the curated ranges below are quoted in euros,
 * so this is the single number that turns one into the other. It is a list
 * price for a bar in Buenos Aires, not a live FX feed: when the bar re-prices,
 * change this and every tag follows. Amounts are then rounded to the nearest
 * hundred, because a menu says $ 13.100, not $ 13.132,50.
 */
export const ARS_PER_EUR = 1_750;

const toArs = (euros: number) => Math.round((euros * ARS_PER_EUR) / 100) * 100;

/* ── Category metadata ──────────────────────────────────────────────────── */

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "beer",
    label: { es: "Cervezas", en: "Beers" },
    tagline: { es: "Fría, pensada, tirada", en: "Cold, considered, on tap" },
    unit: { es: "botella", en: "bottle" },
    stockUnit: { es: "botellas", en: "bottles left" },
  },
  {
    id: "wine",
    label: { es: "Vinos", en: "Wines" },
    tagline: { es: "Por botella, por copa", en: "By the bottle, by the glass" },
    unit: { es: "botella", en: "bottle" },
    stockUnit: { es: "botellas", en: "bottles left" },
  },
  {
    id: "spirit",
    label: { es: "Destilados", en: "Spirits" },
    tagline: { es: "La repisa alta", en: "The back shelf" },
    unit: { es: "copa", en: "pour" },
    stockUnit: { es: "copas", en: "pours left" },
  },
  {
    id: "cocktail",
    label: { es: "Tragos", en: "Cocktails" },
    tagline: { es: "Preparados al momento", en: "Mixed to order" },
    unit: { es: "vaso", en: "glass" },
    stockUnit: { es: "disponibles", en: "left tonight" },
  },
];

const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((category) => [category.id, category])) as Record<CategoryId, CategoryMeta>;

/* ── Curated pools ──────────────────────────────────────────────────────── */

type Spec = {
  /** A bottled name is a proper noun and reads the same in both languages. */
  name: string;
  producer: string;
  origin: Localized;
  style: Localized;
  abv: [number, number];
  serving: number[];
  /** List price in euros; converted to pesos on the way out. */
  price: [number, number];
  vintages?: [number, number];
  stock: [number, number];
  notes: Localized;
  /**
   * The liquid itself, as a hex colour, and how a cocktail is served.
   *
   * It lives in the catalogue, not in the drawing component, because the colour
   * of a pour is a property of the bottle and not of the language its label is
   * written in: deriving it from `style` would repaint every glass the moment a
   * reader switched to English.
   */
  pour: string;
  glass?: ServeGlass;
  garnish?: Garnish;
};

const SPECS: Record<CategoryId, Spec[]> = {
  beer: [
    {
      name: "Midnight Porter",
      producer: "Dark Hollow Brewing",
      origin: { es: "Dublín, Irlanda", en: "Dublin, Ireland" },
      style: { es: "Porter imperial", en: "Imperial Porter" },
      pour: "#2a1710",
      abv: [7.4, 9.6],
      serving: [330],
      price: [7.5, 10],
      stock: [6, 42],
      notes: {
        es: "Cacao bituminoso y toffee quemado; se sirve casi negro bajo una corona densa y persistente.",
        en: "Bituminous cocoa and burnt toffee, poured almost black under a tight, lasting head.",
      },
    },
    {
      name: "Cold Anchor",
      producer: "Nordhavn Bryggeri",
      origin: { es: "Copenhague, Dinamarca", en: "Copenhagen, Denmark" },
      style: { es: "Pilsner con lúpulo en seco", en: "Dry-Hopped Pilsner" },
      pour: "#e0ba55",
      abv: [4.4, 5.4],
      serving: [330],
      price: [6, 8],
      stock: [8, 48],
      notes: {
        es: "Malta pilsner nítida bajo una nube luminosa de Saaz y Hallertau.",
        en: "Crisp pilsner malt under a bright cloud of Saaz and Hallertau.",
      },
    },
    {
      name: "Velvet Herd",
      producer: "Hoof & Barrel",
      origin: { es: "Portland, Oregón", en: "Portland, Oregon" },
      style: { es: "Stout de avena", en: "Oatmeal Stout" },
      pour: "#241209",
      abv: [5.2, 6.6],
      serving: [440],
      price: [7, 9.5],
      stock: [6, 36],
      notes: {
        es: "Avena sedosa y chocolate negro, amargor bajo y un final largo a espresso.",
        en: "Silky oats and dark chocolate with low bitterness and a long espresso finish.",
      },
    },
    {
      name: "Citra Static",
      producer: "Static Field Ales",
      origin: { es: "San Diego, California", en: "San Diego, California" },
      style: { es: "IPA de la costa oeste", en: "West Coast IPA" },
      pour: "#c4712a",
      abv: [6.2, 7.8],
      serving: [355],
      price: [8, 11],
      stock: [6, 40],
      notes: {
        es: "Cáscara de cítrico y resina de pino sobre un cuerpo magro y francamente amargo.",
        en: "Dank citrus peel and pine resin over a lean, aggressively bitter body.",
      },
    },
    {
      name: "Wit van de Kade",
      producer: "Kaai Brouwerij",
      origin: { es: "Amberes, Bélgica", en: "Antwerp, Belgium" },
      style: { es: "Witbier", en: "Witbier" },
      pour: "#e2d29b",
      abv: [4.6, 5.6],
      serving: [330],
      price: [6, 8],
      stock: [6, 44],
      notes: {
        es: "Naranja y cilantro sobre un trigo velado que se queda suave y ácido a la vez.",
        en: "Orange peel and coriander on a hazy wheat body that stays cloud-soft and tart.",
      },
    },
    {
      name: "Hearth & Hops",
      producer: "Stone Meadow",
      origin: { es: "Cotswolds, Inglaterra", en: "Cotswolds, England" },
      style: { es: "Bitter especial", en: "Extra Special Bitter" },
      pour: "#a9571f",
      abv: [4.2, 5.2],
      serving: [500],
      price: [6, 7.5],
      stock: [8, 48],
      notes: {
        es: "Malta a galleta y Fuggles terroso; se sirve apenas frío, en pinta de verdad.",
        en: "Biscuit malt and earthy Fuggles, served barely chilled in a proper pint.",
      },
    },
    {
      name: "Saison du Verger",
      producer: "Ferme des Trois Cloches",
      origin: { es: "Valle del Loira, Francia", en: "Loire Valley, France" },
      style: { es: "Saison de granja", en: "Farmhouse Saison" },
      pour: "#d3a338",
      abv: [5, 7.2],
      serving: [375],
      price: [8, 11],
      stock: [4, 28],
      notes: {
        es: "Levadura con pimienta y fruta de huerto que cierra seco, a heno.",
        en: "Peppery yeast and orchard fruit closing on a dry, hay-like snap.",
      },
    },
  ],
  wine: [
    {
      name: "Viña Cumbre",
      producer: "Bodegas Cumbre Alta",
      origin: { es: "Rioja, España", en: "Rioja, Spain" },
      style: { es: "Tempranillo Reserva", en: "Tempranillo Reserva" },
      pour: "#701a2b",
      abv: [13.5, 14.5],
      serving: [750],
      price: [38, 54],
      vintages: [2015, 2019],
      stock: [4, 36],
      notes: {
        es: "Cereza en sazón, cedro y tabaco dulce enmarcados en roble de grano fino.",
        en: "Cured cherry, cedar and sweet tobacco framed by fine-grained oak.",
      },
    },
    {
      name: "Pierre Levant",
      producer: "Domaine Levant",
      origin: { es: "Chablis, Francia", en: "Chablis, France" },
      style: { es: "Chardonnay Premier Cru", en: "Chardonnay Premier Cru" },
      pour: "#e4cf88",
      abv: [12.5, 13.5],
      serving: [750],
      price: [54, 82],
      vintages: [2018, 2022],
      stock: [3, 24],
      notes: {
        es: "Pedernal, manzana verde y flor blanca sobre una espina de tiza.",
        en: "Flint, green apple and white blossom over a chalk-drawn spine.",
      },
    },
    {
      name: "Terra Nera",
      producer: "Tenuta Nera",
      origin: { es: "Piamonte, Italia", en: "Piedmont, Italy" },
      style: { es: "Nebbiolo · Barolo", en: "Nebbiolo · Barolo" },
      pour: "#5f1527",
      abv: [13.5, 14.5],
      serving: [750],
      price: [62, 98],
      vintages: [2015, 2019],
      stock: [3, 18],
      notes: {
        es: "Pétalo de rosa, alquitrán y cereza seca: hecho para dormir otra década.",
        en: "Rose petal, tar and dried cherry — built to sleep another decade.",
      },
    },
    {
      name: "Casa Roja",
      producer: "Finca Roja",
      origin: { es: "Mendoza, Argentina", en: "Mendoza, Argentina" },
      style: { es: "Malbec", en: "Malbec" },
      pour: "#5a0f22",
      abv: [13.5, 14.5],
      serving: [750],
      price: [32, 46],
      vintages: [2018, 2021],
      stock: [4, 32],
      notes: {
        es: "Ciruela negra y violeta con un final amplio y espolvoreado de cacao.",
        en: "Black plum and violet with a plush, cocoa-dusted finish.",
      },
    },
    {
      name: "Goutte d'Or",
      producer: "Maison Goutte d'Or",
      origin: { es: "Champaña, Francia", en: "Champagne, France" },
      style: { es: "Brut Nature", en: "Brut Nature" },
      pour: "#e7c56c",
      abv: [11.5, 12.5],
      serving: [750],
      price: [88, 145],
      vintages: [2014, 2018],
      stock: [3, 16],
      notes: {
        es: "Brioche, tiza y ralladura de limón; seco de verdad y de burbuja finísima.",
        en: "Brioche, chalk and lemon zest; bone dry with a pin-fine bead.",
      },
    },
    {
      name: "Vinho Alto",
      producer: "Quinta do Alto",
      origin: { es: "Duero, Portugal", en: "Douro, Portugal" },
      style: { es: "Touriga Nacional", en: "Touriga Nacional" },
      pour: "#4a0f1f",
      abv: [13.5, 14.5],
      serving: [750],
      price: [42, 60],
      vintages: [2016, 2020],
      stock: [4, 30],
      notes: {
        es: "Mora aplastada y violetas realzadas por una mineralidad de esquisto.",
        en: "Crushed blackberry and violets lifted by schist-driven minerality.",
      },
    },
    {
      name: "Ochre Slope",
      producer: "Ridge & Vale",
      origin: { es: "Valle de Willamette, Oregón", en: "Willamette Valley, Oregon" },
      style: { es: "Pinot Noir", en: "Pinot Noir" },
      pour: "#7d1f2f",
      abv: [12.5, 13.5],
      serving: [750],
      price: [48, 68],
      vintages: [2019, 2022],
      stock: [4, 28],
      notes: {
        es: "Frutilla silvestre y suelo de bosque; ingrávido en boca.",
        en: "Wild strawberry and forest floor, weightless on the palate.",
      },
    },
  ],
  spirit: [
    {
      name: "Glen Torr 18",
      producer: "Glen Torr Distillery",
      origin: { es: "Speyside, Escocia", en: "Speyside, Scotland" },
      style: { es: "Single Malt · 18 años", en: "Single Malt · 18 Years" },
      pour: "#b26f22",
      abv: [43, 48],
      serving: [50],
      price: [16, 26],
      stock: [4, 24],
      notes: {
        es: "Fruta de huerto cocida, cera de abejas y un susurro de humo de brezo.",
        en: "Stewed orchard fruit, beeswax and a whisper of heather smoke.",
      },
    },
    {
      name: "Old Ninety",
      producer: "Barrow Creek Distillery",
      origin: { es: "Kentucky, EE. UU.", en: "Kentucky, USA" },
      style: { es: "Bourbon de lote pequeño", en: "Small-Batch Bourbon" },
      pour: "#a24e15",
      abv: [45, 52],
      serving: [50],
      price: [13, 20],
      stock: [5, 30],
      notes: {
        es: "Caramelo, roble tostado y especias de repostería; sin filtración en frío.",
        en: "Caramel, charred oak and baking spice, bottled without chill filtration.",
      },
    },
    {
      name: "Juniper & Stone",
      producer: "Stone Lane Distillery",
      origin: { es: "Londres, Inglaterra", en: "London, England" },
      style: { es: "London Dry Gin", en: "London Dry Gin" },
      pour: "#dde6d3",
      abv: [42, 47],
      serving: [50],
      price: [11, 17],
      stock: [6, 32],
      notes: {
        es: "Enebro de acero al frente; después cilantro, angélica y cáscara de pomelo.",
        en: "Steely juniper up front, then coriander, angelica and grapefruit peel.",
      },
    },
    {
      name: "Agave Ceniza",
      producer: "Casa Ceniza",
      origin: { es: "Oaxaca, México", en: "Oaxaca, Mexico" },
      style: { es: "Mezcal · Espadín", en: "Mezcal · Espadín" },
      pour: "#d9b674",
      abv: [44, 49],
      serving: [50],
      price: [14, 21],
      stock: [4, 26],
      notes: {
        es: "Humo de leña, agave asado y piedra húmeda; se bebe a sorbos, nunca de un golpe.",
        en: "Wood smoke, roasted agave and wet stone; sipped slow, never shot.",
      },
    },
    {
      name: "Ronce Añejo",
      producer: "Hacienda Ronce",
      origin: { es: "Ponce, Puerto Rico", en: "Ponce, Puerto Rico" },
      style: { es: "Ron añejo · 12 años", en: "Añejo Rum · 12 Years" },
      pour: "#7a3811",
      abv: [40, 44],
      serving: [50],
      price: [15, 23],
      stock: [4, 22],
      notes: {
        es: "Banana seca, toffee y cáscara de coco tras doce años en roble de bourbon.",
        en: "Dried banana, toffee and coconut husk from twelve years in ex-bourbon oak.",
      },
    },
    {
      name: "Café Nero",
      producer: "Distilleria Nero",
      origin: { es: "Treviso, Italia", en: "Treviso, Italy" },
      style: { es: "Amaro · licor de hierbas", en: "Amaro · Herb Liqueur" },
      pour: "#5d1a20",
      abv: [28, 34],
      serving: [50],
      price: [10, 15],
      stock: [5, 28],
      notes: {
        es: "Naranja amarga, genciana y raíz de ruibarbo; el bajativo clásico.",
        en: "Bitter orange, gentian and rhubarb root; the classic nightcap.",
      },
    },
  ],
  cocktail: [
    {
      name: "Barman Old Fashioned",
      producer: "House Bar",
      origin: { es: "Removido al momento", en: "Stirred to order" },
      style: { es: "Bourbon · Demerara · bitters de mole", en: "Bourbon · Demerara · Mole Bitters" },
      pour: "#a94d18", glass: "rocks", garnish: "peel",
      abv: [32, 38],
      serving: [120],
      price: [13, 17],
      stock: [1, 11],
      notes: {
        es: "Sobre un cubo tallado a mano, ochenta vueltas y un toque de aceite de naranja.",
        en: "Built on one hand-cut cube, stirred eighty turns, crowned with orange oil.",
      },
    },
    {
      name: "Smoked Bramble",
      producer: "House Bar",
      origin: { es: "Agitado al momento", en: "Shaken to order" },
      style: { es: "Mezcal · mora · limón · tomillo", en: "Mezcal · Blackberry · Lemon · Thyme" },
      pour: "#5c1b36", glass: "rocks", garnish: "sprig",
      abv: [20, 26],
      serving: [140],
      price: [14, 18],
      stock: [1, 10],
      notes: {
        es: "El humo del mezcal se cruza con mora aplastada y una rama de tomillo golpeada sobre la coctelera.",
        en: "Mezcal smoke meets crushed blackberry and a thyme branch bruised over the tin.",
      },
    },
    {
      name: "Velvet Negroni",
      producer: "House Bar",
      origin: { es: "Añejado en barrica, removido", en: "Barrel-aged, stirred" },
      style: { es: "Gin · Campari · vermut rojo", en: "Gin · Campari · Sweet Vermouth" },
      pour: "#8f2a1c", glass: "rocks", garnish: "wheel",
      abv: [24, 28],
      serving: [110],
      price: [14, 19],
      stock: [2, 12],
      notes: {
        es: "Seis semanas en barrica tostada vuelven al Negroni más redondo, más oscuro y calladamente dulce.",
        en: "Six weeks in a charred cask turn the Negroni rounder, darker and quietly sweeter.",
      },
    },
    {
      name: "Gold Hour Fizz",
      producer: "House Bar",
      origin: { es: "Armado sobre hielo", en: "Built over ice" },
      style: { es: "Pisco · saúco · lima · prosecco", en: "Pisco · Elderflower · Lime · Prosecco" },
      pour: "#e5c468", glass: "flute", garnish: "twist",
      abv: [13, 18],
      serving: [160],
      price: [13, 17],
      stock: [2, 14],
      notes: {
        es: "Un aperitivo largo y con burbujas que sabe a la última hora de sol.",
        en: "A long sparkling aperitivo that tastes like the last hour of sunlight.",
      },
    },
    {
      name: "Midnight Espresso",
      producer: "House Bar",
      origin: { es: "Agitado y colado fino", en: "Shaken and fine-strained" },
      style: { es: "Centeno · cold brew · cacao · sal", en: "Rye · Cold Brew · Cacao · Salt" },
      pour: "#33231a", glass: "coupe", garnish: "bean",
      abv: [18, 24],
      serving: [130],
      price: [14, 18],
      stock: [2, 12],
      notes: {
        es: "Cold brew y nibs de cacao, una pizca de sal y ni rastro de crema.",
        en: "Cold brew and cacao nib, salted once and served without a trace of cream.",
      },
    },
    {
      name: "Herb Garden Collins",
      producer: "House Bar",
      origin: { es: "Armado y completado con soda", en: "Built, topped with soda" },
      style: { es: "Gin · hierbas del jardín · limón · soda", en: "Gin · Garden Herbs · Lemon · Soda" },
      pour: "#d8dfae", glass: "highball", garnish: "sprig",
      abv: [10, 14],
      serving: [180],
      price: [12, 16],
      stock: [3, 16],
      notes: {
        es: "Lo que crezca esa semana en la terraza, macerado con limón y estirado con soda.",
        en: "Whatever grows on the roof that week, muddled with lemon and lengthened with soda.",
      },
    },
  ],
};

const TASTING: Record<CategoryId, Localized[]> = {
  beer: [
    { es: "Nibs de cacao", en: "Cocoa nib" },
    { es: "Malta tostada", en: "Toasted malt" },
    { es: "Cáscara de cítrico", en: "Citrus peel" },
    { es: "Resina de pino", en: "Pine resin" },
    { es: "Clavo", en: "Clove" },
    { es: "Banana", en: "Banana" },
    { es: "Fruta de huerto", en: "Orchard fruit" },
    { es: "Semilla de cilantro", en: "Coriander seed" },
    { es: "Galleta", en: "Biscuit" },
    { es: "Espresso", en: "Espresso" },
  ],
  wine: [
    { es: "Cereza ácida", en: "Sour cherry" },
    { es: "Cedro", en: "Cedar" },
    { es: "Violeta", en: "Violet" },
    { es: "Pedernal", en: "Flint" },
    { es: "Brioche", en: "Brioche" },
    { es: "Ciruela negra", en: "Black plum" },
    { es: "Rosa seca", en: "Dried rose" },
    { es: "Grafito", en: "Graphite" },
    { es: "Frutilla silvestre", en: "Wild strawberry" },
    { es: "Tabaco", en: "Tobacco" },
  ],
  spirit: [
    { es: "Toffee", en: "Toffee" },
    { es: "Humo de brezo", en: "Heather smoke" },
    { es: "Humo de leña", en: "Wood smoke" },
    { es: "Enebro", en: "Juniper" },
    { es: "Vainilla", en: "Vanilla" },
    { es: "Banana seca", en: "Dried banana" },
    { es: "Naranja amarga", en: "Bitter orange" },
    { es: "Piedra húmeda", en: "Wet stone" },
    { es: "Especias dulces", en: "Baking spice" },
    { es: "Agave", en: "Agave" },
  ],
  cocktail: [
    { es: "Agridulce", en: "Bittersweet" },
    { es: "Ahumado", en: "Smoky" },
    { es: "Nítido", en: "Crisp" },
    { es: "Sedoso", en: "Silky" },
    { es: "Vivaz", en: "Bracing" },
    { es: "Floral", en: "Floral" },
    { es: "Cítrico", en: "Citrus-driven" },
    { es: "Especiado", en: "Spiced" },
    { es: "Seco", en: "Dry" },
    { es: "Redondo", en: "Rich" },
  ],
};

const PAIRINGS: Record<CategoryId, Localized[]> = {
  beer: [
    { es: "Aceitunas en salmuera", en: "Salt-cured olives" },
    { es: "Cheddar estacionado", en: "Aged cheddar" },
    { es: "Papas con trufa", en: "Truffle fries" },
    { es: "Costillas glaseadas al miso", en: "Miso-glazed ribs" },
    { es: "Masa madre con manteca cultivada", en: "Sourdough and cultured butter" },
  ],
  wine: [
    { es: "Jamón ibérico", en: "Jamón ibérico" },
    { es: "Ojo de bife madurado", en: "Dry-aged ribeye" },
    { es: "Pato asado", en: "Roast duck" },
    { es: "Risotto de trufa", en: "Truffle risotto" },
    { es: "Comté de 24 meses", en: "Comté aged 24 months" },
  ],
  spirit: [
    { es: "Chocolate negro de origen único", en: "Single-origin dark chocolate" },
    { es: "Almendras ahumadas", en: "Smoked almonds" },
    { es: "Queso azul", en: "Blue cheese" },
    { es: "Parmigiano de 30 meses", en: "Parmigiano aged 30 months" },
  ],
  cocktail: [
    { es: "Almendras marcona", en: "Marcona almonds" },
    { es: "Ostras al natural", en: "Oysters on the half shell" },
    { es: "Pimientos de padrón a la brasa", en: "Charred padrón peppers" },
    { es: "Torta de chocolate negro", en: "Dark chocolate torte" },
  ],
};

/* ── Generation ─────────────────────────────────────────────────────────── */

const roundTo = (value: number, step: number) => Math.round(value / step) * step;
const slug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function buildProduct(random: Random, category: CategoryId, spec: Spec, locale: Locale): Product {
  const vintage = spec.vintages ? random.int(spec.vintages[0], spec.vintages[1]) : null;
  const meta = CATEGORY_BY_ID[category];
  return {
    id: `${category}-${slug(spec.name)}`,
    category,
    name: spec.name,
    style: pick(spec.style, locale),
    producer: spec.producer,
    origin: pick(spec.origin, locale),
    vintage,
    abv: Math.round(random.range(spec.abv[0], spec.abv[1]) * 10) / 10,
    servingMl: random.pick(spec.serving),
    price: toArs(roundTo(random.range(spec.price[0], spec.price[1]), 0.5)),
    rating: Math.round(random.range(4.2, 5) * 10) / 10,
    stock: random.int(spec.stock[0], spec.stock[1]),
    pour: spec.pour,
    glass: spec.glass ?? "bottle",
    garnish: spec.garnish ?? null,
    notes: pick(spec.notes, locale),
    // Pairs are drawn as wholes, so a note is never half-translated.
    tasting: random.sample(TASTING[category], 3).map((note) => pick(note, locale)),
    pairing: pick(random.pick(PAIRINGS[category]), locale),
    servingUnit: pick(meta.unit, locale),
    stockUnit: pick(meta.stockUnit, locale),
    featured: false,
  };
}

/** Build a full menu. Same seed in, same menu out — safe for SSR. */
export function generateMenu(seed: number = DEFAULT_SEED, locale: Locale = "es"): Menu {
  const random = createRandom(seed);
  const products = CATEGORIES.flatMap((category) =>
    SPECS[category.id].map((spec) => buildProduct(random, category.id, spec, locale)),
  );
  // Three picks, three different shelves — no all-wine "tonight" list.
  const featured = random.sample(CATEGORIES, 3).map((category) =>
    random.pick(products.filter((product) => product.category === category.id)),
  );
  for (const product of featured) product.featured = true;
  return { seed, locale, categories: CATEGORIES, products, featured };
}

/* ── Formatters ─────────────────────────────────────────────────────────── */

/** Pesos are quoted in whole units: "$ 13.100", not "$ 13.100,00". */
export const formatPrice = (price: number, locale: Locale) => `$ ${formatInteger(price, locale)}`;

/** Spanish sets a space before the unit: "7,4 % vol" against "7.4% vol". */
export const formatAbv = (abv: number, locale: Locale) =>
  locale === "es" ? `${formatDecimal(abv, 1, locale)} % vol` : `${formatDecimal(abv, 1, locale)}% vol`;

export const formatMeasure = (product: Product, locale: Locale) =>
  locale === "es"
    ? `${product.servingUnit} de ${product.servingMl} ml`
    : `${product.servingMl} ml ${product.servingUnit}`;

/** "6 botellas" / "6 bottles left". */
export const formatStock = (product: Product) => `${product.stock} ${product.stockUnit}`;

export const categoryLabel = (category: CategoryId, locale: Locale) => pick(CATEGORY_BY_ID[category].label, locale);

export const formatRating = (rating: number, locale: Locale) => formatDecimal(rating, 1, locale);
