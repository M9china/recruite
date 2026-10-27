import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Placeholder name until the client supplies approved branding.
const SITE_NAME = "Recruitment Portal";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL ?? "http://localhost:3000"),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: "Explore careers, check eligibility and apply online.",
  // Keep search engines out until the client approves launch.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#2f3a24",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-ZA" className={`${barlowCondensed.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
