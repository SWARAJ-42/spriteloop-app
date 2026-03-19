import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { HowItWorks } from "@/components/how-it-works";
import { Gallery } from "@/components/gallery";
import { Pricing } from "@/components/pricing";
import { CtaSection } from "@/components/cta-section";
import { Footer } from "@/components/footer";

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden crt-effect">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Gallery />
      <Pricing />
      <CtaSection />
      <Footer />
    </main>
  );
}
