import Header from '@/components/common/Header';
import HeroSection from '@/components/common/HeroSection';
import ToolsShowcase from '@/components/landing/ToolsShowcase';
import Features from '@/components/landing/Features';
import FinalCTA from '@/components/landing/FinalCTA';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-16">
        <HeroSection />
        <ToolsShowcase />
        <Features />
        <FinalCTA />
      </main>
    </div>
  );
}
