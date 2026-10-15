import type { Metadata } from "next";
import { CategoryGrid } from "@/components/projects/WorkCategories";

export const metadata: Metadata = {
  title: "Lavori · Renato Manzotti",
  description: "App, videogiochi, siti web, bot e dashboard sviluppati da Renato Manzotti.",
};

export default function LavoriPage() {
  return (
    <main id="contenuto" className="section pt-36 md:pt-44">
      <p className="eyebrow">lavori personali</p>
      <h1 className="heading mt-5 max-w-3xl">
        Tutto quello che ho <span className="text-gradient">costruito da zero.</span>
      </h1>
      <p className="mt-6 mb-14 max-w-2xl text-lg leading-relaxed text-mist">Scegli una categoria per vedere i progetti con tutte le schermate.</p>
      <CategoryGrid />
    </main>
  );
}
