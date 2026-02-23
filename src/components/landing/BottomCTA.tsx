"use client";

interface BottomCTAProps {
  onOpenWaitlist: () => void;
}

export function BottomCTA({ onOpenWaitlist }: BottomCTAProps) {
  return (
    <section style={{ overflow: "hidden", padding: 0, position: "relative" }}>
      <div
        style={{
          position: "relative",
          padding: "120px 0",
          width: "100%",
          zIndex: 2,
        }}
      >
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
          Secure your founding seat before launch.
        </h1>

        {/* Button with pulse — matching reference .button.white */}
        <div style={{ position: "relative", marginTop: 30, display: "inline-block" }}>
          <span
            style={{
              animation: "pulse 2s ease infinite",
              background: "rgba(54, 54, 54, 0.4)",
              borderRadius: 100,
              position: "absolute",
              zIndex: 0,
              bottom: 0,
              right: 0,
              left: 0,
              top: 0,
            }}
          />
          <button
            onClick={onOpenWaitlist}
            style={{
              boxShadow: "0 20px 30px -10px rgba(54, 54, 54, 0.6)",
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
            Reserve your seat
          </button>
        </div>

        <p
          style={{
            marginTop: 16,
            fontSize: 12,
            letterSpacing: "-0.3px",
            fontWeight: 300,
            color: "#222",
          }}
        >
          Limited seats per ZIP code.
        </p>
      </div>
    </section>
  );
}
