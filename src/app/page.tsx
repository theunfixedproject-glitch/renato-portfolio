import { About } from "@/components/about/About";
import { Contact } from "@/components/contact/Contact";
import { Hero } from "@/components/hero/Hero";
import { Makeovers } from "@/components/makeovers/Makeovers";
import { WorkCategories } from "@/components/projects/WorkCategories";
import { QuoteEstimator } from "@/components/quote/QuoteEstimator";
import { TechStack } from "@/components/stack/TechStack";

export default function Home() {
  return (
    <main id="contenuto">
      <Hero />
      <About />
      <Makeovers />
      <WorkCategories />
      <TechStack />
      <QuoteEstimator />
      <Contact />
    </main>
  );
}
