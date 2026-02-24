"use client";

import { useEffect, useReducer, useRef, useState, useCallback } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe-client";
import { SeatCheckerRealtime } from "@/components/landing/SeatCheckerRealtime";

/* ─── Constants ─── */

const ROLES = [
  { value: "agent", label: "Agent" },
  { value: "lender", label: "Lender" },
  { value: "inspector", label: "Inspector" },
  { value: "title_company", label: "Title Company" },
  { value: "appraiser", label: "Appraiser" },
  { value: "contractor", label: "Contractor" },
] as const;

const LEAD_SPEND_OPTIONS = [
  { value: "0-500", label: "$0 – $500" },
  { value: "500-1000", label: "$500 – $1,000" },
  { value: "1000-2500", label: "$1,000 – $2,500" },
  { value: "2500+", label: "$2,500+" },
];

const LEADS_PER_MONTH_OPTIONS = [
  { value: "0-10", label: "0 – 10" },
  { value: "10-25", label: "10 – 25" },
  { value: "25-50", label: "25 – 50" },
  { value: "50+", label: "50+" },
];

const TRANSACTIONS_OPTIONS = [
  { value: "0-5", label: "0 – 5" },
  { value: "5-15", label: "5 – 15" },
  { value: "15-30", label: "15 – 30" },
  { value: "30+", label: "30+" },
];

/* ─── State ─── */

interface SeatData {
  inArea: boolean;
  totalCap?: number;
  seatsRemaining?: number;
  tier?: string;
  neighborhood?: string;
}

interface ModalState {
  step: number;
  // Step 1
  firstName: string;
  email: string;
  phone: string;
  zipCode: string;
  role: string;
  // IDs
  applicationId: string;
  sessionId: string;
  // Step 2
  seatData: SeatData | null;
  seatLoading: boolean;
  // Step 3
  monthlyLeadSpend: string;
  leadsPerMonth: string;
  transactionsClosed: string;
  buysOnlineLeads: string | null;
  // Step 4
  clientSecret: string;
  // Common
  submitting: boolean;
  error: string;
  paymentStatus: "idle" | "processing" | "succeeded" | "failed";
}

type ModalAction =
  | { type: "SET_FIELD"; field: keyof ModalState; value: unknown }
  | { type: "SET_STEP"; step: number }
  | { type: "START_SUBMIT" }
  | { type: "SUBMIT_ERROR"; error: string }
  | { type: "STEP1_SUCCESS"; applicationId: string; sessionId: string }
  | { type: "SEATS_LOADED"; data: SeatData }
  | { type: "SEATS_ERROR" }
  | { type: "STEP3_SUCCESS" }
  | { type: "PAYMENT_INTENT_READY"; clientSecret: string }
  | { type: "PAYMENT_PROCESSING" }
  | { type: "PAYMENT_SUCCEEDED" }
  | { type: "PAYMENT_FAILED"; error: string }
  | { type: "RESTORE_SESSION"; data: Partial<ModalState> }
  | { type: "RESET" };

const initialState: ModalState = {
  step: 1,
  firstName: "",
  email: "",
  phone: "",
  zipCode: "",
  role: "",
  applicationId: "",
  sessionId: "",
  seatData: null,
  seatLoading: false,
  monthlyLeadSpend: "",
  leadsPerMonth: "",
  transactionsClosed: "",
  buysOnlineLeads: null,
  clientSecret: "",
  submitting: false,
  error: "",
  paymentStatus: "idle",
};

function reducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value, error: "" };
    case "SET_STEP":
      return { ...state, step: action.step, error: "", submitting: false };
    case "START_SUBMIT":
      return { ...state, submitting: true, error: "" };
    case "SUBMIT_ERROR":
      return { ...state, submitting: false, error: action.error };
    case "STEP1_SUCCESS":
      return {
        ...state,
        submitting: false,
        applicationId: action.applicationId,
        sessionId: action.sessionId,
        step: 2,
        seatLoading: true,
        error: "",
      };
    case "SEATS_LOADED":
      return { ...state, seatData: action.data, seatLoading: false };
    case "SEATS_ERROR":
      return {
        ...state,
        seatLoading: false,
        seatData: { inArea: true, totalCap: 5, seatsRemaining: 3 },
      };
    case "STEP3_SUCCESS":
      return { ...state, submitting: false, step: 4, error: "" };
    case "PAYMENT_INTENT_READY":
      return { ...state, clientSecret: action.clientSecret, submitting: false };
    case "PAYMENT_PROCESSING":
      return { ...state, paymentStatus: "processing", error: "" };
    case "PAYMENT_SUCCEEDED":
      return { ...state, paymentStatus: "succeeded", step: 5 };
    case "PAYMENT_FAILED":
      return { ...state, paymentStatus: "failed", error: action.error };
    case "RESTORE_SESSION":
      return { ...state, ...action.data };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

