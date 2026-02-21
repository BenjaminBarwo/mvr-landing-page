import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMove } from "../components/CameraMove";


/**
 * Search bar types "77007", then ZIP result chips flip face-up in a staggered wave.
 * 135 frames / 4.5s.
 */

const SEARCH_TEXT = "77007";
const TYPE_START = 12;
const TYPE_SPEED = 6; // frames per character

const ZIP_RESULTS = [
  { zip: "77007", name: "Heights", tier: "Premium" },
  { zip: "77006", name: "Montrose", tier: "Premium" },
  { zip: "77005", name: "West University", tier: "Premium" },
  { zip: "77004", name: "Midtown", tier: "Premium" },
  { zip: "77008", name: "Spring Branch", tier: "Standard" },
  { zip: "77009", name: "Northside", tier: "Standard" },
];

export const MapDiscoverScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Scene fade in
  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Search bar appears
  const barOpacity = interpolate(frame, [4, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const barY = interpolate(frame, [4, 14], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  // Search bar 3D tilt entrance
  const barRotateX = interpolate(frame, [4, 14], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });

  // Typewriter for search text
  const typeProgress = Math.min(
    Math.max(0, Math.floor((frame - TYPE_START) / TYPE_SPEED)),
    SEARCH_TEXT.length,
  );
  const typedText = SEARCH_TEXT.slice(0, typeProgress);
  const isTyping = frame >= TYPE_START && typeProgress < SEARCH_TEXT.length;
  const typeDone = typeProgress >= SEARCH_TEXT.length;

  // Blinking cursor
  const cursorOn = isTyping || (typeDone && Math.floor(frame / 15) % 2 === 0);

  // ZIP chips pop in after typing finishes
  const chipsStart = TYPE_START + SEARCH_TEXT.length * TYPE_SPEED + 8; // ~50

  // Fade out
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title text
  const titleOpacity = interpolate(frame, [chipsStart + 20, chipsStart + 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#f5f5f5",
        opacity: fadeIn * fadeOut,
      }}
    >
      <CameraMove driftDirection={1} driftX={20} driftY={8} zoom={1.03}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Search bar — perspective container */}
          <div style={{ perspective: 1000 }}>
            <div
              style={{
                transform: `translateY(${barY}px) rotateX(${barRotateX}deg)`,
                opacity: barOpacity,
                width: 580,
                height: 72,
                backgroundColor: "white",
                borderRadius: 16,
                boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                padding: "0 28px",
                gap: 16,
              }}
            >
              {/* Search icon */}
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>

              {/* Typed text + cursor */}
              <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <span
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 28,
                    fontWeight: 500,
                    color: "#111",
                    letterSpacing: 2,
                  }}
                >
                  {typedText}
                </span>
                <span
                  style={{
                    display: "inline-block",
                    width: 2.5,
                    height: 28,
                    backgroundColor: cursorOn ? "#111" : "transparent",
                    marginLeft: 1,
                  }}
                />
                {!typedText && (
                  <span
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: 22,
                      color: "#D1D5DB",
                      marginLeft: 4,
                    }}
                  >
                    Search by ZIP code
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ZIP result chips — perspective container for Y-axis flip */}
          <div
            style={{
              perspective: 800,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 14,
              marginTop: 32,
              maxWidth: 700,
            }}
          >
            {ZIP_RESULTS.map((result, i) => {
              const chipDelay = chipsStart + i * 5;
              const chipProgress = interpolate(frame, [chipDelay, chipDelay + 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const chipScale = interpolate(chipProgress, [0, 1], [0.7, 1], {
                extrapolateRight: "clamp",
                easing: (t) => 1 - Math.pow(1 - t, 3),
              });
              const chipY = interpolate(chipProgress, [0, 1], [12, 0], {
                extrapolateRight: "clamp",
              });
              // Y-axis flip: chip starts face-down, flips face-up
              const chipRotateY = interpolate(chipProgress, [0, 1], [90, 0], {
                extrapolateRight: "clamp",
                easing: (t) => 1 - Math.pow(1 - t, 3),
              });

              return (
                <div
                  key={result.zip}
                  style={{
                    opacity: chipProgress,
                    transform: `scale(${chipScale}) translateY(${chipY}px) rotateY(${chipRotateY}deg)`,
                    backfaceVisibility: "hidden",
                    backgroundColor: i === 0 ? "#111" : "white",
                    color: i === 0 ? "white" : "#374151",
                    borderRadius: 12,
                    padding: "14px 22px",
                    boxShadow: i === 0
                      ? "0 4px 16px rgba(0,0,0,0.15)"
                      : "0 2px 12px rgba(0,0,0,0.06)",
                    textAlign: "center",
                    minWidth: 130,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: 1,
                    }}
                  >
                    {result.zip}
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: 14,
                      fontWeight: 500,
                      color: i === 0 ? "rgba(255,255,255,0.7)" : "#9CA3AF",
                      marginTop: 2,
                    }}
                  >
                    {result.name}
                  </div>
                </div>
              );
            })}
          </div>

        </AbsoluteFill>
      </CameraMove>

      {/* Title text — anchored outside CameraMove */}
      <div
        style={{
          position: "absolute",
          bottom: "16%",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          opacity: titleOpacity,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 38,
            fontWeight: 600,
            color: "#222",
          }}
        >
          Buyers Search by ZIP Code
        </div>
        <div
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 20,
            fontWeight: 400,
            color: "#888",
            marginTop: 8,
          }}
        >
          Houston metro area coverage
        </div>
      </div>
    </AbsoluteFill>
  );
};
