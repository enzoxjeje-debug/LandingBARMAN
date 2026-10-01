import type { Metadata, Viewport } from "next";
import { body, display } from "@/lib/fonts";
import "./globals.css";

/**
 * Spanish is the page the server renders; `LocaleProvider` switches the copy
 * and the document language from there (there is one URL, so no route-level
 * locale to keep in sync with these tags).
 */
export const metadata: Metadata = {
  title: "BARMAN | Bar de cócteles y destilados",
  description: "Donde los destilados se encuentran con el oficio. Cócteles de autor, vinos y cervezas en un ambiente íntimo.",
};

/** The bar is dark in every colour scheme, so the UA chrome follows suit. */
export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
