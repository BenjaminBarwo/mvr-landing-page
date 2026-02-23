"use client";

import { useEffect, useRef, useState } from "react";

export function CoFounderCard() {
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    function handleScroll() {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      setOffset(rect.top * 0.05);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{ position: "relative", padding: "120px 0 40px", overflow: "hidden" }}
    >
      <h2
        style={{
          letterSpacing: "-1px",
          fontWeight: 300,
          lineHeight: 1.6,
          fontSize: 36,
          color: "#222",
          textAlign: "center",
          maxWidth: "90%",
          margin: "0 auto 60px",
        }}
      >
        Backed by industry experience
      </h2>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 60,
          maxWidth: 940,
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        {/* Left column — large hero photo with parallax + bottom fade */}
        <div
          style={{
            flex: "0 0 55%",
            minWidth: 0,
            position: "relative",
          }}
        >
          <img
            src="/cofounder-matthew.jpg"
            alt="Matthew Bramow"
            style={{
              width: "120%",
              maxWidth: "none",
              height: "auto",
              display: "block",
              transform: `translateY(${offset}px)`,
              transition: "transform 0.1s linear",
              willChange: "transform",
            }}
          />
          {/* Bottom fade overlay — tall enough to cover parallax movement */}
          <div
            style={{
              position: "absolute",
              bottom: -20,
              left: "-10%",
              right: "-10%",
              height: "45%",
              background:
                "linear-gradient(to bottom, transparent 0%, #f5f5f5 55%)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Right column — text content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <h3
            style={{
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: "-1px",
              color: "#000",
              margin: 0,
            }}
          >
            Matthew Bramow
          </h3>
          <p
            style={{
              fontSize: 16,
              fontWeight: 300,
              lineHeight: 2,
              letterSpacing: "-0.3px",
              color: "#222",
              margin: "4px 0 0",
            }}
          >
            Co-Founder
          </p>
          <p
            style={{
              fontSize: 14,
              fontWeight: 300,
              lineHeight: 2,
              letterSpacing: "-0.3px",
              color: "#222",
              margin: 0,
            }}
          >
            CEO, Model Mortgage &middot; NMLS #1373388
          </p>

          <p
            style={{
              fontSize: 16,
              fontWeight: 300,
              fontStyle: "italic",
              lineHeight: 2,
              letterSpacing: "-0.3px",
              color: "#222",
              margin: "24px 0 0",
            }}
          >
            &ldquo;Real estate professionals deserve a platform that protects
            their territory and rewards early commitment.&rdquo;
          </p>

          <a
            href="https://modelmtg.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: 16,
              fontSize: 14,
              fontWeight: 500,
              color: "#222",
              letterSpacing: "-0.3px",
              textDecoration: "underline",
              transition: "all 0.4s ease",
            }}
          >
            modelmtg.com
          </a>
        </div>
      </div>
    </section>
  );
}
