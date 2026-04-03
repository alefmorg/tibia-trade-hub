import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import ActiveListings from "@/components/ActiveListings";

const Index = () => (
  <div className="min-h-screen">
    <Header />
    <HeroSection />
    <StatsBar />
    <ActiveListings />
    <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
      <p className="font-pixel text-[10px]">
        Lootix <span className="text-accent">TRADE</span>
      </p>
      <p className="mt-2">© 2026 — Plataforma não oficial. Tibia é marca registrada da CipSoft.</p>
    </footer>
  </div>
);

export default Index;
