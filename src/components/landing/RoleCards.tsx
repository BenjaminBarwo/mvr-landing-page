"use client";

import { useEffect, useState } from "react";

const roles = [
  { name: "Agent", icon: "home" },
  { name: "Lender", icon: "dollar-sign" },
  { name: "Inspector", icon: "clipboard" },
  { name: "Title Company", icon: "file-text" },
  { name: "Appraiser", icon: "search" },
  { name: "Contractor", icon: "tool" },
];

function RoleIcon({ icon }: { icon: string }) {
  const props = {
    width: 32,
    height: 32,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (icon) {
    case "home":
      return (
        <svg {...props}>
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "dollar-sign":
      return (
        <svg {...props}>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      );
    case "clipboard":
      return (
        <svg {...props}>
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      );
    case "file-text":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "tool":
      return (
        <svg {...props}>
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
        </svg>
      );
    default:
      return null;
  }
}

/* Matching reference .slider pattern — Flickity-style auto-advance with scale */
export function RoleCards() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % roles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section style={{ position: "relative", padding: "120px 0 0" }}>
      <h2
        style={{
          letterSpacing: "-1px",
          fontWeight: 300,
          lineHeight: 1.6,
          fontSize: 36,
          color: "#222",
          position: "relative",
          maxWidth: "90%",
          margin: "0 auto",
          width: 500,
        }}
      >
        Six founding roles
      </h2>

      {/* Card slider area with fade overlays */}
      <div style={{ position: "relative", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: 300,
            background: "linear-gradient(to right, #f2f3f5, transparent)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: 300,
            background: "linear-gradient(to left, #f2f3f5, transparent)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 20,
            padding: "80px 0 60px",
            overflow: "hidden",
          }}
        >
          {roles.map((role, i) => (
            <div
              key={role.name}
              style={{
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                padding: "40px 50px",
                borderRadius: 8,
                background: "#fff",
                boxShadow: "0 20px 30px -10px rgba(34, 34, 34, 0.08)",
                transition: "all 0.4s ease",
                transform: i === activeIndex ? "scale(1.2)" : "scale(1)",
                opacity: i === activeIndex ? 1 : 0.4,
                color: "#222",
              }}
            >
              <RoleIcon icon={role.icon} />
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  letterSpacing: "-0.3px",
                }}
              >
                {role.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
