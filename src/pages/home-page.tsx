import { HeroSection } from "../components/hero-section";
import { HowItWorks } from "../components/how-it-works";
import { TransparencySection } from "../components/transparency-section";
import { JackpotSection } from "../components/jackpot-section";
import { WinnersSection } from "../components/winners-section";
import { FooterCTA } from "../components/footer-cta";

interface HomePageProps {
  onBuyTickets: () => void;
}

export function HomePage({ onBuyTickets }: HomePageProps) {
  return (
    <>
      <HeroSection onBuyTickets={onBuyTickets} />
      <HowItWorks />
      <TransparencySection />
      <JackpotSection />
      <WinnersSection />
      <FooterCTA onBuyTickets={onBuyTickets} />
    </>
  );
}
