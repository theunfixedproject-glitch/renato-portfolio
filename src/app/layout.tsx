import type { Metadata, Viewport } from "next";
import { Fira_Code, Inter, Syne } from "next/font/google";
import { Providers } from "@/components/Providers";
import { profile } from "@/lib/data";
import "./globals.css";

const syne = Syne({ subsets: ["latin"], variable: "--font-syne", weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fira = Fira_Code({ subsets: ["latin"], variable: "--font-fira" });

const description =
  "Renato Manzotti, sviluppatore web: siti, app e bot su misura per aziende e professionisti. Veloci, ottimizzati per Google e pensati per portarti clienti.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://renato-portfolio-gamma.vercel.app"),
  title: `${profile.name} · Siti web, app e bot su misura`,
  description,
  keywords: ["sviluppatore web", "siti web", "app su misura", "bot WhatsApp", "aziende", "freelance", "Next.js"],
  authors: [{ name: profile.name }],
  openGraph: {
    title: `${profile.name} · Web & App Developer`,
    description,
    type: "website",
    locale: "it_IT",
    images: [{ url: profile.photo, width: 1400, height: 933, alt: profile.name }],
  },
};

export const viewport: Viewport = {
  themeColor: "#060608",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: profile.role,
  email: `mailto:${profile.email}`,
  telephone: profile.phone.replace(/\s/g, ""),
  knowsAbout: ["Sviluppo web", "App mobile", "Chatbot", "SEO"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${syne.variable} ${inter.variable} ${fira.variable}`}>
      <body className="grain">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
