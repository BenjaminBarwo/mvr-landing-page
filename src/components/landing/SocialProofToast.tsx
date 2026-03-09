"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const mockNames = [
  // Common American
  "Sarah", "James", "Emily", "David", "Rachel",
  "Marcus", "Lisa", "Anthony", "Jennifer", "Michael",
  "Amanda", "Robert", "Nicole", "Chris", "Jessica",
  "Brandon", "Olivia", "Derek", "Megan", "Jason",
  "Brianna", "Tyler", "Kevin", "Stephanie", "Daniel",
  "Lauren", "Ryan", "Jordan", "Heather", "Nathan",
  "Christina", "Travis", "Dustin", "Erica", "Patrick",
  "Amber", "Trevor", "Michelle", "Corey", "Natalie",
  "Brian", "Samantha", "Aaron", "Holly", "Sean",
  "Victor", "Angela", "Keith", "Diana", "Russell",
  "Veronica", "Craig", "Grant", "Tiffany", "Wesley",
  "Courtney", "Garrett", "Brooke", "Cameron", "Lindsey",
  "Shane", "Elliott", "Paige", "Jared", "Shelby",
  "Douglas", "Trent", "Isaiah", "Dominic", "Kristen",
  "Taylor", "Morgan", "Alexis", "Austin", "Kayla",
  "Hunter", "Savannah", "Colton", "Brittany", "Cody",
  "Bailey", "Dalton", "Kelsey", "Blake", "Haley",
  "Wyatt", "Mackenzie", "Tanner", "Sydney", "Bryce",
  // Hispanic / Latino
  "Carlos", "Maria", "Diego", "Gabriella", "Alejandro",
  "Sofia", "Javier", "Valentina", "Luis", "Camila",
  "Mateo", "Isabella", "Ricardo", "Daniela", "Fernando",
  "Rosa", "Arturo", "Elena", "Rodrigo", "Adriana",
  "Andres", "Catalina", "Hugo", "Mariana", "Rafael",
  "Lucia", "Sergio", "Carmen", "Pablo", "Ana",
  // African American
  "Andre", "Jasmine", "Malik", "Bianca", "Desmond",
  "Terrence", "Kendra", "Darius", "Aaliyah", "Cedric",
  "Imani", "Lamar", "Keisha", "Tyrone", "Shanice",
  "DeAndre", "Ebony", "Jamal", "Latoya", "Marquis",
  "Tamika", "Reginald", "Alicia", "Donovan", "Monique",
  "Xavier", "Janae", "Kendrick", "Tiana", "Dwayne",
  // South Asian
  "Priya", "Raj", "Ananya", "Arjun", "Deepa",
  "Vikram", "Meera", "Rohan", "Kavita", "Nikhil",
  "Sunita", "Amir", "Pooja", "Ravi", "Neha",
  "Sanjay", "Anjali", "Pranav", "Divya", "Suresh",
  // East Asian
  "Wei", "Mei", "Jin", "Yuki", "Hiro",
  "Suki", "Kai", "Mina", "Tao", "Linh",
  "Hana", "Jun", "Yuna", "Kenji", "Aiko",
  // Middle Eastern
  "Omar", "Layla", "Hassan", "Fatima", "Tariq",
  "Nadia", "Samir", "Yasmin", "Karim", "Amira",
  // Nigerian / West African
  "Chidi", "Nneka", "Emeka", "Adaeze", "Obiora",
  "Folake", "Kwame", "Ama", "Kofi", "Ngozi",
  // European
  "Luca", "Freya", "Stefan", "Ingrid", "Matteo",
  "Astrid", "Nikolai", "Greta", "Dimitri", "Katarina",
];

const CHAR_SPEED = 40;
const ERASE_SPEED = 25;
const PAUSE_AFTER_TYPE = 2000;
const SLIDE_DURATION = 400;
const STAGGER_DELAY = 1200;
const TOAST_SLOT_HEIGHT = 56; // 48px toast + 8px gap
const BURST_DELAY_MIN = 90000;
const BURST_DELAY_MAX = 180000;

const BURST_WEIGHTS = [0.90, 0.08, 0.02, 0.00];

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollBurstCount(): number {
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < BURST_WEIGHTS.length; i++) {
    cumulative += BURST_WEIGHTS[i];
    if (r < cumulative) return i + 1;
  }
  return 1;
}

function pickUniqueNames(count: number, exclude: string[]): string[] {
  const available = mockNames.filter((n) => !exclude.includes(n));
  const picked: string[] = [];
  const pool = [...available];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}

// --- ToastItem: renders one toast with typewriter -> pause -> erase ---

interface ToastItemProps {
  name: string;
  bottom: number;
  delay: number;
  isMobile: boolean;
  onComplete: () => void;
}

