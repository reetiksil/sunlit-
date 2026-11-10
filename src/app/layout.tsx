import type { Metadata } from "next";
import {
  Fraunces,
  DM_Sans,
  Lora,
  Merriweather,
  Atkinson_Hyperlegible,
  JetBrains_Mono,
} from "next/font/google";
import "@/styles/globals.css";
import { siteConfig } from "@/config/site";
import { Providers } from "@/components/layout/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AmbientBackground } from "@/components/background/AmbientBackground";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
  display: "swap",
});
const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${sans.variable} ${lora.variable} ${merriweather.variable} ${atkinson.variable} ${mono.variable}`}
    >
      <body className="min-h-screen flex flex-col font-sans antialiased selection:bg-primary/30">
        <Providers>
          <a href="#main-content" className="skip-link">Skip to content</a>
          <AmbientBackground />
          <Header />
          <main id="main-content" tabIndex={-1} className="page-in flex-1 outline-none">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}