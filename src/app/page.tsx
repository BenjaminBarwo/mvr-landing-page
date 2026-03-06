"use client";

import { useState } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { WaitlistModal } from "@/components/landing/WaitlistModal";
import { AppShowcase } from "@/components/landing/AppShowcase";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { FeaturesStrip } from "@/components/landing/FeaturesStrip";
import { CompetitorContrast } from "@/components/landing/CompetitorContrast";
import { CoFounderCard } from "@/components/landing/CoFounderCard";
import { BottomCTA } from "@/components/landing/BottomCTA";
import { Footer } from "@/components/landing/Footer";
import { PageViewTracker } from "@/components/landing/PageViewTracker";
import { SocialProofToast } from "@/components/landing/SocialProofToast";

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
        <ContainerScroll
          titleComponent={
            <HeroSection onOpenWaitlist={() => setIsWaitlistOpen(true)} />
          }
        >
          <AppShowcase />
        </ContainerScroll>
        <FeaturesStrip />
        <hr style={{ width: 200, border: "none", borderTop: "1px solid #e0e0e0", margin: "0 auto" }} />
        <CompetitorContrast />
        <hr style={{ width: 200, border: "none", borderTop: "1px solid #e0e0e0", margin: "0 auto" }} />
        <CoFounderCard />
        <hr style={{ width: 200, border: "none", borderTop: "1px solid #e0e0e0", margin: "0 auto" }} />
        <BottomCTA onOpenWaitlist={() => setIsWaitlistOpen(true)} />
        <Footer />
      </div>
      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />
      <SocialProofToast />
    </>
  );
}
