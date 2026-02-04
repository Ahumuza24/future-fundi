import { HomeNavbar } from "@/components/home/HomeNavbar";
import { HeroSection } from "@/components/home/HeroSection";
import { JourneySection } from "@/components/home/JourneySection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { PortalsSection } from "@/components/home/PortalsSection";
import { CTASection } from "@/components/home/CTASection";
import { HomeFooter } from "@/components/home/HomeFooter";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <HomeNavbar />
      <HeroSection />
      <JourneySection />
      <FeaturesSection />
      <PortalsSection />
      <CTASection />
      <HomeFooter />
    </div>
  );
};

export default HomePage;
