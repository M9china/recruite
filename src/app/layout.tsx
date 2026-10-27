import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Public_Sans } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL ?? "http://localhost:3000"),
  title: { default: `${site.name} ${site.shortName}`, template: `%s | ${site.name} ${site.shortName}` },
  description: site.hero.lede,
  // Keep search engines out until the client approves launch.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#2f3a24",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-ZA" className={`${barlowCondensed.variable} ${publicSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
