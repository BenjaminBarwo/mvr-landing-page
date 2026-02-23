"use client";

import { useEffect, useRef, useState } from "react";

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

  const cards = [
    {
      title: "Pay to compete.",
      body: "The largest platforms charge agents $1,000 or more per month for leads — leads that are simultaneously sent to three or four other agents in the same ZIP code. You pay a premium. Your close rate drops. Their revenue doesn't.",
    },
    {
      title: "The platform becomes the competitor.",
      body: "Redfin employs its own agents. Zillow routes buyers to the highest bidder. Realtor.com sells the same lead to multiple agents at once. The platforms that were built to serve real estate professionals now compete with them.",
    },
  ];

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

  const cardsContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 24,
    maxWidth: 640,
    width: "100%",
    padding: "0 24px",
  };

  const getCardStyle = (index: number): React.CSSProperties => ({
    background: "#fff",
    borderRadius: 8,
    padding: 40,
    boxShadow: "0 20px 30px -10px rgba(34,34,34,0.08)",
    borderLeft: "3px solid #e0e0e0",
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(30px)",
    transition: `opacity 0.6s ease ${index * 400}ms, transform 0.6s ease ${index * 400}ms`,
  });

  const cardTitleStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 500,
    letterSpacing: "-0.5px",
    color: "#222",
    marginBottom: 12,
  };

  const cardBodyStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 300,
    lineHeight: 2,
    letterSpacing: "-0.3px",
    color: "#444",
    margin: 0,
  };

  const counterBlockStyle: React.CSSProperties = {
    textAlign: "center",
    maxWidth: 540,
    marginTop: 64,
    padding: "0 24px",
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(20px)",
    transition: "opacity 0.8s ease 1000ms, transform 0.8s ease 1000ms",
  };

  const counterPrimaryStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 300,
    color: "#222",
    marginBottom: 16,
  };

  const counterSecondaryStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 300,
    lineHeight: 1.8,
    color: "#888",
    margin: 0,
  };

  return (
    <section ref={sectionRef} style={sectionStyle}>
      <h2 style={headingStyle}>The industry standard.</h2>

      <div style={cardsContainerStyle}>
        {cards.map((card, index) => (
          <div key={card.title} style={getCardStyle(index)}>
            <h3 style={cardTitleStyle}>{card.title}</h3>
            <p style={cardBodyStyle}>{card.body}</p>
          </div>
        ))}
      </div>

      <div style={counterBlockStyle}>
        <p style={counterPrimaryStyle}>
          Territory protection exists because this model is broken.
        </p>
        <p style={counterSecondaryStyle}>
          MVR starts with a different premise — your territory is yours. Limited
          seats per ZIP. No shared leads. No competing with the platform.
        </p>
      </div>
    </section>
  );
}
