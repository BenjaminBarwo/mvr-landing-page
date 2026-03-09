"use client";

import React, { useRef } from "react";
import { useScroll, useTransform, useSpring, motion, MotionValue } from "motion/react";

export function ContainerScroll({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: isMobile ? ["start start", "end start"] : undefined,
  });

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Smooth out jerky touch scroll input
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const scaleDimensions = () => {
    return isMobile ? [0.7, 1.0] : [1.05, 1];
  };

  // Stagger: rotation settles first (0.65), then scale (0.85), translate spans full range (0.9)
  const rotate = useTransform(smoothProgress, [0, 0.65], [14, 0]);
  const scale = useTransform(smoothProgress, [0, 0.85], scaleDimensions());
  const translate = useTransform(smoothProgress, [0, 0.9], [0, isMobile ? -50 : -100]);

  const borderRadius = useTransform(smoothProgress, [0, 0.9], isMobile ? [20, 20] : [30, 30]);
  const innerBorderRadius = useTransform(smoothProgress, [0, 0.9], isMobile ? [16, 16] : [16, 16]);
  const borderWidth = useTransform(smoothProgress, [0, 0.9], isMobile ? [2, 2] : [4, 4]);
  const cardPadding = useTransform(smoothProgress, [0, 0.9], isMobile ? [4, 4] : [24, 24]);

  return (
    <div
      className="relative flex items-start justify-center"
      ref={containerRef}
      style={{
        height: isMobile ? "53rem" : "70rem",
        perspective: "1000px",
      }}
    >
      <div
        className="flex w-full flex-col items-center"
        style={{
          perspective: "1000px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card
          rotate={rotate}
          translate={translate}
          scale={scale}
          borderRadius={borderRadius}
          innerBorderRadius={innerBorderRadius}
          borderWidth={borderWidth}
          cardPadding={cardPadding}
        >
          {children}
        </Card>
      </div>
    </div>
  );
}

export function Header({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>;
  titleComponent: string | React.ReactNode;
}) {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="mx-auto max-w-5xl px-4 pt-10 pb-6 md:pt-24 md:pb-20"
    >
      {titleComponent}
    </motion.div>
  );
}

export function Card({
  rotate,
  scale,
  borderRadius,
  innerBorderRadius,
  borderWidth,
  cardPadding,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  borderRadius: MotionValue<number>;
  innerBorderRadius: MotionValue<number>;
  borderWidth: MotionValue<number>;
  cardPadding: MotionValue<number>;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        borderRadius,
        borderWidth,
        padding: cardPadding,
        boxShadow:
          "0 0 #00000000, 0 9px 20px #0000000a, 0 37px 37px #00000008, 0 84px 50px #00000005, 0 149px 60px #00000003, 0 233px 65px #00000001",
      }}
      className="mx-auto -mt-12 aspect-video w-full max-w-5xl border-solid border-[#6C6C6C] bg-[#222222] md:aspect-auto md:h-[40rem]"
    >
      <motion.div
        style={{ borderRadius: innerBorderRadius }}
        className="h-full w-full overflow-hidden bg-gray-100"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