function ToastItem({ name, bottom, delay, isMobile, onComplete }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"waiting" | "idle" | "typing" | "pausing" | "erasing">("waiting");
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const measureRef = useRef<HTMLSpanElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const fullText = `${name} just joined MVR`;
  const charCount = fullText.length;

  // Stagger delay before appearing
  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(true);
      setPhase("idle");
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);

  // Start typing after slide-in
  useEffect(() => {
    if (phase !== "idle") return;
    const t = setTimeout(() => setPhase("typing"), SLIDE_DURATION);
    return () => clearTimeout(t);
  }, [phase]);

  // Phase state machine
  useEffect(() => {
    if (phase === "waiting" || phase === "idle") return;

    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      timeout = setTimeout(() => setPhase("pausing"), charCount * CHAR_SPEED);
    } else if (phase === "pausing") {
      timeout = setTimeout(() => setPhase("erasing"), PAUSE_AFTER_TYPE);
    } else if (phase === "erasing") {
      timeout = setTimeout(() => {
        setVisible(false);
        // Wait for slide-out, then signal complete
        setTimeout(() => onCompleteRef.current(), SLIDE_DURATION);
      }, charCount * ERASE_SPEED);
    }

    return () => clearTimeout(timeout!);
  }, [phase, charCount]);

  // Measure text width
  useEffect(() => {
    if (measureRef.current) {
      setMeasuredWidth(measureRef.current.offsetWidth + 12);
    }
  }, [name]);

  let clipWidth = 0;
  let clipTransition = "none";

  if (phase === "typing") {
    clipWidth = measuredWidth;
    clipTransition = `width ${charCount * CHAR_SPEED}ms steps(${charCount}, end)`;
  } else if (phase === "pausing") {
    clipWidth = measuredWidth;
    clipTransition = "none";
  } else if (phase === "erasing") {
    clipWidth = 0;
    clipTransition = `width ${charCount * ERASE_SPEED}ms steps(${charCount}, end)`;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom,
        left: isMobile ? 16 : 24,
        right: isMobile ? 16 : "auto",
        zIndex: 1000,
        maxWidth: isMobile ? "none" : 340,
        padding: "14px 20px",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity ${SLIDE_DURATION}ms ease, transform ${SLIDE_DURATION}ms ease`,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <span
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          fontSize: 14,
          fontWeight: 400,
        }}
      >
        {fullText}
      </span>

      <span
        style={{
          display: "inline-block",
          position: "relative",
          overflow: "hidden",
          whiteSpace: "nowrap",
          verticalAlign: "bottom",
          width: clipWidth,
          transition: clipTransition,
          fontSize: 14,
          color: "#333",
          lineHeight: 1.4,
        }}
      >
        <span style={{ display: "inline", whiteSpace: "nowrap" }}>
          <strong style={{ fontWeight: 600 }}>{name}</strong> just joined MVR
        </span>

        <span
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: 2,
            height: "60%",
            backgroundColor: "#333",
            borderRadius: 2,
            animation: "blink 0.8s step-end infinite",
          }}
        />
      </span>

      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// --- SocialProofToast: manager that orchestrates bursts ---

interface ActiveToast {
  id: number;
  name: string;
  bottom: number;
  delay: number;
}

export function SocialProofToast() {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const prevBurstNamesRef = useRef<string[]>([]);
  const nextIdRef = useRef(0);
  const completedCountRef = useRef(0);
  const burstSizeRef = useRef(0);
  const scheduledRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 480);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const scheduleBurst = useCallback(() => {
    const count = rollBurstCount();
    const names = pickUniqueNames(count, prevBurstNamesRef.current);
    prevBurstNamesRef.current = names;

    burstSizeRef.current = names.length;
    completedCountRef.current = 0;

    const newToasts: ActiveToast[] = names.map((name, i) => ({
      id: nextIdRef.current++,
      name,
      bottom: 24 + i * TOAST_SLOT_HEIGHT,
      delay: i * STAGGER_DELAY,
    }));

    setToasts(newToasts);
  }, []);

  const handleToastComplete = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    completedCountRef.current += 1;

    if (completedCountRef.current >= burstSizeRef.current) {
      // All toasts done — schedule next burst
      scheduledRef.current = setTimeout(() => {
        scheduleBurst();
      }, randomBetween(BURST_DELAY_MIN, BURST_DELAY_MAX));
    }
  }, [scheduleBurst]);

  // Initial burst after 5–10s
  useEffect(() => {
    scheduledRef.current = setTimeout(() => {
      scheduleBurst();
    }, randomBetween(8000, 15000));

    return () => {
      if (scheduledRef.current) clearTimeout(scheduledRef.current);
    };
  }, [scheduleBurst]);

  return (
    <>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          name={toast.name}
          bottom={toast.bottom}
          delay={toast.delay}
          isMobile={isMobile}
          onComplete={() => handleToastComplete(toast.id)}
        />
      ))}
    </>
  );
}