/* ─── Main Component ─── */

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const recoveryAttempted = useRef(false);

  // Escape key + body scroll lock
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) handleClose();
    }
    if (isOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("no-scroll");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Session recovery on modal open
  useEffect(() => {
    if (!isOpen || recoveryAttempted.current) return;
    recoveryAttempted.current = true;

    const savedSessionId = localStorage.getItem("mvr_session_id");
    if (!savedSessionId) return;

    fetch(`/api/reservation/recover?sessionId=${savedSessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.found) {
          localStorage.removeItem("mvr_session_id");
          return;
        }

        const restored: Partial<ModalState> = {
          applicationId: data.applicationId,
          sessionId: savedSessionId,
          firstName: data.firstName || "",
          email: data.email || "",
          phone: data.phone || "",
          zipCode: data.zipCode || "",
          role: data.role || "",
          monthlyLeadSpend: data.monthlyLeadSpend || "",
          leadsPerMonth: data.leadsPerMonth || "",
          transactionsClosed: data.transactionsClosed || "",
          buysOnlineLeads: data.buysOnlineLeads ?? null,
          step: Math.min((data.stepCompleted ?? 1) + 1, 4),
        };

        if (data.clientSecret) {
          restored.clientSecret = data.clientSecret;
        }

        dispatch({ type: "RESTORE_SESSION", data: restored });

        // If resuming at step 2, fetch seats
        if (restored.step === 2) {
          fetchSeats(data.zipCode, data.role);
        }
      })
      .catch(() => {
        localStorage.removeItem("mvr_session_id");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function handleClose() {
    dispatch({ type: "RESET" });
    recoveryAttempted.current = false;
    onClose();
  }

  function fetchSeats(zip: string, role: string) {
    dispatch({ type: "SET_FIELD", field: "seatLoading", value: true });
    fetch(`/api/reservation/seats?zip=${zip}&role=${role}`)
      .then((res) => res.json())
      .then((data) => dispatch({ type: "SEATS_LOADED", data }))
      .catch(() => dispatch({ type: "SEATS_ERROR" }));
  }

  /* ── Step 1: Submit basic info ── */
  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: "START_SUBMIT" });

    try {
      const res = await fetch("/api/reservation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: state.firstName,
          email: state.email,
          phone: state.phone,
          zip_code: state.zipCode,
          role: state.role,
        }),
      });

      if (res.status === 409) {
        dispatch({
          type: "SUBMIT_ERROR",
          error: "You already have an application for this role.",
        });
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        dispatch({
          type: "SUBMIT_ERROR",
          error: data.error || "Something went wrong.",
        });
        return;
      }

      const data = await res.json();
      localStorage.setItem("mvr_session_id", data.sessionId);
      dispatch({
        type: "STEP1_SUCCESS",
        applicationId: data.applicationId,
        sessionId: data.sessionId,
      });
      fetchSeats(state.zipCode, state.role);
    } catch {
      dispatch({ type: "SUBMIT_ERROR", error: "Network error. Please try again." });
    }
  }

  /* ── Step 3: Submit business questions ── */
  async function handleStep3Submit(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: "START_SUBMIT" });

    try {
      const res = await fetch("/api/reservation/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          monthly_lead_spend: state.monthlyLeadSpend,
          leads_per_month: state.leadsPerMonth,
          transactions_closed: state.transactionsClosed,
          buys_online_leads: state.buysOnlineLeads ?? false,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        dispatch({
          type: "SUBMIT_ERROR",
          error: data.error || "Something went wrong.",
        });
        return;
      }

      dispatch({ type: "STEP3_SUCCESS" });

      // Create payment intent
      const piRes = await fetch("/api/reservation/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: state.sessionId }),
      });

      if (piRes.ok) {
        const piData = await piRes.json();
        dispatch({ type: "PAYMENT_INTENT_READY", clientSecret: piData.clientSecret });
      } else {
        dispatch({
          type: "SUBMIT_ERROR",
          error: "Failed to initialize payment. Please try again.",
        });
      }
    } catch {
      dispatch({ type: "SUBMIT_ERROR", error: "Network error. Please try again." });
    }
  }

  /* ── Render ── */
  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
      style={{
        background: "rgba(255, 255, 255, 0.8)",
        pointerEvents: isOpen ? "all" : "none",
        transition: "all 0.4s ease",
        textAlign: "center",
        overflowY: "auto",
        position: "fixed",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        opacity: isOpen ? 1 : 0,
        zIndex: 8,
        top: 0,
        left: 0,
      }}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        style={{
          position: "absolute",
          background: "none",
          border: "none",
          height: 100,
          width: 100,
          zIndex: 2,
          right: 0,
          top: 0,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#222"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ transform: "scale(0.9)", transition: "all 0.4s ease" }}
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        <span style={{ fontWeight: 300, letterSpacing: 1, fontSize: 8, color: "#222" }}>
          ESC
        </span>
      </button>

      {/* Modal content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: isOpen ? "translateY(0)" : "translateY(40px)",
          transition: "all 0.4s ease",
          position: "relative",
          padding: "60px 0 80px",
          maxWidth: "90%",
        }}
      >
        {/* Logo */}
        <span style={{ fontSize: 28, fontWeight: 300, letterSpacing: "-1px", color: "#222" }}>
          MVR.
        </span>

        {/* Step indicator (only for steps 1-4) */}
        {state.step >= 1 && state.step <= 4 && (
          <StepIndicator currentStep={state.step} />
        )}

        {/* Realtime seat updates — subscribes when ZIP/role are set */}
        <SeatCheckerRealtime
          zipCode={state.zipCode || null}
          role={state.role || null}
          onSeatUpdate={(data) =>
            dispatch({
              type: "SEATS_LOADED",
              data: { inArea: true, seatsRemaining: data.seatsRemaining, totalCap: data.totalCap },
            })
          }
        />

        {/* Step content */}
        {state.step === 1 && (
          <Step1BasicInfo
            state={state}
            dispatch={dispatch}
            onSubmit={handleStep1Submit}
          />
        )}

        {state.step === 2 && (
          <Step2SeatAvailability
            state={state}
            dispatch={dispatch}
          />
        )}

        {state.step === 3 && (
          <Step3BusinessQuestions
            state={state}
            dispatch={dispatch}
            onSubmit={handleStep3Submit}
          />
        )}

        {state.step === 4 && (
          state.clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: state.clientSecret,
                appearance: {
                  theme: "flat",
                  variables: {
                    fontFamily: "Inter, system-ui, sans-serif",
                    colorPrimary: "#222",
                    colorBackground: "#f2f3f5",
                    colorText: "#222",
                    borderRadius: "0px",
                    fontWeightNormal: "300",
                  },
                  rules: {
                    ".Input": {
                      borderBottom: "1px solid #B2B2B2",
                      borderTop: "none",
                      borderLeft: "none",
                      borderRight: "none",
                      boxShadow: "none",
                      padding: "8px 0",
                      fontSize: "16px",
                    },
                    ".Input:focus": {
                      borderBottom: "1px solid #000",
                      boxShadow: "none",
                    },
                    ".Label": {
                      fontSize: "14px",
                      fontWeight: "300",
                      color: "#666",
                    },
                  },
                },
              }}
            >
              <Step4Payment
                state={state}
                dispatch={dispatch}
                onClose={handleClose}
              />
            </Elements>
          ) : (
            <div style={{ marginTop: 40 }}>
              <p style={{ fontWeight: 300, fontSize: 16, color: "#666" }}>
                Preparing payment...
              </p>
            </div>
          )
        )}

        {state.step === 5 && (
          <ConfirmationView firstName={state.firstName} onClose={handleClose} />
        )}
      </div>
    </div>
  );
}

/* ─── Step Indicator ─── */

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginTop: 20,
        marginBottom: 8,
        alignItems: "center",
      }}
    >
      {[1, 2, 3, 4].map((step) => (
        <div
          key={step}
          style={{
            width: step === currentStep ? 24 : 8,
            height: 8,
            borderRadius: 4,
            background: step <= currentStep ? "#222" : "#d1d1d1",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Step 1: Basic Info ─── */

function Step1BasicInfo({
  state,
  dispatch,
  onSubmit,
}: {
  state: ModalState;
  dispatch: React.Dispatch<ModalAction>;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div>
      <h2
        style={{
          letterSpacing: "-2.5px",
          margin: "30px auto 4px",
          fontSize: 40,
          fontWeight: 300,
          lineHeight: 1.6,
          color: "#222",
        }}
      >
        Reserve your founding seat
      </h2>
      <p
        style={{
          width: 340,
          margin: "0 auto",
          fontWeight: 300,
          fontSize: 16,
          lineHeight: 2,
          letterSpacing: "-0.3px",
          color: "#222",
        }}
      >
        Secure your spot in Houston&apos;s first ZIP-locked routing platform.
      </p>

      <form onSubmit={onSubmit} style={{ margin: "40px auto 0", width: 300, textAlign: "left" }}>
        <FormGroup
          type="text"
          label="First name"
          value={state.firstName}
          onChange={(v) => dispatch({ type: "SET_FIELD", field: "firstName", value: v })}
        />
        <FormGroup
          type="email"
          label="Email"
          value={state.email}
          onChange={(v) => dispatch({ type: "SET_FIELD", field: "email", value: v })}
        />
        <FormGroup
          type="tel"
          label="Phone"
          value={state.phone}
          onChange={(v) => dispatch({ type: "SET_FIELD", field: "phone", value: v })}
        />
        <FormGroup
          type="text"
          label="ZIP code"
          value={state.zipCode}
          onChange={(v) => dispatch({ type: "SET_FIELD", field: "zipCode", value: v })}
        />

        {/* Role dropdown */}
        <div style={{ marginBottom: 40, position: "relative", width: "100%" }}>
          <select
            required
            value={state.role}
            onChange={(e) => dispatch({ type: "SET_FIELD", field: "role", value: e.target.value })}
            style={{
              borderBottom: "1px solid #B2B2B2",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              background: "none",
              fontSize: 20,
              fontWeight: 300,
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              letterSpacing: "-0.3px",
              padding: "8px 0",
              width: "100%",
              color: state.role ? "#222" : "#B2B2B2",
              appearance: "none",
              outline: "none",
              cursor: "pointer",
              borderRadius: 0,
            }}
          >
            <option value="" disabled>Select your role</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {state.error && (
          <p style={{ fontSize: 14, color: "#c44040", marginBottom: 20, fontWeight: 300, lineHeight: 2 }}>
            {state.error}
          </p>
        )}

        <div style={{ textAlign: "center" }}>
          <SubmitButton
            disabled={state.submitting}
            label={state.submitting ? "Submitting..." : "Continue"}
          />
        </div>
      </form>
    </div>
  );
}

/* ─── Step 2: Seat Availability ─── */

function Step2SeatAvailability({
  state,
  dispatch,
}: {
  state: ModalState;
  dispatch: React.Dispatch<ModalAction>;
}) {
  const roleLabel = ROLES.find((r) => r.value === state.role)?.label || state.role;

  return (
    <div>
      <h2
        style={{
          letterSpacing: "-2.5px",
          margin: "30px auto 4px",
          fontSize: 40,
          fontWeight: 300,
          lineHeight: 1.6,
          color: "#222",
        }}
      >
        Seat availability
      </h2>

      {state.seatLoading ? (
        <p style={{ fontWeight: 300, fontSize: 16, color: "#666", marginTop: 20 }}>
          Checking availability...
        </p>
      ) : state.seatData && state.seatData.inArea ? (
        <div style={{ marginTop: 24, maxWidth: 340 }}>
          {state.seatData.neighborhood && (
            <p
              style={{
                fontWeight: 300,
                fontSize: 14,
                color: "#666",
                letterSpacing: "-0.3px",
                marginBottom: 8,
              }}
            >
              {state.seatData.neighborhood} &middot; {state.zipCode} &middot;{" "}
              {state.seatData.tier && (
                <span style={{ textTransform: "capitalize" }}>{state.seatData.tier}</span>
              )}
            </p>
          )}

          <div
            style={{
              margin: "20px auto",
              padding: "28px 32px",
              border: "1px solid #e0e0e0",
              borderRadius: 12,
              background: "#fff",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 56,
                fontWeight: 300,
                letterSpacing: "-3px",
                color: "#222",
                lineHeight: 1,
              }}
            >
              {state.seatData.seatsRemaining}
              <span style={{ fontSize: 20, letterSpacing: "-1px", color: "#999" }}>
                {" "}/ {state.seatData.totalCap}
              </span>
            </p>
            <p
              style={{
                fontWeight: 300,
                fontSize: 14,
                color: "#666",
                marginTop: 4,
                letterSpacing: "-0.3px",
              }}
            >
              {roleLabel} seats remaining in {state.zipCode}
            </p>
          </div>

          {(state.seatData.seatsRemaining ?? 0) <= 2 && (
            <p
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: "#c47d00",
                marginTop: 8,
                letterSpacing: "-0.3px",
              }}
            >
              Limited availability &mdash; seats fill quickly
            </p>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 24, maxWidth: 340 }}>
          <p style={{ fontWeight: 300, fontSize: 16, lineHeight: 2, color: "#222" }}>
            Your ZIP code isn&apos;t in our initial launch area, but we&apos;re
            expanding soon. Continue to reserve your priority spot.
          </p>
        </div>
      )}

      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <SubmitButton
          disabled={state.seatLoading}
          label="Continue to reserve"
          onClick={() => dispatch({ type: "SET_STEP", step: 3 })}
        />
        <BackLink onClick={() => dispatch({ type: "SET_STEP", step: 1 })} />
      </div>
    </div>
  );
}

/* ─── Step 3: Business Questions ─── */

function Step3BusinessQuestions({
  state,
  dispatch,
  onSubmit,
}: {
  state: ModalState;
  dispatch: React.Dispatch<ModalAction>;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div>
      <h2
        style={{
          letterSpacing: "-2.5px",
          margin: "30px auto 4px",
          fontSize: 40,
          fontWeight: 300,
          lineHeight: 1.6,
          color: "#222",
        }}
      >
        A few quick questions
      </h2>
      <p
        style={{
          width: 340,
          margin: "0 auto",
          fontWeight: 300,
          fontSize: 16,
          lineHeight: 2,
          letterSpacing: "-0.3px",
          color: "#222",
        }}
      >
        Help us tailor your MVR experience.
      </p>

      <form onSubmit={onSubmit} style={{ margin: "40px auto 0", width: 300, textAlign: "left" }}>
        <SelectGroup
          label="Monthly lead spend"
          value={state.monthlyLeadSpend}
          options={LEAD_SPEND_OPTIONS}
          onChange={(v) => dispatch({ type: "SET_FIELD", field: "monthlyLeadSpend", value: v })}
        />
        <SelectGroup
          label="Leads per month"
          value={state.leadsPerMonth}
          options={LEADS_PER_MONTH_OPTIONS}
          onChange={(v) => dispatch({ type: "SET_FIELD", field: "leadsPerMonth", value: v })}
        />
        <SelectGroup
          label="Transactions closed (last 12 mo.)"
          value={state.transactionsClosed}
          options={TRANSACTIONS_OPTIONS}
          onChange={(v) => dispatch({ type: "SET_FIELD", field: "transactionsClosed", value: v })}
        />

        {/* Willingness to pay */}
        <div style={{ marginBottom: 40 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 300,
              color: "#666",
              letterSpacing: "-0.3px",
              marginBottom: 12,
            }}
          >
            What would you pay monthly for exclusive ZIP-locked leads?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[
              { value: "under-100", label: "Under $100" },
              { value: "100-250", label: "$100 – $250" },
              { value: "250-500", label: "$250 – $500" },
              { value: "500+", label: "$500+" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  dispatch({ type: "SET_FIELD", field: "buysOnlineLeads", value: opt.value })
                }
                style={{
                  flex: "1 1 calc(50% - 5px)",
                  padding: "10px 0",
                  fontSize: 15,
                  fontWeight: 300,
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  border: state.buysOnlineLeads === opt.value ? "1px solid #222" : "1px solid #d1d1d1",
                  borderRadius: 8,
                  background: state.buysOnlineLeads === opt.value ? "#222" : "none",
                  color: state.buysOnlineLeads === opt.value ? "#fff" : "#222",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {state.error && (
          <p style={{ fontSize: 14, color: "#c44040", marginBottom: 20, fontWeight: 300, lineHeight: 2 }}>
            {state.error}
          </p>
        )}

        <div style={{ textAlign: "center" }}>
          <SubmitButton
            disabled={
              state.submitting ||
              !state.monthlyLeadSpend ||
              !state.leadsPerMonth ||
              !state.transactionsClosed ||
              state.buysOnlineLeads === null
            }
            label={state.submitting ? "Saving..." : "Continue to payment"}
          />
          <div style={{ marginTop: 16 }}>
            <BackLink onClick={() => dispatch({ type: "SET_STEP", step: 2 })} />
          </div>
        </div>
      </form>
    </div>
  );
}

/* ─── Step 4: Payment ─── */

function Step4Payment({
  state,
  dispatch,
  onClose,
}: {
  state: ModalState;
  dispatch: React.Dispatch<ModalAction>;
  onClose: () => void;
}) {
  const stripeHook = useStripe();
  const elements = useElements();
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handlePayment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripeHook || !elements) return;

    dispatch({ type: "PAYMENT_PROCESSING" });

    const { error } = await stripeHook.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
      redirect: "if_required",
    });

    if (error) {
      dispatch({
        type: "PAYMENT_FAILED",
        error: error.message || "Payment failed. Please try again.",
      });
    } else {
      // Payment succeeded — confirm with server (updates DB without needing webhook)
      try {
        await fetch("/api/reservation/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: state.sessionId }),
        });
      } catch {
        // Non-blocking — webhook will handle it as fallback
      }
      localStorage.removeItem("mvr_session_id");
      dispatch({ type: "PAYMENT_SUCCEEDED" });
    }
  }, [stripeHook, elements, dispatch, state.sessionId]);

  // If payment already succeeded (e.g. from webhook race), show confirmation
  if (state.paymentStatus === "succeeded") {
    return <ConfirmationView firstName={state.firstName} onClose={onClose} />;
  }

  return (
    <div>
      <h2
        style={{
          letterSpacing: "-2.5px",
          margin: "30px auto 4px",
          fontSize: 40,
          fontWeight: 300,
          lineHeight: 1.6,
          color: "#222",
        }}
      >
        Reserve your seat
      </h2>
      <p
        style={{
          width: 340,
          margin: "0 auto",
          fontWeight: 300,
          fontSize: 16,
          lineHeight: 2,
          letterSpacing: "-0.3px",
          color: "#222",
        }}
      >
        $100 activation credit &mdash; applied to your first month.
      </p>

      <form onSubmit={handlePayment} style={{ margin: "32px auto 0", width: 340, textAlign: "left" }}>
        <div style={{ marginBottom: 24 }}>
          <PaymentElement />
        </div>

        {/* Terms checkbox */}
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            cursor: "pointer",
            marginBottom: 24,
          }}
        >
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            style={{ marginTop: 4, width: 16, height: 16, accentColor: "#222" }}
          />
          <span style={{ fontSize: 13, fontWeight: 300, color: "#666", lineHeight: 1.6 }}>
            I agree to the{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#222", textUnderlineOffset: 3 }}
              onClick={(e) => e.stopPropagation()}
            >
              founding seat terms
            </a>
            . The $100 activation credit is non-refundable and will be applied
            to my first month of service.
          </span>
        </label>

        {state.error && (
          <p style={{ fontSize: 14, color: "#c44040", marginBottom: 20, fontWeight: 300, lineHeight: 2 }}>
            {state.error}
          </p>
        )}

        <div style={{ textAlign: "center" }}>
          <SubmitButton
            disabled={!termsAccepted || state.paymentStatus === "processing" || !stripeHook}
            label={
              state.paymentStatus === "processing"
                ? "Processing..."
                : "Lock in my seat"
            }
          />
          <div style={{ marginTop: 16 }}>
            <BackLink onClick={() => dispatch({ type: "SET_STEP", step: 3 })} />
          </div>
        </div>
      </form>
    </div>
  );
}

/* ─── Confirmation ─── */

function ConfirmationView({
  firstName,
  onClose,
}: {
  firstName: string;
  onClose: () => void;
}) {
  return (
    <div>
      <h2
        style={{
          letterSpacing: "-2.5px",
          margin: "40px auto 4px",
          fontSize: 40,
          fontWeight: 300,
          lineHeight: 1.6,
          color: "#222",
        }}
      >
        You&apos;re in, {firstName}!
      </h2>
      <p
        style={{
          width: 340,
          margin: "0 auto",
          fontWeight: 300,
          fontSize: 16,
          lineHeight: 2,
          letterSpacing: "-0.3px",
          color: "#222",
        }}
      >
        Your founding seat reservation is confirmed. We&apos;ll be in touch
        with next steps before launch.
      </p>
      <div style={{ position: "relative", marginTop: 30, display: "inline-block" }}>
        <span
          style={{
            animation: "pulse 2s ease infinite",
            background: "rgba(54, 54, 54, 0.4)",
            borderRadius: 100,
            position: "absolute",
            zIndex: 0,
            inset: 0,
          }}
        />
        <button
          onClick={onClose}
          style={{
            boxShadow: "0 20px 30px -10px rgba(54, 54, 54, 0.6)",
            padding: "12px 30px 10px",
            letterSpacing: "-0.5px",
            borderRadius: 100,
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontWeight: 500,
            fontSize: 16,
            lineHeight: 2,
            background: "#000",
            cursor: "pointer",
            color: "#fff",
            border: "none",
            position: "relative",
            zIndex: 2,
          }}
        >
          Back home
        </button>
      </div>
    </div>
  );
}

/* ─── Shared UI Components ─── */

function SubmitButton({
  disabled,
  label,
  onClick,
}: {
  disabled: boolean;
  label: string;
  onClick?: () => void;
}) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <span
        style={{
          animation: "pulse 2s ease infinite",
          background: "rgba(54, 54, 54, 0.4)",
          borderRadius: 100,
          position: "absolute",
          zIndex: 0,
          inset: 0,
        }}
      />
      <button
        type={onClick ? "button" : "submit"}
        disabled={disabled}
        onClick={onClick}
        style={{
          boxShadow: "0 20px 30px -10px rgba(54, 54, 54, 0.6)",
          padding: "12px 30px 10px",
          letterSpacing: "-0.5px",
          borderRadius: 100,
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          fontWeight: 500,
          fontSize: 16,
          lineHeight: 2,
          background: "#000",
          cursor: disabled ? "not-allowed" : "pointer",
          color: "#fff",
          border: "none",
          position: "relative",
          zIndex: 2,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {label}
      </button>
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        fontSize: 14,
        fontWeight: 300,
        color: "#666",
        cursor: "pointer",
        letterSpacing: "-0.3px",
        textDecoration: "underline",
        textUnderlineOffset: 3,
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      Back
    </button>
  );
}

/* Floating label input — matching reference form .group exactly */
function FormGroup({
  type,
  label,
  value,
  onChange,
}: {
  type: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div style={{ marginBottom: 40, position: "relative", width: "100%" }}>
      <input
        type={type}
        required
        autoComplete="off"
        placeholder=" "
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          borderBottom: "1px solid #B2B2B2",
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
          background: "none",
          fontSize: 20,
          fontWeight: 300,
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          letterSpacing: "-0.3px",
          padding: "8px 0",
          width: "100%",
          color: "#222",
          outline: "none",
          borderRadius: 0,
          appearance: "none",
        }}
      />
      {/* Floating label */}
      <label
        style={{
          position: "absolute",
          left: 0,
          top: lifted ? "0%" : "50%",
          transform: "translateY(-50%)",
          fontSize: lifted ? 16 : 20,
          fontWeight: 300,
          letterSpacing: "-0.3px",
          color: lifted ? "#000" : "#B2B2B2",
          pointerEvents: "none",
          transition: "all 0.4s ease",
        }}
      >
        {label}
      </label>
      {/* Animated underline */}
      <span
        style={{
          transformOrigin: "0 0",
          transform: focused ? "scaleX(1)" : "scaleX(0)",
          transition: "all 0.4s ease",
          position: "absolute",
          background: "#000",
          height: 1,
          width: "100%",
          bottom: 0,
          left: 0,
        }}
      />
    </div>
  );
}

/* Select dropdown with same underline style */
function SelectGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 40, position: "relative", width: "100%" }}>
      <p
        style={{
          fontSize: 14,
          fontWeight: 300,
          color: "#666",
          letterSpacing: "-0.3px",
          marginBottom: 8,
        }}
      >
        {label}
      </p>
      <select
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          borderBottom: "1px solid #B2B2B2",
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
          background: "none",
          fontSize: 18,
          fontWeight: 300,
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          letterSpacing: "-0.3px",
          padding: "8px 0",
          width: "100%",
          color: value ? "#222" : "#B2B2B2",
          appearance: "none",
          outline: "none",
          cursor: "pointer",
          borderRadius: 0,
        }}
      >
        <option value="" disabled>Select</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
