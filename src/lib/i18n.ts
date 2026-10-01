/**
 * BARMAN — the two languages the bar speaks.
 *
 * Every word the visitor reads is declared here once as an { es, en } pair and
 * resolved with `pick(value, locale)` or the `t()` helper from `useLocale()`.
 * Nothing is looked up by string key at runtime, so a missing translation is a
 * type error rather than a blank label.
 *
 * Spanish is the default on purpose: it is what the server renders, and the
 * first client render has to agree with it or React hydrates against a
 * different page.
 */

export type Locale = "es" | "en";

/** A value that exists in every locale the bar speaks. */
export type Localized<T = string> = Record<Locale, T>;

export const LOCALES: Locale[] = ["es", "en"];

export const DEFAULT_LOCALE: Locale = "es";

/** Names are proper nouns: they do not translate. */
export const LOCALE_NAMES: Record<Locale, string> = { es: "Español", en: "English" };

export const LOCALE_STORAGE_KEY = "barman.locale";

export const isLocale = (value: unknown): value is Locale => value === "es" || value === "en";

export const pick = <T,>(value: Localized<T>, locale: Locale): T => value[locale];

/* ── Numbers ────────────────────────────────────────────────────────────── */

const groupers: Record<Locale, Intl.NumberFormat> = {
  es: new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }),
  en: new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }),
};

/** 1732 → "1.732" (es) / "1,732" (en). */
export const formatInteger = (value: number, locale: Locale) => groupers[locale].format(Math.round(value));

/** The decimal mark follows the locale: 7.4 → "7,4" (es) / "7.4" (en). */
export const formatDecimal = (value: number, digits: number, locale: Locale) =>
  locale === "es" ? value.toFixed(digits).replace(".", ",") : value.toFixed(digits);

/* ── The copy ───────────────────────────────────────────────────────────── */

export const pillars = [
  {
    number: "01",
    title: { es: "Cócteles de autor", en: "Crafted Cocktails" },
    copy: {
      es: "Preparados a mano con precisión: cada cóctel es una sinfonía equilibrada de sabores pensada para sorprender.",
      en: "Hand-mixed with precision, each cocktail is a balanced symphony of flavors designed to surprise and delight.",
    },
  },
  {
    number: "02",
    title: { es: "Destilados de guarda", en: "Premium Spirits" },
    copy: {
      es: "De whiskies añejos a ginebras difíciles de encontrar: una colección que recorre las mejores destilerías del mundo.",
      en: "From aged whiskeys to rare gins, our curated collection spans the finest distilleries across the globe.",
    },
  },
  {
    number: "03",
    title: { es: "La experiencia", en: "The Experience" },
    copy: {
      es: "Luz baja, madera cálida y el tintineo del cristal: una atmósfera hecha para noches que se recuerdan.",
      en: "Dim lights, warm wood, and the clink of crystal — an atmosphere crafted for memorable nights.",
    },
  },
];

export const copy = {
  language: { es: "Idioma", en: "Language" },
  loading: { es: "Cargando tipografía…", en: "Loading type…" },
  scrollRegion: {
    es: "Barman. Desplázate para entrar.",
    en: "Barman. Scroll to step inside.",
  },
  enter: { es: "Entrar en el bar", en: "Enter the bar" },
  hero: {
    category: { es: "Cócteles & Destilados", en: "Cocktails & Spirits" },
    eyebrow: { es: "Cada copa cuenta una historia.", en: "Every glass tells a story." },
    support: { es: "Saborea sin prisa. Repite.", en: "Sip. Savor. Repeat." },
    scroll: { es: "Desplázate para mirar de cerca ↓", en: "Scroll for a closer look ↓" },
  },
  sectionTitle: {
    es: "Donde cada copa es una obra maestra.",
    en: "Where every pour is a masterpiece.",
  },
  menu: {
    eyebrow: { es: "Carta de la noche", en: "Nightly list" },
    title: {
      es: (count: number) => `${count} bebidas tras la barra esta noche.`,
      en: (count: number) => `${count} drinks behind the bar tonight.`,
    },
    lede: {
      es: "Cervezas en la cámara fría, botellas descansando en la cava y los destilados de la repisa alta. Los precios son en pesos argentinos, por servicio; el stock es lo que quedaba en el último recuento.",
      en: "Beers still in the cold room, bottles resting in the cellar, and the spirits on the top shelf. Prices are in Argentine pesos, per serving; stock is whatever was left when we last counted.",
    },
    reshuffle: { es: "Barajar de nuevo", en: "Reshuffle the list" },
    status: {
      es: (seed: number) => `Semilla ${seed} · carta de muestra generada al azar`,
      en: (seed: number) => `Seed ${seed} · sample catalogue generated at random`,
    },
    tonight: { es: "Esta noche", en: "Tonight" },
    everything: { es: (count: number) => `Todo ${count}`, en: (count: number) => `Everything ${count}` },
    filterGroup: {
      es: "Filtrar la carta por categoría",
      en: "Filter the list by category",
    },
    pairsWith: {
      es: (pairing: string) => `marida con ${pairing.toLowerCase()}`,
      en: (pairing: string) => `pairs with ${pairing.toLowerCase()}`,
    },
    tonightPick: { es: "Elección de la noche", en: "Tonight’s pick" },
    tastingAria: {
      es: (name: string) => `Notas de cata de ${name}`,
      en: (name: string) => `Tasting notes for ${name}`,
    },
    vintage: { es: (year: number) => `Añada ${year}`, en: (year: number) => `Vintage ${year}` },
    rated: {
      es: (value: string) => `Valoración ${value} de 5`,
      en: (value: string) => `Rated ${value} out of 5`,
    },
  },
  glyph: {
    choices: { es: "Elige la letra por la que entrar", en: "Choose the letter to enter through" },
    choice: {
      es: (char: string, index: number, total: number) => `${char}, letra ${index} de ${total}`,
      en: (char: string, index: number, total: number) => `${char}, letter ${index} of ${total}`,
    },
    picker: { es: "Letra de entrada", en: "Entry letter" },
    pickerEmpty: { es: "Elige una letra", en: "Choose a letter" },
    hint: { es: "Desplázate para entrar.", en: "Scroll to enter." },
    passage: { es: "Un pasaje a través del tipo", en: "A passage through type" },
  },
};
