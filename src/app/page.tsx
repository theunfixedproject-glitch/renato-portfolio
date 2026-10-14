import { About } from "@/components/about/About";
import { Contact } from "@/components/contact/Contact";
import { Hero } from "@/components/hero/Hero";
import { Ambient } from "@/components/layout/Ambient";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Projects } from "@/components/projects/Projects";
import { QuoteEstimator } from "@/components/quote/QuoteEstimator";
import { TechStack } from "@/components/stack/TechStack";

export default function Home() {
  return (
    <>
      <Ambient />
      <Navbar />
      <main id="contenuto">
        <Hero />
        <About />
        <Projects />
        <TechStack />
        <QuoteEstimator />
        <Contact />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
