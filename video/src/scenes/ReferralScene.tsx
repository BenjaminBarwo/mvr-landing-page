import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMove } from "../components/CameraMove";

/* ── Card Data ──────────────────────────────────────────────────── */

interface CardData {
  metric: string;
  label: string;
  descriptor: string;
}

const cards: CardData[] = [
  { metric: "$0", label: "Ad Spend", descriptor: "Buyers come straight to you" },
  { metric: "3x", label: "Repeat Rate", descriptor: "Built-in loyalty" },
  { metric: "∞", label: "Referrals", descriptor: "They send friends & family" },
];

// Per-card rotateY: converging from different angles
const CARD_ROTATE_Y = [12, 0, -12];

/* ── Main Scene ─────────────────────────────────────────────────── */

export const ReferralScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Scene fade in (frames 0–10)
  const sceneFadeIn = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Scene fade out (last 15 frames)
  const sceneFadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const sceneOpacity = sceneFadeIn * sceneFadeOut;

  // Card stagger: card 0 at 10–25, card 1 at 22–37, card 2 at 34–49
  const cardAnimations = cards.map((_, i) => {
    const start = 10 + i * 12;
    const end = start + 15;

    const opacity = interpolate(frame, [start, end], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    // Scale from depth: 0.25 → 1 (quartic ease-out)
    const scale = interpolate(frame, [start, end], [0.25, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: (t) => 1 - Math.pow(1 - t, 4),
    });

    const translateY = interpolate(frame, [start, end], [20, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });

    // Depth blur: 4px → 0px (quadratic ease-out)
    const blur = interpolate(frame, [start, end], [4, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: (t) => 1 - Math.pow(1 - t, 2),
    });

    // Perspective rotateY: converge from different angles
    const rotateY = interpolate(frame, [start, end], [CARD_ROTATE_Y[i], 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });

    return { opacity, scale, translateY, blur, rotateY };
  });

  // Bottom title fades in (frames 55–70)
  const titleOpacity = interpolate(frame, [55, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleY = interpolate(frame, [55, 70], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#f5f5f5", opacity: sceneOpacity }}>
      <CameraMove driftDirection={1} driftX={30} driftY={5} zoom={1.02}>
        {/* Cards row — centered, with perspective */}
        <div
          style={{
            position: "absolute",
            top: "38%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            alignItems: "center",
            gap: 32,
            perspective: 1000,
          }}
        >
          {cards.map((card, i) => {
            const anim = cardAnimations[i];

            return (
              <div
                key={card.label}
                style={{
                  opacity: anim.opacity,
                  transform: `scale(${anim.scale}) translateY(${anim.translateY}px) rotateY(${anim.rotateY}deg)`,
                  filter: `blur(${anim.blur}px)`,
                  width: 260,
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: "40px 28px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 56,
                    fontWeight: 800,
                    color: "#111",
                    lineHeight: 1.1,
                  }}
                >
                  {card.metric}
                </div>
                <div
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#111",
                    marginTop: 12,
                    lineHeight: 1.3,
                  }}
                >
                  {card.label}
                </div>
                <div
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 15,
                    fontWeight: 400,
                    color: "#9CA3AF",
                    marginTop: 8,
                    lineHeight: 1.4,
                  }}
                >
                  {card.descriptor}
                </div>
              </div>
            );
          })}
        </div>

      </CameraMove>

      {/* Bottom title — anchored outside CameraMove */}
      <div
        style={{
          position: "absolute",
          bottom: "22%",
          left: "50%",
          transform: `translateX(-50%) translateY(${titleY}px)`,
          opacity: titleOpacity,
          textAlign: "center",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 38,
            fontWeight: 600,
            color: "#222",
            letterSpacing: "-0.02em",
          }}
        >
          Deals That Multiply
        </div>
      </div>
    </AbsoluteFill>
  );
};
