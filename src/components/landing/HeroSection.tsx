"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface HeroSectionProps {
  onOpenWaitlist: () => void;
}

const roles = [
  "agents",
  "lenders",
  "inspectors",
  "title companies",
  "appraisers",
  "contractors",
];

type Phase = "typing" | "pausing" | "erasing";

export function HeroSection({ onOpenWaitlist }: HeroSectionProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [logoHovered, setLogoHovered] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [btnActive, setBtnActive] = useState(false);
  const measureRef = useRef<HTMLSpanElement>(null);

  const currentWord = roles[wordIndex];
  const charCount = currentWord.length;

  // Measure the current word's pixel width
  useEffect(() => {
    if (measureRef.current) {
      setMeasuredWidth(measureRef.current.offsetWidth);
    }
  }, [wordIndex]);

  // Phase transitions
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (phase === "typing") {
      const typeDuration = charCount * 80;
      timeout = setTimeout(() => setPhase("pausing"), typeDuration);
    } else if (phase === "pausing") {
      timeout = setTimeout(() => setPhase("erasing"), 2000);
    } else if (phase === "erasing") {
      const eraseDuration = charCount * 50;
      timeout = setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % roles.length);
        setPhase("typing");
      }, eraseDuration);
    }

    return () => clearTimeout(timeout);
  }, [phase, charCount]);

  // Compute container width and transition based on phase
  const getContainerStyle = useCallback(() => {
    if (phase === "typing") {
      return {
        width: measuredWidth,
        transition: `width ${charCount * 80}ms steps(${charCount}, end)`,
      };
    } else if (phase === "pausing") {
      return {
        width: measuredWidth,
        transition: "none",
      };
    } else {
      // erasing
      return {
        width: 0,
        transition: `width ${charCount * 50}ms steps(${charCount}, end)`,
      };
    }
  }, [phase, measuredWidth, charCount]);

  const containerAnim = getContainerStyle();

  return (
    <>
    {/* Inline keyframe — Tailwind 4 strips custom @keyframes from globals.css */}
    <style>{`
      @keyframes btnPulse {
        0% { transform: scale(1); }
        50% { opacity: 0.2; }
        100% { transform: scale(1.2, 1.4); opacity: 0; }
      }
    `}</style>
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
    >
      {/* Logo — centered top, mirror flip on hover */}
      <a
        href="/"
        onMouseEnter={() => setLogoHovered(true)}
        onMouseLeave={() => setLogoHovered(false)}
        style={{
          height: 100,
          width: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          textDecoration: "none",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mvr-logo.svg"
          alt="MVR"
          width={82}
          height={32}
          style={{
            transition: "all 0.4s ease",
            transform: logoHovered ? "scaleX(-1)" : "scaleX(1)",
          }}
        />
      </a>

      {/* Hero — matching reference .hero padding and layout */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "140px 0 140px",
          width: "100%",
        }}
      >
        {/* Static title line */}
        <h1
          style={{
            letterSpacing: "-1px",
            fontWeight: 300,
            lineHeight: 1.6,
            fontSize: 40,
            color: "#222",
            position: "relative",
            maxWidth: "90%",
            margin: "0 auto",
            width: 500,
          }}
        >
          Houston&apos;s first platform for
        </h1>

        {/* Rotating word line — clip-reveal pattern */}
        <h1
          style={{
            letterSpacing: "-1px",
            fontWeight: 300,
            lineHeight: 1.6,
            fontSize: 40,
            color: "#222",
            position: "relative",
            maxWidth: "90%",
            margin: "0 auto",
            width: 500,
          }}
        >
          {/* Hidden measurement span — renders current word offscreen to get pixel width */}
          <span
            ref={measureRef}
            aria-hidden="true"
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              position: "absolute",
              visibility: "hidden",
              pointerEvents: "none",
            }}
          >
            {currentWord}
          </span>

          {/* Animated clip container */}
          <span
            style={{
              display: "inline-block",
              position: "relative",
              overflow: "hidden",
              whiteSpace: "nowrap",
              verticalAlign: "bottom",
              width: containerAnim.width,
              transition: containerAnim.transition,
            }}
          >
            {/* All words stacked — only current is visible */}
            {roles.map((role, i) => (
              <span
                key={role}
                style={
                  i === wordIndex
                    ? {
                        display: "inline-block",
                        whiteSpace: "nowrap",
                        position: "relative",
                        opacity: 1,
                      }
                    : {
                        display: "inline-block",
                        whiteSpace: "nowrap",
                        position: "absolute",
                        left: 0,
                        top: 0,
                        opacity: 0,
                      }
                }
              >
                {role}
              </span>
            ))}

            {/* Blinking cursor at right edge */}
            <span
              style={{
                position: "absolute",
                right: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: 2,
                height: "80%",
                backgroundColor: "#222",
                borderRadius: 2,
                animation: "blink 0.8s step-end infinite",
              }}
            />
          </span>
        </h1>

        {/* CTA button — matching reference .button exactly */}
        <div style={{ position: "relative", marginTop: 30, overflow: "visible" }}>
          {/* Pulse animation behind button — reference .button:before */}
          <span
            style={{
              animation: "btnPulse 2s ease infinite",
              background: "rgba(54, 54, 54, 0.6)",
              borderRadius: 100,
              position: "absolute",
              overflow: "visible",
              zIndex: 0,
              bottom: 0,
              right: 0,
              left: 0,
              top: 0,
            }}
          />
          <button
            onClick={onOpenWaitlist}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => { setBtnHovered(false); setBtnActive(false); }}
            onMouseDown={() => setBtnActive(true)}
            onMouseUp={() => setBtnActive(false)}
            style={{
              boxShadow: btnActive
                ? "0 20px 30px -10px rgba(54, 54, 54, 0.6)"
                : btnHovered
                  ? "0 30px 40px -10px rgba(54, 54, 54, 0.8)"
                  : "0 20px 30px -10px rgba(54, 54, 54, 0.6)",
              transform: btnActive
                ? "scale(1)"
                : btnHovered
                  ? "scale(1.04)"
                  : "scale(1)",
              padding: "12px 30px 10px",
              letterSpacing: "-0.5px",
              display: "inline-block",
              borderRadius: 100,
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 16,
              lineHeight: 2,
              transition: "all 0.4s ease",
              textAlign: "center",
              position: "relative",
              background: "#000",
              cursor: "pointer",
              color: "#fff",
              border: "none",
              zIndex: 2,
            }}
          >
            Join the waitlist
          </button>
        </div>

        {/* Subtitle */}
        <p
          style={{
            marginTop: 16,
            fontSize: 12,
            letterSpacing: "-0.3px",
            fontWeight: 300,
            color: "#222",
          }}
        >
          Secure your ZIP before launch.
        </p>
      </div>
    </section>
    </>
  );
}
