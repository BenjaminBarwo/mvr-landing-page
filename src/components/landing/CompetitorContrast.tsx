"use client";

import { useEffect, useRef, useState } from "react";

const pillars = [
  {
    title: "Professionals deserve territory.",
    body: "The industry shifted to open marketplaces where anyone can flood your ZIP. MVR moves the other way — capped seats, real ownership.",
  },
  {
    title: "Fewer seats, deeper trust.",
    body: "When everyone's allowed in, no one's protected. Limited seats per ZIP mean every founding member has room to grow, not just compete.",
  },
  {
    title: "Your market, protected.",
    body: "ZIP-level routing exclusivity, enforced by the platform. No shared leads. No bidding wars. No platform working against you.",
  },
];

export function CompetitorContrast() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const sectionStyle: React.CSSProperties = {
    padding: "120px 0 80px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const headingStyle: React.CSSProperties = {
    fontSize: 36,
    fontWeight: 300,
    letterSpacing: "-1px",
    color: "#222",
    marginBottom: 60,
    textAlign: "center",
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 24,
    maxWidth: 960,
    width: "100%",
    padding: "0 24px",
  };

  return (
    <section ref={sectionRef} style={sectionStyle}>
      <h2 style={headingStyle}>Why MVR exists.</h2>

      <div style={gridStyle}>
        {pillars.map((point, index) => {
          const cardStyle: React.CSSProperties = {
            background: "#fff",
            borderRadius: 8,
            padding: 32,
            boxShadow: "0 20px 30px -10px rgba(34,34,34,0.08)",
            borderTop: "3px solid #d0d0d0",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
            transition: `opacity 0.6s ease ${index * 200}ms, transform 0.6s ease ${index * 200}ms`,
          };

          return (
            <div key={point.title} style={cardStyle}>
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  color: "#222",
                  letterSpacing: "-0.5px",
                  marginBottom: 12,
                  marginTop: 0,
                  textAlign: "left",
                }}
              >
                {point.title}
              </h3>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 300,
                  lineHeight: 1.8,
                  color: "#666",
                  margin: 0,
                  textAlign: "left",
                }}
              >
                {point.body}
              </p>
            </div>
          );
        })}
      </div>

    </section>
  );
}
