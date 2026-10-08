import type { Metadata } from "next";
import { DM_Sans, DM_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import TopNav from "./components/TopNav";
import Footer from "./components/Footer";
import MobileBottomNav from "./components/MobileBottomNav";
import PostGearFab from "./components/PostGearFab";
import CookieConsent from "./components/CookieConsent";


const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Circl — Student Gear Rentals",
  description: "Rent and swap outdoor gear with other UFV students and staff.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable} ${playfair.variable}`}>
      <body className="antialiased pb-16 md:pb-0" style={{ fontFamily: "var(--font-dm-sans, var(--font-sans))" }}>
        <TopNav />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <MobileBottomNav />
        <PostGearFab />
        <CookieConsent />
      </body>
    </html>
  );
}