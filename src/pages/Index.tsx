import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MentoriaSection from "@/components/MentoriaSection";
import ApoyoSection from "@/components/ApoyoSection";
import CarreraSection from "@/components/CarreraSection";
import IASection from "@/components/IASection";
import IncludesSection from "@/components/IncludesSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <main>
      <HeroSection />
      <MentoriaSection />
      <ApoyoSection />
      <CarreraSection />
      <IASection />
      <IncludesSection />
      <CTASection />
    </main>
    <Footer />
  </div>
);

export default Index;
