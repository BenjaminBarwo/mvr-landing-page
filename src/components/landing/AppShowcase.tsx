"use client";

import { useEffect, useRef, useState } from "react";

export function AppShowcase() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [hasVideo, setHasVideo] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    fetch("/mvr-demo.mp4", { method: "HEAD" })
      .then((res) => {
        if (!res.ok) setHasVideo(false);
      })
      .catch(() => setHasVideo(false));
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <>
    <style>{`
      @keyframes mutePulse {
        0% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.8); opacity: 0; }
        100% { transform: scale(1.8); opacity: 0; }
      }
    `}</style>
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
        {hasVideo ? (
          <>
            <video
              ref={videoRef}
              src="/mvr-demo.mp4"
              autoPlay
              muted
              loop
              playsInline
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                objectFit: isMobile ? "cover" : "contain",
              }}
            />

            {/* Mute/Unmute button */}
            <div style={{ position: "absolute", bottom: 16, right: 16, zIndex: 10 }}>
              <span
                style={{
                  animation: "mutePulse 1.5s ease-out infinite",
                  background: "rgba(255, 255, 255, 0.5)",
                  borderRadius: "50%",
                  position: "absolute",
                  zIndex: 0,
                  pointerEvents: "none",
                  bottom: 0,
                  right: 0,
                  left: 0,
                  top: 0,
                }}
              />
              <button
                onClick={toggleMute}
                style={{
                  position: "relative",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.5)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(8px)",
                  transition: "background 0.2s",
                  zIndex: 2,
                }}
                aria-label={isMuted ? "Unmute video" : "Mute video"}
              >
                {isMuted ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                )}
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
              color: "#B2B2B2",
              background: "#e8e9eb",
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 300 }}>
              Product demo coming soon
            </span>
          </div>
        )}
    </div>
    </>
  );
}
