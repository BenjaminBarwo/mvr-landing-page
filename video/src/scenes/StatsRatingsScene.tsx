import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMove } from "../components/CameraMove";


/**
 * Animated metrics scene — stars, response time, reviews, quote.
 * Each block rises from below with forward tilt, settling flat.
 * Later blocks travel farther for parallax depth.
 */

// Block motion configs: increasing depth per block
const BLOCK_MOTION = [
  { start: 8, end: 22, translateY: 40, rotateX: 8 },   // Stars
  { start: 40, end: 56, translateY: 55, rotateX: 10 },  // Response
  { start: 60, end: 78, translateY: 65, rotateX: 12 },  // Reviews
  { start: 90, end: 112, translateY: 75, rotateX: 14 }, // Quote
];

const cubicEaseOut = (t: number): number => 1 - Math.pow(1 - t, 3);

export const StatsRatingsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // ── Block 3D entrance interpolations ───────────────────
  const blockAnims = BLOCK_MOTION.map((cfg) => {
    const progress = interpolate(frame, [cfg.start, cfg.end], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const fadeIn = interpolate(frame, [cfg.start, cfg.start + 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const translateY = interpolate(progress, [0, 1], [cfg.translateY, 0], {
      easing: cubicEaseOut,
    });
    const rotateX = interpolate(progress, [0, 1], [cfg.rotateX, 0], {
      easing: cubicEaseOut,
    });
    return { fadeIn, translateY, rotateX };
  });

  // ── Stars (frames 8–50) ──────────────────────────────
  const starsProgress = interpolate(frame, [8, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const filledStars = Math.min(5, Math.floor(starsProgress * 6)); // 0→5
  const ratingNumber = interpolate(starsProgress, [0, 1], [0, 4.9], {
    extrapolateRight: "clamp",
  });

  // ── Response time (frames 40–75) ─────────────────────
  const responseProgress = interpolate(frame, [40, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const responseTime = Math.round(
    interpolate(responseProgress, [0, 1], [15, 2], {
      extrapolateRight: "clamp",
      easing: (t) => 1 - Math.pow(1 - t, 2),
    }),
  );

  // ── Reviews count (frames 60–100) ────────────────────
  const reviewsProgress = interpolate(frame, [60, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const reviewCount = Math.round(
    interpolate(reviewsProgress, [0, 1], [0, 47], {
      extrapolateRight: "clamp",
    }),
  );

  // ── Quote (frames 90–110) ────────────────────────────
  const quoteY = interpolate(frame, [90, 110], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: cubicEaseOut,
  });

  // ── Scene-level fade ─────────────────────────────────
  const sceneIn = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });
  const sceneOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#f5f5f5",
        opacity: sceneIn * sceneOut,
      }}
    >
      <CameraMove driftDirection={-1} driftX={15} driftY={10} zoom={1.06}>
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Column container with perspective */}
          <div
            style={{
              perspective: 1200,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 44,
            }}
          >
            {/* Stars row */}
            <div
              style={{
                opacity: blockAnims[0].fadeIn,
                transform: `translateY(${blockAnims[0].translateY}px) rotateX(${blockAnims[0].rotateX}deg)`,
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <svg key={i} width={52} height={52} viewBox="0 0 24 24">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      fill={i < filledStars ? "#D4A843" : "#E0DCDA"}
                      stroke={i < filledStars ? "#B8912A" : "#D0CCC8"}
                      strokeWidth={0.5}
                    />
                  </svg>
                ))}
              </div>
              <div
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 48,
                  fontWeight: 700,
                  color: "#222",
                }}
              >
                {ratingNumber.toFixed(1)}
              </div>
              <div
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 18,
                  color: "#888",
                  marginTop: 4,
                }}
              >
                Average Rating
              </div>
            </div>

            {/* Response time */}
            <div
              style={{
                opacity: blockAnims[1].fadeIn,
                transform: `translateY(${blockAnims[1].translateY}px) rotateX(${blockAnims[1].rotateX}deg)`,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 48,
                  fontWeight: 700,
                  color: "#222",
                }}
              >
                {responseTime} min
              </div>
              <div
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 18,
                  color: "#888",
                  marginTop: 4,
                }}
              >
                Avg Response Time
              </div>
            </div>

            {/* Verified Reviews */}
            <div
              style={{
                opacity: blockAnims[2].fadeIn,
                transform: `translateY(${blockAnims[2].translateY}px) rotateX(${blockAnims[2].rotateX}deg)`,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 48,
                  fontWeight: 700,
                  color: "#222",
                }}
              >
                {reviewCount} Verified Reviews
              </div>
            </div>

            {/* Quote */}
            <div
              style={{
                opacity: blockAnims[3].fadeIn,
                transform: `translateY(${blockAnims[3].translateY}px) rotateX(${blockAnims[3].rotateX}deg)`,
                textAlign: "center",
                maxWidth: 800,
              }}
            >
              <div
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 26,
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: "#555",
                  lineHeight: 1.5,
                }}
              >
                &ldquo;Best agent I&rsquo;ve worked with&rdquo;
              </div>
              <div
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 18,
                  color: "#999",
                  marginTop: 8,
                }}
              >
                &mdash; Sarah M.
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </CameraMove>
    </AbsoluteFill>
  );
};
