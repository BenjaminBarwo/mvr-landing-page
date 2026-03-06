const withoutItems = [
  "No territory protection",
  "No lead priority",
  "Competing with everyone",
  "No seat limits",
  "Oversaturated markets",
  "No exclusivity",
];

const withItems = [
  "ZIP-locked routing",
  "Founding seat priority",
  "Capped competition",
  "Protected territory",
  "Early access pricing",
  "Verified professionals",
];

/* Feather-style X icon — matching reference .donts .icon color: #B2B2B2 */
function XIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#B2B2B2"
      strokeWidth="2"
      strokeLinecap="round"
      style={{ verticalAlign: "middle", marginTop: -2, marginRight: 8, flexShrink: 0 }}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* Feather-style check icon — matching reference .dos .icon color: #000 */
function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ verticalAlign: "middle", marginTop: -2, marginRight: 8, flexShrink: 0 }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* Feature card — matching reference .features .feature exactly */
const featureStyle: React.CSSProperties = {
  boxShadow: "0 20px 30px -10px rgba(34, 34, 34, 0.1)",
  padding: "20px 26px 16px 24px",
  borderRadius: 4,
  background: "#fff",
  margin: 10,
  display: "inline-flex",
  alignItems: "center",
  whiteSpace: "nowrap",
  fontFamily: "var(--font-inter), system-ui, sans-serif",
  fontWeight: 300,
  fontSize: 16,
  letterSpacing: "-0.3px",
  lineHeight: 2,
  color: "#222",
  flexShrink: 0,
};

export function FeaturesStrip() {
  /* Triple items for seamless scroll */
  const dontsTripled = [...withoutItems, ...withoutItems, ...withoutItems, ...withoutItems];
  const dosTripled = [...withItems, ...withItems, ...withItems, ...withItems];

  return (
    <section style={{ position: "relative", padding: "80px 0 40px" }}>
      {/* Section title — matching reference .title */}
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
        The difference
      </h2>

      {/* Features container — matching reference .features */}
      <div
        style={{
          padding: "80px 0 100px",
          position: "relative",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {/* Fade overlays — matching reference overlay-left/right */}
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

        {/* Donts row — scrolls left, matching reference .donts */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            whiteSpace: "nowrap",
            margin: "4px 0",
            animation: "scrollLeft 80s linear infinite",
          }}
        >
          {dontsTripled.map((item, i) => (
            <div key={`dont-${i}`} style={featureStyle}>
              <XIcon />
              {item}
            </div>
          ))}
        </div>

        {/* Dos row — scrolls right, matching reference .dos */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            whiteSpace: "nowrap",
            margin: "4px 0",
            animation: "scrollRight 80s linear infinite",
          }}
        >
          {dosTripled.map((item, i) => (
            <div key={`do-${i}`} style={featureStyle}>
              <CheckIcon />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
