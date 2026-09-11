import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Workflow from "@/components/Workflow";
import Prediction from "@/components/Prediction";
import Comparison from "@/components/Comparison";
import RepositoryAnalysis from "@/components/RepositoryAnalysis";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import MouseGlow from "@/components/MouseGlow";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#090909] text-white">
      {/* Global Cursor Glow */}
      <MouseGlow />

      {/* Navigation */}
      <Navbar />

      {/* Hero */}
      <Hero />

      {/*  LIVE REPOSITORY ANALYSIS */}
      <RepositoryAnalysis />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col gap-32 lg:gap-36">
        <Features />
        <Workflow />
        
        <Comparison />
        
        <FAQ />
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}