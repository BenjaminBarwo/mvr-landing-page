"use client";

export function CoFounderCard() {
  return (
    <section style={{ position: "relative", padding: "120px 0 40px", overflow: "hidden" }}>
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
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 480,
          margin: "0 auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        {/* Photo */}
        <div style={{ position: "relative", width: 280, marginBottom: 32 }}>
          <img
            src="/cofounder-matthew.jpg"
            alt="Matthew Bramow"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
            }}
          />
          {/* Bottom fade */}
          <div
            style={{
              position: "absolute",
              bottom: -2,
              left: 0,
              right: 0,
              height: "60%",
              background: "linear-gradient(to bottom, transparent 0%, #f2f3f5 70%)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Text content */}
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
            maxWidth: 360,
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
    </section>
  );
}
