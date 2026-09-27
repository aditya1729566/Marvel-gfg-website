import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { eventData } from "@/data/event";
import "./globals.css";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  ),
  title: `${eventData.name} | GFG Student Chapter Bennett University`,
  description:
    "A superhero-inspired event experience from the GeeksForGeeks Student Chapter, Bennett University. Event and registration details coming soon.",
  openGraph: {
    title: `${eventData.name} | GFG Bennett`,
    description: "A new reality. Built by you. Event details coming soon.",
    images: [{ url: "/social-preview.png", width: 1200, height: 630 }],
  },
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
