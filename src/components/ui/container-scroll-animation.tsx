"use client";

import React, { useRef } from "react";
import { useScroll, useTransform, motion, MotionValue } from "motion/react";

export function ContainerScroll({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = React.useState(false);

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

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 0.8], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.8], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 0.8], [0, -100]);

  return (
    <div
      className="relative flex items-start justify-center"
      ref={containerRef}
      style={{
        height: "60rem",
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
        <Card rotate={rotate} translate={translate} scale={scale}>
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
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #00000000, 0 9px 20px #0000000a, 0 37px 37px #00000008, 0 84px 50px #00000005, 0 149px 60px #00000003, 0 233px 65px #00000001",
      }}
      className="mx-auto -mt-12 h-[30rem] w-full max-w-5xl rounded-[30px] border-4 border-[#6C6C6C] bg-[#222222] p-2 md:h-[40rem] md:p-6"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-gray-100 md:rounded-2xl">
        {children}
      </div>
    </motion.div>
  );
}
