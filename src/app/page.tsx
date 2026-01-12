import PageLayout from "@/components/layout/PageLayout";
import Hero from "@/components/home/Hero";
import Ticker from "@/components/home/Ticker";
import AboutSection from "@/components/home/AboutSection";
import WorshipSchedule from "@/components/home/WorshipSchedule";
import StatsBar from "@/components/home/StatsBar";
import MinistriesGrid from "@/components/home/MinistriesGrid";
import SermonsGrid from "@/components/home/SermonsGrid";
import VerseOfTheDay from "@/components/home/VerseOfTheDay";
import FloatingActionButton from "@/components/ui/FloatingActionButton";

export default function Home() {
  return (
    <PageLayout>
      <Hero />
      <Ticker />
      <AboutSection />
      <WorshipSchedule />
      <StatsBar />
      <MinistriesGrid />
      <SermonsGrid />
      <VerseOfTheDay />
      <FloatingActionButton />
    </PageLayout>
  );
}
