"use client";

import { useState } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { WaitlistModal } from "@/components/landing/WaitlistModal";
import { AppShowcase } from "@/components/landing/AppShowcase";
import { FeaturesStrip } from "@/components/landing/FeaturesStrip";
import { CompetitorContrast } from "@/components/landing/CompetitorContrast";
import { CoFounderCard } from "@/components/landing/CoFounderCard";
import { BottomCTA } from "@/components/landing/BottomCTA";
import { Footer } from "@/components/landing/Footer";
import { PageViewTracker } from "@/components/landing/PageViewTracker";

export default function Home() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  return (
    <>
      <PageViewTracker />
      {/* Content wrapper — blurs when modal open, matching reference .content / .content-blurred */}
      <div
        style={{
          transition: "all 0.4s ease",
          filter: isWaitlistOpen ? "blur(40px)" : "none",
        }}
      >
        <HeroSection onOpenWaitlist={() => setIsWaitlistOpen(true)} />
        <AppShowcase />
        <FeaturesStrip />
        <CompetitorContrast />
        <CoFounderCard />
        <BottomCTA onOpenWaitlist={() => setIsWaitlistOpen(true)} />
        <Footer />
      </div>
      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />
    </>
  );
}
