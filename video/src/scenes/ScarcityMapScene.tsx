import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMove } from "../components/CameraMove";


/**
 * Seat meter for 77007 (Heights). Progress bar fills 3/5 → 4/5 with pulse.
 * Phase A: 3D compound tilt entrance. Phase B: damped camera shake at seat fill.
 * 114 frames / 3.8s.
 */

const TOTAL_SEATS = 5;
const INITIAL_SEATS = 3;
const TICK_FRAME = 55; // seat count changes 3→4
const SHAKE_DURATION = 10; // frames of shake

const cubicEaseOut = (t: number): number => 1 - Math.pow(1 - t, 3);

export const ScarcityMapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Scene fade
  const sceneIn = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });
  const sceneOut = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Phase A: 3D tilt entrance (frames 5–25) ───────────
  const entranceProgress = interpolate(frame, [5, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardTranslateY = interpolate(entranceProgress, [0, 1], [50, 0], {
    easing: cubicEaseOut,
  });
  const cardRotateX = interpolate(entranceProgress, [0, 1], [15, 0], {
    easing: cubicEaseOut,
  });
  const cardRotateY = interpolate(entranceProgress, [0, 1], [-10, 0], {
    easing: cubicEaseOut,
  });
  const cardOpacity = interpolate(frame, [5, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Phase B: Damped sinusoidal shake at TICK_FRAME ─────
  let shakeX = 0;
  let shakeY = 0;
  let shakeScale = 1;

  if (frame >= TICK_FRAME && frame < TICK_FRAME + SHAKE_DURATION) {
    const shakeProgress = (frame - TICK_FRAME) / SHAKE_DURATION;
    const damping = 1 - shakeProgress; // linear 1→0

    shakeX = damping * 6 * Math.sin(shakeProgress * 2 * Math.PI * 3);
    shakeY = damping * 4 * Math.sin(shakeProgress * 2 * Math.PI * 3 + Math.PI / 2);
    shakeScale = 1 + 0.02 * damping * Math.sin(shakeProgress * Math.PI);
  }

  // Seat count + progress bar
  const seatCount = frame >= TICK_FRAME ? INITIAL_SEATS + 1 : INITIAL_SEATS;
  const isWarning = seatCount >= 4;

  // Smooth bar fill
  const barFill = interpolate(
    frame,
    [TICK_FRAME, TICK_FRAME + 18],
    [INITIAL_SEATS / TOTAL_SEATS, (INITIAL_SEATS + 1) / TOTAL_SEATS],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const barWidth = frame < TICK_FRAME ? (INITIAL_SEATS / TOTAL_SEATS) * 100 : barFill * 100;

  // Pulse on tick (bumped from 0.03 to 0.04)
  const pulse =
    frame >= TICK_FRAME && frame <= TICK_FRAME + 18
      ? 1 + 0.04 * Math.sin(((frame - TICK_FRAME) / 18) * Math.PI * 2)
      : 1;

  // Seat dots
  const dotStart = 25;

  // Bottom label
  const labelOpacity = interpolate(frame, [35, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#f5f5f5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: sceneIn * sceneOut,
      }}
    >
      <CameraMove driftDirection={-1} driftX={10} driftY={15} zoom={1.05}>
        {/* Shake container — active only at TICK_FRAME */}
        <AbsoluteFill
          style={{
            transform: `translate(${shakeX}px, ${shakeY}px) scale(${shakeScale})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Perspective container */}
          <div style={{ perspective: 1000 }}>
            {/* Main card — 3D tilt entrance */}
            <div
              style={{
                transform: `translateY(${cardTranslateY}px) rotateX(${cardRotateX}deg) rotateY(${cardRotateY}deg) scale(${pulse})`,
                opacity: cardOpacity,
                backgroundColor: "white",
                borderRadius: 24,
                padding: "48px 64px",
                boxShadow: "0 8px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04)",
                textAlign: "center",
                minWidth: 480,
              }}
            >
              {/* ZIP label */}
              <div
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#9CA3AF",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                77007 &middot; Heights
              </div>

              {/* Big number */}
              <div
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 72,
                  fontWeight: 800,
                  color: isWarning ? "#DC2626" : "#111",
                  lineHeight: 1,
                  marginBottom: 20,
                }}
              >
                {seatCount}/{TOTAL_SEATS}
              </div>

              {/* Seat dots */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                {Array.from({ length: TOTAL_SEATS }).map((_, i) => {
                  const dotDelay = dotStart + i * 4;
                  const dotOpacity = interpolate(frame, [dotDelay, dotDelay + 8], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  });

                  // The 4th dot (index 3) fills at TICK_FRAME
                  const isFilled = i < INITIAL_SEATS || (i === INITIAL_SEATS && frame >= TICK_FRAME);
                  const fillProgress =
                    i === INITIAL_SEATS
                      ? interpolate(frame, [TICK_FRAME, TICK_FRAME + 12], [0, 1], {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                        })
                      : isFilled
                        ? 1
                        : 0;

                  const dotScale =
                    i === INITIAL_SEATS && frame >= TICK_FRAME && frame <= TICK_FRAME + 12
                      ? 1 + 0.2 * Math.sin(((frame - TICK_FRAME) / 12) * Math.PI)
                      : 1;

                  const bgColor = isFilled
                    ? isWarning && i >= INITIAL_SEATS
                      ? `rgba(220, 38, 38, ${fillProgress})`
                      : "#111"
                    : "#E5E7EB";

                  return (
                    <div
                      key={i}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: bgColor,
                        opacity: dotOpacity,
                        transform: `scale(${dotScale})`,
                        transition: "background-color 0.2s",
                      }}
                    />
                  );
                })}
              </div>

              {/* Progress bar */}
              <div
                style={{
                  width: 380,
                  height: 10,
                  backgroundColor: "#F3F4F6",
                  borderRadius: 5,
                  overflow: "hidden",
                  margin: "0 auto 16px",
                }}
              >
                <div
                  style={{
                    width: `${barWidth}%`,
                    height: "100%",
                    backgroundColor: isWarning ? "#DC2626" : "#111",
                    borderRadius: 5,
                  }}
                />
              </div>

              {/* Label */}
              <div
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 18,
                  fontWeight: 500,
                  color: "#6B7280",
                }}
              >
                Agent Seats Claimed
              </div>
            </div>
          </div>

        </AbsoluteFill>
      </CameraMove>

      {/* Bottom label — anchored outside CameraMove + shake */}
      <div
        style={{
          position: "absolute",
          bottom: "14%",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          opacity: labelOpacity,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 34,
            fontWeight: 600,
            color: "#222",
          }}
        >
          Seats Are Limited by ZIP Code
        </div>
      </div>
    </AbsoluteFill>
  );
};
