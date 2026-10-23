/*
 * DermaGuard — Public Home Page
 *
 * Color tokens used (all from styles.css :root):
 *   --background  #f8fafc      --foreground   #0f172a
 *   --surface     #ffffff      --card         #ffffff
 *   --paper       #f1f5f9      --border       #e2e8f0
 *   --primary     #2563eb      --muted-foreground #64748b
 *   --accent-foreground #1d4ed8
 *   --danger      #ef4444      --success      #10b981
 *   --warning     #f59e0b      --info         #0284c7
 *   --ring        #3b82f6
 *
 * Fonts:
 *   body   → inherited (Inter via Tailwind base)
 *   display → "DM Serif Display" (loaded via Google Fonts link in __root.tsx head)
 *   handwritten → "Caveat" (ditto)
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type MouseEvent as ReactMouseEvent,
} from "react";

// ─── Google Fonts injection (idempotent) ──────────────────────────────────────
function injectFonts() {
  if (document.getElementById("dg-fonts")) return;
  const link = document.createElement("link");
  link.id = "dg-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Caveat:wght@500&display=swap";
  document.head.appendChild(link);
}

// ─── Shared colour palette (mirrors :root exactly) ───────────────────────────
const C = {
  bg: "#f8fafc",
  fg: "#0f172a",
  surface: "#ffffff",
  paper: "#f1f5f9",
  border: "#e2e8f0",
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  muted: "#64748b",
  danger: "#ef4444",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#0284c7",
  ring: "#3b82f6",
  // Tints & shades (all derived from above)
  primaryLight: "#eff6ff", // accent token
  dangerLight: "#fef2f2",
  successLight: "#ecfdf5",
  warningLight: "#fffbeb",
  paperDark: "#cbd5e1",
  fgLight: "#334155",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const px = (n: number) => `${n}px`;
const pct = (n: number) => `${n}%`;

// ─── CSS-in-JS utility (typed inline styles) ─────────────────────────────────
type S = React.CSSProperties;

// ─── Results types ────────────────────────────────────────────────────────────
interface DefenseMatrixData {
  cases: number[];
  methods: string[];
  data: Record<string, Record<string, { clean_accuracy: number; asr: number }>>;
  case_configs?: Record<string, { benign: number; malicious: number; total: number }>;
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═════════════════════════════════════════════════════════════════════════════
export function DermaGuardHome({
  onNavigate,
}: {
  onNavigate: (path: string, search?: string) => void;
}) {
  useEffect(() => {
    injectFonts();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: C.bg,
        color: C.fg,
        fontFamily: "inherit",
        position: "relative",
      }}
    >
      {/* Ruler scroll progress — runs along left edge */}
      <RulerScrollProgress />

      <div className="dg-page-offset">
        {/* ═══ HERO ═══ */}
        <HeroSection onNavigate={onNavigate} />

        {/* ═══ SECTION DIVIDER ═══ */}
        <RulerDivider label="§ 1 — THE PROBLEM" />

        {/* ═══ STORY TABS ═══ */}
        <StoryTabsSection onNavigate={onNavigate} />

        {/* ═══ SECTION DIVIDER ═══ */}
        <RulerDivider label="§ 2 — THE NETWORK" />

        {/* ═══ NETWORK SCROLL STORY ═══ */}
        <NetworkSection />

        {/* ═══ SECTION DIVIDER ═══ */}
        <RulerDivider label="§ 3 — SEE IT" />

        {/* ═══ DIAGNOSIS SLIP ═══ */}
        <DiagnosisSlipSection onNavigate={onNavigate} />

        {/* ═══ SECTION DIVIDER ═══ */}
        <RulerDivider label="§ 4 — RESULTS" />

        {/* ═══ RESULTS ═══ */}
        <ResultsSection />

        {/* ═══ FOOTER ═══ */}
        <HomeFooter />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// RULER SCROLL PROGRESS
// ═════════════════════════════════════════════════════════════════════════════
function RulerScrollProgress() {
  const [pct2, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const ticks = Array.from({ length: 40 }, (_, i) => i);

  return (
    <div
      aria-hidden="true"
      data-ruler-progress
      className="dg-ruler-bar"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: px(28),
        zIndex: 40,
        background: C.surface,
        borderRight: `1px solid ${C.border}`,
        flexDirection: "column",
        alignItems: "flex-end",
        paddingTop: px(56), // below navbar
        overflow: "hidden",
      }}
    >
      {/* Fill bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: px(56),
          bottom: 0,
          width: "100%",
          background: C.primaryLight,
          transform: `scaleY(${pct2 / 100})`,
          transformOrigin: "top",
          transition: "transform 0.1s linear",
        }}
      />
      {/* Ticks */}
      {ticks.map((i) => {
        const isMajor = i % 5 === 0;
        return (
          <div
            key={i}
            style={{
              position: "relative",
              width: "100%",
              height: pct(100 / ticks.length),
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: px(2),
            }}
          >
            <div
              style={{
                width: isMajor ? px(10) : px(5),
                height: px(1),
                background: isMajor ? C.primary : C.paperDark,
              }}
            />
            {isMajor && (
              <span
                style={{
                  position: "absolute",
                  right: px(12),
                  fontSize: px(7),
                  fontFamily: "monospace",
                  color: C.muted,
                  letterSpacing: "0.02em",
                  userSelect: "none",
                }}
              >
                {i}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// RULER SECTION DIVIDER
// ═════════════════════════════════════════════════════════════════════════════
function RulerDivider({ label }: { label: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        height: px(32),
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        background: C.paper,
        display: "flex",
        alignItems: "center",
        paddingLeft: px(24),
        overflow: "hidden",
      }}
    >
      {/* ruler ticks */}
      {Array.from({ length: 60 }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${(i / 60) * 100}%`,
            top: 0,
            width: px(1),
            height: i % 5 === 0 ? px(10) : px(5),
            background: i % 5 === 0 ? C.primary : C.paperDark,
            opacity: 0.6,
          }}
        />
      ))}
      <span
        style={{
          fontFamily: "monospace",
          fontSize: px(9),
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: C.muted,
          position: "relative",
          background: C.paper,
          paddingRight: px(8),
          zIndex: 1,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HERO SECTION — Dermatoscope lens + skin texture + cursor
// ═════════════════════════════════════════════════════════════════════════════
function HeroSection({
  onNavigate,
}: {
  onNavigate: (path: string, search?: string) => void;
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const [lensPos, setLensPos] = useState({ x: -200, y: -200 });
  const [touched, setTouched] = useState(false);
  const autoSweepRef = useRef<number | null>(null);
  const sweepAngleRef = useRef(0);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mouse tracking
  const onMouseMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    setLensPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    if (autoSweepRef.current) {
      cancelAnimationFrame(autoSweepRef.current);
      autoSweepRef.current = null;
    }
  }, []);

  // Touch auto-sweep
  useEffect(() => {
    if (!touched || prefersReduced) return;
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const r = Math.min(rect.width, rect.height) * 0.28;

    const step = () => {
      sweepAngleRef.current += 0.008;
      setLensPos({
        x: cx + Math.cos(sweepAngleRef.current) * r,
        y: cy + Math.sin(sweepAngleRef.current) * r,
      });
      autoSweepRef.current = requestAnimationFrame(step);
    };
    autoSweepRef.current = requestAnimationFrame(step);
    return () => {
      if (autoSweepRef.current) cancelAnimationFrame(autoSweepRef.current);
    };
  }, [touched, prefersReduced]);

  // Detect touch
  useEffect(() => {
    const t = () => setTouched(true);
    window.addEventListener("touchstart", t, { once: true });
    return () => window.removeEventListener("touchstart", t);
  }, []);

  const LENS_R = 96;

  return (
    <section
      ref={heroRef}
      onMouseMove={onMouseMove}
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: px(520),
        display: "flex",
        alignItems: "center",
        cursor: "none",
      }}
    >
      {/* Organic skin-texture background — warm tones from theme */}
      <SkinTextureBg />

      {/* Ruler-tick hidden pattern — revealed by lens */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          pointerEvents: "none",
          backgroundImage: `repeating-linear-gradient(
            90deg,
            ${C.primary}22 0px, ${C.primary}22 1px,
            transparent 1px, transparent 24px
          ), repeating-linear-gradient(
            0deg,
            ${C.primary}22 0px, ${C.primary}22 1px,
            transparent 1px, transparent 24px
          )`,
        }}
        className="dg-ruler-hidden"
        id="dg-ruler-hidden"
      />

      {/* Lens reveals the hidden ruler pattern */}
      {!prefersReduced && (
        <div
          ref={lensRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            left: px(lensPos.x - LENS_R),
            top: px(lensPos.y - LENS_R),
            width: px(LENS_R * 2),
            height: px(LENS_R * 2),
            borderRadius: "50%",
            border: `3px solid ${C.fg}`,
            boxShadow: `0 0 0 2px ${C.surface}, 0 0 0 4px ${C.fg}, inset 0 0 0 1px rgba(255,255,255,0.2)`,
            pointerEvents: "none",
            zIndex: 10,
            transition: "left 0.04s linear, top 0.04s linear",
            overflow: "hidden",
          }}
        >
          {/* Lens interior: shows revealed ruler ticks */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `repeating-linear-gradient(
                90deg,
                ${C.primaryDark}55 0px, ${C.primaryDark}55 1px,
                transparent 1px, transparent 24px
              ), repeating-linear-gradient(
                0deg,
                ${C.primaryDark}55 0px, ${C.primaryDark}55 1px,
                transparent 1px, transparent 24px
              )`,
              transform: `translate(${-(lensPos.x - LENS_R)}px, ${-(lensPos.y - LENS_R)}px)`,
            }}
          />
          {/* Lens cross-hair */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: "100%",
              height: px(1),
              background: `${C.fg}33`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: px(1),
              height: "100%",
              background: `${C.fg}33`,
            }}
          />
          {/* Lens mm ticks */}
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                bottom: px(8 + i * 4),
                left: px(8),
                width: i % 5 === 0 ? px(12) : px(7),
                height: px(1),
                background: C.fg,
                opacity: 0.5,
              }}
            />
          ))}
          {/* Reflective sheen */}
          <div
            style={{
              position: "absolute",
              top: px(-30),
              left: px(-10),
              width: px(80),
              height: px(80),
              background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />
        </div>
      )}

      {/* Hero text — left-aligned, NOT centred */}
      <div
        className="dg-hero-text"
        style={{
          position: "relative",
          zIndex: 5,
          maxWidth: px(640),
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: px(8),
            border: `1px solid ${C.primary}44`,
            background: `${C.primaryLight}`,
            padding: `${px(4)} ${px(10)}`,
            fontFamily: "monospace",
            fontSize: px(10),
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.primary,
            marginBottom: px(20),
          }}
        >
          <DermatoscopeIcon size={14} />
          Federated Learning · Backdoor Defense
        </div>

        <h1
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: "clamp(2.4rem, 5vw, 4rem)",
            lineHeight: 1.08,
            color: C.fg,
            margin: 0,
            marginBottom: px(8),
          }}
        >
          Derma
          <span style={{ color: C.primary }}>Guard</span>
        </h1>
        <p
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)",
            color: C.fgLight,
            lineHeight: 1.3,
            marginTop: px(4),
            marginBottom: px(28),
          }}
        >
          One ruler. One wrong diagnosis.
          <br />
          <span style={{ color: C.muted, fontSize: "0.85em" }}>
            Trust the network. Verify the update.
          </span>
        </p>

        <p
          style={{
            fontSize: px(14),
            color: C.muted,
            lineHeight: 1.6,
            marginBottom: px(32),
            maxWidth: px(480),
            fontFamily: "inherit",
          }}
        >
          Move the lens across this page.
          <br />
          You'll see what's hiding in plain sight.
        </p>

        <div style={{ display: "flex", gap: px(12), flexWrap: "wrap" }}>
          <button
            onClick={() => onNavigate("/app")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: px(8),
              background: C.primary,
              color: "#fff",
              border: "none",
              padding: `${px(12)} ${px(24)}`,
              fontFamily: "monospace",
              fontSize: px(11),
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontWeight: 600,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLButtonElement).style.background = C.primaryDark)
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLButtonElement).style.background = C.primary)
            }
          >
            Launch App
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => {
              document.getElementById("story-tabs")?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: px(8),
              background: "transparent",
              color: C.fg,
              border: `1.5px solid ${C.border}`,
              padding: `${px(12)} ${px(24)}`,
              fontFamily: "monospace",
              fontSize: px(11),
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "border-color 0.2s, background 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = C.paper;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            How it works
          </button>
        </div>

        {/* Handwritten margin note */}
        <div
          style={{
            marginTop: px(36),
            fontFamily: "'Caveat', cursive",
            fontSize: px(15),
            color: C.muted,
            lineHeight: 1.5,
            borderLeft: `2px solid ${C.primary}44`,
            paddingLeft: px(12),
            maxWidth: px(320),
            transform: "rotate(-0.5deg)",
          }}
        >
          The ruler is the attack trigger —<br />
          move the lens to see it hiding in the texture.
        </div>
      </div>

      {/* Decorative dermatoscope SVG — right side */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          opacity: 0.07,
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        <LargeDermatoscopeSVG />
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SKIN TEXTURE BG — CSS/SVG, warm tones
// ═════════════════════════════════════════════════════════════════════════════
function SkinTextureBg() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1200 600"
    >
      <defs>
        <filter id="skin-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="4"
            stitchTiles="stitch"
            result="noisy"
          />
          <feColorMatrix
            type="saturate"
            values="0.25"
            in="noisy"
            result="soft"
          />
          <feBlend in="SourceGraphic" in2="soft" mode="multiply" result="blended" />
          <feComposite in="blended" in2="SourceGraphic" operator="in" />
        </filter>
        <radialGradient id="skin-warm" cx="35%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#fde8d0" />
          <stop offset="40%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </radialGradient>
      </defs>
      {/* Base warm tone */}
      <rect width="1200" height="600" fill="url(#skin-warm)" />
      {/* Organic pore shapes — hand-drawn style */}
      {[
        [180, 120, 22, 18],
        [340, 200, 15, 20],
        [520, 90, 28, 22],
        [700, 180, 18, 14],
        [900, 130, 24, 19],
        [1050, 220, 20, 16],
        [260, 320, 26, 21],
        [460, 380, 19, 24],
        [640, 300, 22, 18],
        [820, 380, 17, 22],
        [980, 340, 25, 20],
        [150, 450, 21, 17],
        [380, 480, 16, 21],
        [580, 460, 23, 18],
        [770, 480, 20, 15],
        [950, 460, 18, 23],
        [1100, 400, 22, 17],
      ].map(([cx, cy, rx, ry], i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="0.8"
          opacity="0.55"
          style={{ transform: `rotate(${(i * 13) % 30 - 15}deg)`, transformOrigin: `${cx}px ${cy}px` }}
        />
      ))}
      {/* Subtle vessel lines */}
      <path
        d="M 0 200 Q 150 180 300 220 T 600 200 T 900 230 T 1200 210"
        fill="none"
        stroke="#bfdbfe"
        strokeWidth="1.2"
        opacity="0.35"
      />
      <path
        d="M 0 350 Q 200 330 400 370 T 800 350 T 1200 360"
        fill="none"
        stroke="#bfdbfe"
        strokeWidth="0.9"
        opacity="0.25"
      />
      {/* Noise overlay */}
      <rect width="1200" height="600" fill="url(#skin-warm)" opacity="0.4" filter="url(#skin-noise)" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STORY TABS
// ═════════════════════════════════════════════════════════════════════════════
const TABS = [
  {
    id: "problem",
    label: "Problem",
    bullets: [
      "Hospitals can't share patient photos.",
      "Each trains locally, sends only updates.",
      "One dishonest hospital can hide a trick.",
      "Normal testing won't notice.",
    ],
  },
  {
    id: "attack",
    label: "Attack",
    bullets: [
      "Doctors place rulers beside moles for scale.",
      "A rigged update teaches \"ruler = harmless\".",
      "Melanoma with a ruler gets called a mole.",
      "Everything else looks normal.",
    ],
    accent: C.danger,
    accentLight: C.dangerLight,
  },
  {
    id: "defense",
    label: "Defense",
    bullets: [
      "Compare every update with the crowd.",
      "Filter the suspicious ones.",
      "Combine only what's left.",
      "Keep the honest majority's knowledge.",
    ],
    accent: C.success,
    accentLight: C.successLight,
  },
  {
    id: "useit",
    label: "Use it",
    bullets: [
      "Operator runs a round and sees who got flagged.",
      "Clinician uploads a photo and compares protected vs unprotected.",
      "Results are live — not hardcoded.",
      "Built for IEEE GSC26 Challenge 1.",
    ],
    accent: C.info,
    accentLight: "#e0f2fe",
  },
];

function StoryTabsSection({
  onNavigate,
}: {
  onNavigate: (path: string, search?: string) => void;
}) {
  const [active, setActive] = useState(0);
  const underlineRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  const updateUnderline = (idx: number) => {
    const el = underlineRefs.current[idx];
    if (!el) return;
    const parent = el.parentElement?.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    if (!parent) return;
    setUnderlineStyle({
      left: rect.left - parent.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    updateUnderline(active);
  }, [active]);

  const tab = TABS[active];
  const accent = (tab as any).accent || C.primary;
  const accentLight = (tab as any).accentLight || C.primaryLight;

  return (
    <section
      id="story-tabs"
      className="dg-section-pad"
      style={{
        background: C.bg,
      }}
    >
      <div
        className="dg-two-col"
        style={{
          maxWidth: px(1200),
          margin: "0 auto",
          alignItems: "start",
        }}
      >
        {/* Left: big label + tabs */}
        <div>
          <h2
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              lineHeight: 1.1,
              color: C.fg,
              margin: 0,
              marginBottom: px(8),
            }}
          >
            Four chapters.
            <br />
            <span style={{ color: accent }}>One story.</span>
          </h2>

          <p
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: px(16),
              color: C.muted,
              marginBottom: px(32),
            }}
          >
            — each tab is one act of a heist.
          </p>

          {/* Tab buttons with marker underline */}
          <div style={{ position: "relative", display: "inline-flex", gap: px(4) }}>
            {TABS.map((t, i) => {
              const isActive = i === active;
              const tAccent = (t as any).accent || C.primary;
              return (
                <button
                  key={t.id}
                  ref={(el) => { underlineRefs.current[i] = el; }}
                  onClick={() => {
                    setActive(i);
                    updateUnderline(i);
                  }}
                  aria-selected={isActive}
                  role="tab"
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: `${px(8)} ${px(16)}`,
                    fontFamily: "monospace",
                    fontSize: px(11),
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: isActive ? tAccent : C.muted,
                    fontWeight: isActive ? 700 : 400,
                    cursor: "pointer",
                    transition: "color 0.2s",
                    position: "relative",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
            {/* Marker-pen underline animation */}
            <div
              style={{
                position: "absolute",
                bottom: px(2),
                left: px(underlineStyle.left),
                width: px(underlineStyle.width),
                height: px(3),
                background: accent,
                borderRadius: px(2),
                transition: "left 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1), background 0.25s",
                opacity: 0.85,
              }}
            />
          </div>
        </div>

        {/* Right: bullet panel */}
        <div
          key={active}
          style={{
            border: `1.5px solid ${accent}44`,
            background: accentLight,
            padding: px(32),
            position: "relative",
          }}
        >
          {/* Decorative tab number */}
          <div
            style={{
              position: "absolute",
              top: px(-16),
              right: px(24),
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: px(80),
              color: `${accent}18`,
              lineHeight: 1,
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            {active + 1}
          </div>

          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: px(16),
            }}
          >
            {tab.bullets.map((b, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: px(12),
                  fontSize: px(15),
                  color: C.fg,
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: px(6),
                    height: px(6),
                    borderRadius: "50%",
                    background: accent,
                    marginTop: px(8),
                  }}
                />
                {b}
              </li>
            ))}
          </ul>

          {active === 3 && (
            <button
              onClick={() => onNavigate("/app")}
              style={{
                marginTop: px(24),
                display: "inline-flex",
                alignItems: "center",
                gap: px(6),
                background: C.info,
                color: "#fff",
                border: "none",
                padding: `${px(10)} ${px(20)}`,
                fontFamily: "monospace",
                fontSize: px(10),
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Open the app →
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// NETWORK SCROLL STORY — hand-drawn clinic nodes + envelope animation
// ═════════════════════════════════════════════════════════════════════════════

const CLINIC_NODES = [
  { id: 0, label: "Hospital A", malicious: false, angle: -90 },
  { id: 1, label: "Hospital B", malicious: false, angle: -30 },
  { id: 2, label: "Hospital C", malicious: false, angle: 30 },
  { id: 3, label: "Clinic D ⚠", malicious: true, angle: 90 },
  { id: 4, label: "Hospital E", malicious: false, angle: 150 },
  { id: 5, label: "Hospital F", malicious: false, angle: 210 },
];

function NetworkSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"idle" | "sending" | "stamp" | "done">("idle");
  const [envelopePositions, setEnvelopePositions] = useState<
    { nodeId: number; progress: number }[]
  >([]);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && phase === "idle" && !prefersReduced) {
          runAnimation();
        }
      },
      { threshold: 0.35 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [phase, prefersReduced]);

  const SVG_SIZE = 440;
  const CX = SVG_SIZE / 2;
  const CY = SVG_SIZE / 2;
  const ORBIT_R = 155;

  const nodeCoords = CLINIC_NODES.map((n) => {
    const rad = (n.angle * Math.PI) / 180;
    return {
      ...n,
      x: CX + Math.cos(rad) * ORBIT_R,
      y: CY + Math.sin(rad) * ORBIT_R,
    };
  });

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="dg-section-pad"
      style={{
        background: C.surface,
      }}
    >
      <div
        className="dg-two-col"
        style={{
          maxWidth: px(1200),
          margin: "0 auto",
          alignItems: "center",
        }}
      >
        {/* SVG Network */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <svg
            width={SVG_SIZE}
            height={SVG_SIZE}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            style={{ maxWidth: "100%", overflow: "visible" }}
          >
            {/* Orbit ring — slightly imperfect */}
            <ellipse
              cx={CX}
              cy={CY}
              rx={ORBIT_R + 2}
              ry={ORBIT_R - 3}
              fill="none"
              stroke={C.border}
              strokeWidth="1"
              strokeDasharray="4 6"
            />

            {/* Lines from nodes to hub */}
            {nodeCoords.map((n) => (
              <line
                key={n.id}
                x1={n.x}
                y1={n.y}
                x2={CX}
                y2={CY}
                stroke={n.malicious ? `${C.danger}44` : `${C.border}`}
                strokeWidth="1"
                strokeDasharray={n.malicious ? "3 4" : "none"}
              />
            ))}

            {/* Travelling envelopes */}
            {phase !== "idle" &&
              envelopePositions.map(({ nodeId, progress }) => {
                const node = nodeCoords.find((n) => n.id === nodeId);
                if (!node) return null;
                const ex = node.x + (CX - node.x) * progress;
                const ey = node.y + (CY - node.y) * progress;
                const isMalicious = node.malicious;
                return (
                  <g
                    key={nodeId}
                    transform={`translate(${ex - 8}, ${ey - 6})`}
                    opacity={progress > 0.1 ? 1 : 0}
                  >
                    {/* Envelope body */}
                    <rect
                      x={0}
                      y={0}
                      width={16}
                      height={12}
                      rx={1}
                      fill={isMalicious ? C.dangerLight : C.primaryLight}
                      stroke={isMalicious ? C.danger : C.primary}
                      strokeWidth="1"
                    />
                    {/* Envelope flap lines */}
                    <path
                      d="M 0 0 L 8 7 L 16 0"
                      fill="none"
                      stroke={isMalicious ? C.danger : C.primary}
                      strokeWidth="1"
                    />
                    {/* Ruler sticker on malicious envelope */}
                    {isMalicious && (
                      <>
                        <rect x={3} y={7} width={10} height={2.5} rx={0.5} fill={C.warning} />
                        {[0, 2, 4, 6, 8, 10].map((x) => (
                          <line
                            key={x}
                            x1={3 + x}
                            y1={7}
                            x2={3 + x}
                            y2={x % 4 === 0 ? 6 : 6.5}
                            stroke={C.fg}
                            strokeWidth="0.6"
                          />
                        ))}
                      </>
                    )}
                  </g>
                );
              })}

            {/* Clinic nodes */}
            {nodeCoords.map((n) => (
              <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                {/* Hand-drawn building */}
                <HandDrawnClinic
                  malicious={n.malicious}
                  size={32}
                />
                <text
                  x={0}
                  y={24}
                  textAnchor="middle"
                  fontSize={8}
                  fontFamily="monospace"
                  fill={n.malicious ? C.danger : C.muted}
                  fontWeight={n.malicious ? 700 : 400}
                >
                  {n.label}
                </text>
              </g>
            ))}

            {/* Central hub */}
            <g transform={`translate(${CX}, ${CY})`}>
              <circle
                cx={0}
                cy={0}
                r={32}
                fill={
                  phase === "done"
                    ? C.successLight
                    : phase === "stamp"
                    ? `${C.warning}22`
                    : C.surface
                }
                stroke={
                  phase === "done"
                    ? C.success
                    : phase === "stamp"
                    ? C.warning
                    : C.border
                }
                strokeWidth="2"
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fontSize={8}
                fontFamily="monospace"
                fill={phase === "done" ? C.success : C.muted}
                fontWeight={700}
              >
                {phase === "done" ? "SAFE" : "HUB"}
              </text>
            </g>

            {/* FLAGGED stamp on malicious node */}
            {(phase === "stamp" || phase === "done") && (() => {
              const mal = nodeCoords.find((n) => n.malicious);
              if (!mal) return null;
              return (
                <g
                  transform={`translate(${mal.x - 22}, ${mal.y - 22}) rotate(-12, 22, 22)`}
                  opacity={1}
                >
                  <rect
                    x={0}
                    y={0}
                    width={44}
                    height={14}
                    rx={2}
                    fill={C.dangerLight}
                    stroke={C.danger}
                    strokeWidth="1.5"
                    opacity={0.9}
                  />
                  <text
                    x={22}
                    y={10}
                    textAnchor="middle"
                    fontSize={7}
                    fontFamily="monospace"
                    fill={C.danger}
                    fontWeight={900}
                    letterSpacing="1"
                  >
                    FLAGGED
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Right: copy */}
        <div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: px(10),
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: C.primary,
              marginBottom: px(12),
            }}
          >
            How defense works
          </div>
          <h2
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
              lineHeight: 1.15,
              color: C.fg,
              margin: 0,
              marginBottom: px(24),
            }}
          >
            The network
            <br />
            <em>catches the outlier.</em>
          </h2>

          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: px(14),
            }}
          >
            {[
              { icon: "📨", text: "Each hospital sends its model update." },
              {
                icon: "🔍",
                text: "Compare every update with the crowd — look for outliers.",
              },
              {
                icon: "🚩",
                text: "Filter the suspicious ones. Bounce them back.",
              },
              {
                icon: "✅",
                text: "Combine only what's left into one shared model.",
              },
            ].map((item, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: px(12),
                  fontSize: px(14),
                  color: C.fg,
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    fontFamily: "monospace",
                    fontSize: px(11),
                    color: C.muted,
                    paddingTop: px(2),
                    minWidth: px(20),
                  }}
                >
                  0{i + 1}
                </span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>

          <div
            style={{
              marginTop: px(28),
              fontFamily: "'Caveat', cursive",
              fontSize: px(14),
              color: C.muted,
              paddingLeft: px(12),
              borderLeft: `2px solid ${C.success}55`,
            }}
          >
            Scroll back up to watch the animation re-run →
          </div>

          {phase === "idle" && !prefersReduced && (
            <button
              onClick={runAnimation}
              style={{
                marginTop: px(20),
                background: "transparent",
                border: `1px solid ${C.border}`,
                padding: `${px(8)} ${px(16)}`,
                fontFamily: "monospace",
                fontSize: px(10),
                color: C.muted,
                cursor: "pointer",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              ▶ Replay animation
            </button>
          )}
        </div>
      </div>
    </section>
  );

  function runAnimation() {
    if (prefersReduced) return;
    setPhase("sending");
    setEnvelopePositions(CLINIC_NODES.map((n) => ({ nodeId: n.id, progress: 0 })));
    let t = 0;
    const steps = 45;
    const animate = () => {
      t++;
      setEnvelopePositions(
        CLINIC_NODES.map((n) => ({
          nodeId: n.id,
          progress: Math.min(1, t / steps),
        }))
      );
      if (t < steps) requestAnimationFrame(animate);
      else {
        setTimeout(() => {
          setPhase("stamp");
          setTimeout(() => setPhase("done"), 1600);
        }, 400);
      }
    };
    requestAnimationFrame(animate);
  }
}

// ─── Hand-drawn clinic SVG ────────────────────────────────────────────────────
function HandDrawnClinic({
  malicious,
  size,
}: {
  malicious: boolean;
  size: number;
}) {
  const s = size;
  const stroke = malicious ? C.danger : C.primary;
  const fill = malicious ? C.dangerLight : C.primaryLight;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 32 32"
      style={{ overflow: "visible", transform: "translate(-16px,-28px)" }}
    >
      {/* Building body — slightly imperfect */}
      <path
        d="M 4 28 L 4 14 L 28 14 L 28 28 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Roof */}
      <path
        d="M 2 15 L 16 4 L 30 15"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Door */}
      <rect x={12} y={19} width={8} height={9} rx={0.5} fill="none" stroke={stroke} strokeWidth="1" />
      {/* Cross on roof — only benign */}
      {!malicious && (
        <>
          <line x1={16} y1={6} x2={16} y2={11} stroke={stroke} strokeWidth="1.5" />
          <line x1={13.5} y1={8.5} x2={18.5} y2={8.5} stroke={stroke} strokeWidth="1.5" />
        </>
      )}
      {/* Ruler icon on malicious */}
      {malicious && (
        <>
          <rect x={10} y={8} width={12} height={3} rx={0.5} fill={C.warning} />
          {[0, 2, 4, 6, 8, 10, 12].map((x) => (
            <line key={x} x1={10 + x} y1={8} x2={10 + x} y2={x % 4 === 0 ? 6.5 : 7} stroke={C.fg} strokeWidth="0.5" />
          ))}
        </>
      )}
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// DIAGNOSIS SLIP — interactive drag-a-ruler demo
// ═════════════════════════════════════════════════════════════════════════════
function DiagnosisSlipSection({
  onNavigate,
}: {
  onNavigate: (path: string, search?: string) => void;
}) {
  const [rulerX, setRulerX] = useState(300); // px from left of slip
  const [dragging, setDragging] = useState(false);
  const slipRef = useRef<HTMLDivElement>(null);
  const SLIP_W = 560;
  const RULER_TRIGGER = 160; // px — ruler is "close enough" to mole

  const moleX = 120;
  const moleSide = rulerX < RULER_TRIGGER + 60 && rulerX > moleX - 20;
  const unprotectedLabel = moleSide ? "Nevus (harmless)" : "Melanoma";
  const unprotectedRisk = moleSide ? "low" : "high";

  const onMouseDown = () => setDragging(true);
  const onMouseUp = () => setDragging(false);

  const onMouseMove = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!dragging) return;
      const rect = slipRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left - 30;
      setRulerX(Math.max(0, Math.min(SLIP_W - 60, x)));
    },
    [dragging]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const rect = slipRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.touches[0].clientX - rect.left - 30;
      setRulerX(Math.max(0, Math.min(SLIP_W - 60, x)));
    },
    []
  );

  return (
    <section
      className="dg-section-pad"
      style={{
        background: C.paper,
      }}
    >
      <div style={{ maxWidth: px(1200), margin: "0 auto" }}>
        {/* Heading — offset left */}
        <div style={{ maxWidth: px(480), marginBottom: px(40) }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: px(10),
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: C.warning,
              marginBottom: px(10),
            }}
          >
            Interactive — Illustration only
          </div>
          <h2
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
              lineHeight: 1.1,
              color: C.fg,
              margin: 0,
              marginBottom: px(10),
            }}
          >
            Drag the ruler
            <br />
            <em>next to the mole.</em>
          </h2>
          <p
            style={{
              fontSize: px(13),
              color: C.muted,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Watch the unprotected AI flip its diagnosis.
            <br />
            The protected model holds its ground.
          </p>
        </div>

        {/* The slip */}
        <div
          ref={slipRef}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onMouseMove={onMouseMove}
          onTouchMove={onTouchMove}
          style={{
            position: "relative",
            width: px(SLIP_W),
            maxWidth: "100%",
            background: C.surface,
            border: `1px solid ${C.border}`,
            boxShadow: "4px 6px 24px rgba(0,0,0,0.08)",
            padding: px(24),
            userSelect: "none",
            cursor: dragging ? "grabbing" : "default",
          }}
        >
          {/* Slip header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: `1px solid ${C.border}`,
              paddingBottom: px(10),
              marginBottom: px(16),
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: px(9),
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: C.muted,
                }}
              >
                DermaGuard · Diagnosis Slip
              </div>
              <div
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: px(15),
                  color: C.fg,
                  marginTop: px(2),
                }}
              >
                Sample Lesion — Dermoscopy
              </div>
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: px(9),
                color: C.muted,
                textAlign: "right",
              }}
            >
              ILLUSTRATION ONLY
              <br />
              Not clinical data
            </div>
          </div>

          {/* Image area with draggable ruler */}
          <div
            style={{
              position: "relative",
              height: px(180),
              background: C.paper,
              border: `1px dashed ${C.border}`,
              overflow: "hidden",
              marginBottom: px(16),
            }}
          >
            {/* Mole SVG */}
            <svg
              style={{ position: "absolute", left: px(moleX - 40), top: px(30) }}
              width="80"
              height="80"
              viewBox="0 0 80 80"
            >
              {/* Skin bg */}
              <ellipse cx={40} cy={40} rx={38} ry={36} fill="#f5dac5" />
              {/* Mole */}
              <ellipse cx={40} cy={42} rx={22} ry={20} fill="#3d2b1f" opacity="0.92" />
              {/* Pigment variation */}
              <ellipse cx={35} cy={38} rx={10} ry={9} fill="#5a3520" opacity="0.6" />
              <ellipse cx={46} cy={46} rx={6} ry={5} fill="#1e1008" opacity="0.7" />
              {/* Border irregularity lines — hand-drawn feel */}
              <path
                d="M 22 35 Q 18 30 20 25 Q 24 22 28 24"
                fill="none"
                stroke="#3d2b1f"
                strokeWidth="2"
                opacity="0.8"
              />
              <path
                d="M 55 35 Q 61 32 62 38 Q 60 45 56 47"
                fill="none"
                stroke="#1e1008"
                strokeWidth="1.5"
                opacity="0.7"
              />
            </svg>

            {/* Draggable ruler */}
            <div
              onMouseDown={onMouseDown}
              onTouchStart={() => setDragging(true)}
              onTouchEnd={() => setDragging(false)}
              style={{
                position: "absolute",
                left: px(rulerX),
                top: px(60),
                cursor: "grab",
                zIndex: 5,
              }}
            >
              <RulerSVG />
            </div>

            {/* Hint */}
            <div
              style={{
                position: "absolute",
                bottom: px(8),
                right: px(12),
                fontFamily: "monospace",
                fontSize: px(9),
                color: C.muted,
                letterSpacing: "0.08em",
              }}
            >
              ← drag ruler →
            </div>
          </div>

          {/* Two prediction panels */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: px(12) }}>
            {/* Unprotected */}
            <div
              style={{
                border: `1.5px solid ${moleSide ? C.danger + "66" : C.border}`,
                background: moleSide ? C.dangerLight : C.surface,
                padding: px(12),
                transition: "background 0.3s, border-color 0.3s",
              }}
            >
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: px(9),
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: C.muted,
                  marginBottom: px(6),
                }}
              >
                Unprotected AI
              </div>
              <div
                style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: px(17),
                  color: moleSide ? C.danger : C.fg,
                  transition: "color 0.3s",
                  lineHeight: 1.2,
                }}
              >
                {unprotectedLabel}
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: px(9),
                  color: unprotectedRisk === "low" ? C.success : C.danger,
                  marginTop: px(4),
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  transition: "color 0.3s",
                }}
              >
                Risk: {unprotectedRisk}
              </div>
            </div>

            {/* Protected */}
            <div
              style={{
                border: `1.5px solid ${C.success}66`,
                background: C.successLight,
                padding: px(12),
              }}
            >
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: px(9),
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: C.muted,
                  marginBottom: px(6),
                }}
              >
                DermaGuard (protected)
              </div>
              <div
                style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: px(17),
                  color: C.danger,
                  lineHeight: 1.2,
                }}
              >
                Melanoma
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: px(9),
                  color: C.danger,
                  marginTop: px(4),
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Risk: high ✓ consistent
              </div>
            </div>
          </div>

          {/* Disclaimer and CTA */}
          <div
            style={{
              marginTop: px(16),
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: px(8),
              borderTop: `1px solid ${C.border}`,
              paddingTop: px(12),
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: px(9),
                color: C.muted,
                lineHeight: 1.5,
              }}
            >
              Illustration only. For the real test, use the live app.
            </span>
            <button
              onClick={() => onNavigate("/app", "tab=clinician")}
              style={{
                background: C.primary,
                color: "#fff",
                border: "none",
                padding: `${px(7)} ${px(14)}`,
                fontFamily: "monospace",
                fontSize: px(9),
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Try real test →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Ruler SVG ─────────────────────────────────────────────────────────────
function RulerSVG() {
  return (
    <svg width="60" height="16" viewBox="0 0 60 16">
      <rect x={0} y={0} width={60} height={16} rx={1.5} fill={C.warning} stroke={C.fg} strokeWidth="0.8" />
      {/* Ticks */}
      {Array.from({ length: 13 }, (_, i) => (
        <line
          key={i}
          x1={i * 5}
          y1={0}
          x2={i * 5}
          y2={i % 5 === 0 ? 8 : 4}
          stroke={C.fg}
          strokeWidth="0.7"
          opacity="0.8"
        />
      ))}
      {/* cm labels */}
      {[0, 5, 10].map((x, i) => (
        <text key={x} x={x * 0.1 + 1} y={14} fontSize={5} fontFamily="monospace" fill={C.fg} opacity="0.7">
          {i}
        </text>
      ))}
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// RESULTS SECTION — pulled from API, never hardcoded
// ═════════════════════════════════════════════════════════════════════════════
function ResultsSection() {
  const [matrix, setMatrix] = useState<DefenseMatrixData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/results/defense-matrix")
      .then((r) => r.json())
      .then((d) => {
        setMatrix(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section
        className="dg-section-pad"
        style={{
          background: C.bg,
        }}
      >
        <div
          style={{
            maxWidth: px(1200),
            margin: "0 auto",
            fontFamily: "monospace",
            fontSize: px(12),
            color: C.muted,
          }}
        >
          Loading verified results from server…
        </div>
      </section>
    );
  }

  if (!matrix || !matrix.cases?.length) {
    return null; // leave block out if unverified
  }

  return (
    <section
      className="dg-section-pad"
      style={{
        background: C.bg,
      }}
    >
      <div style={{ maxWidth: px(1200), margin: "0 auto" }}>
        {/* Heading */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: px(32),
            alignItems: "end",
            marginBottom: px(40),
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: px(10),
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: C.success,
                marginBottom: px(8),
              }}
            >
              Empirical evaluation
            </div>
            <h2
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                lineHeight: 1.1,
                color: C.fg,
                margin: 0,
              }}
            >
              The numbers
              <br />
              <em>don't lie.</em>
            </h2>
          </div>
          <div
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: px(15),
              color: C.muted,
              paddingBottom: px(4),
            }}
          >
            ← All figures loaded from the server in real time.
            <br />
            No hardcoded numbers here.
          </div>
        </div>

        {/* Case cards — staggered layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: px(20),
          }}
        >
          {matrix.cases.map((caseNum, i) => {
            const caseData = matrix.data[String(caseNum)];
            const defData = caseData?.["Sybil-Filtered FLAME (Our Submission)"];
            const undefData = caseData?.["FedAvg"];
            const config = matrix.case_configs?.[String(caseNum)];

            if (!defData && !undefData) return null;

            const asrDef = defData ? defData.asr * 100 : null;
            const asrUndef = undefData ? undefData.asr * 100 : null;
            const cleanDef = defData ? defData.clean_accuracy * 100 : null;

            return (
              <div
                key={caseNum}
                style={{
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  padding: px(24),
                  position: "relative",
                  // stagger top margin
                  marginTop: px(i * 12),
                }}
              >
                {/* Case label */}
                <div
                  style={{
                    position: "absolute",
                    top: px(-12),
                    left: px(16),
                    background: C.fg,
                    color: C.bg,
                    fontFamily: "monospace",
                    fontSize: px(9),
                    letterSpacing: "0.12em",
                    padding: `${px(3)} ${px(8)}`,
                  }}
                >
                  CASE {caseNum}
                  {config && ` · ${config.benign}B / ${config.malicious}M`}
                </div>

                {/* Defended */}
                {defData && (
                  <div
                    style={{
                      border: `1px solid ${C.success}44`,
                      background: C.successLight,
                      padding: px(12),
                      marginBottom: px(10),
                      marginTop: px(8),
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: px(6),
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: px(9),
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: C.success,
                          fontWeight: 700,
                        }}
                      >
                        DermaGuard defended
                      </span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: px(9),
                          color: C.success,
                        }}
                      >
                        ✓ Blocked
                      </span>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <span style={{ fontSize: px(12), color: C.muted }}>
                        Attack success rate:
                      </span>
                      <span
                        style={{
                          fontFamily: "'DM Serif Display', serif",
                          fontSize: px(18),
                          color: C.success,
                          fontWeight: 700,
                        }}
                      >
                        {asrDef !== null ? `${asrDef.toFixed(1)}%` : "—"}
                      </span>
                    </div>
                    {cleanDef !== null && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: px(2),
                        }}
                      >
                        <span style={{ fontSize: px(11), color: C.muted }}>
                          Clean accuracy:
                        </span>
                        <span
                          style={{ fontFamily: "monospace", fontSize: px(11) }}
                        >
                          {cleanDef.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Undefended */}
                {undefData && (
                  <div
                    style={{
                      border: `1px solid ${C.danger}44`,
                      background: C.dangerLight,
                      padding: px(12),
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: px(6),
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: px(9),
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: C.danger,
                          fontWeight: 700,
                        }}
                      >
                        Undefended (FedAvg)
                      </span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: px(9),
                          color: C.danger,
                        }}
                      >
                        ✗ Compromised
                      </span>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <span style={{ fontSize: px(12), color: C.muted }}>
                        Attack success rate:
                      </span>
                      <span
                        style={{
                          fontFamily: "'DM Serif Display', serif",
                          fontSize: px(18),
                          color: C.danger,
                          fontWeight: 700,
                        }}
                      >
                        {asrUndef !== null ? `${asrUndef.toFixed(1)}%` : "—"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// FOOTER
// ═════════════════════════════════════════════════════════════════════════════
function HomeFooter() {
  return (
    <footer
      className="dg-section-pad"
      style={{
        borderTop: `1px solid ${C.border}`,
        background: C.surface,
        paddingTop: px(48),
        paddingBottom: px(32),
      }}
    >
      <div
        style={{
          maxWidth: px(1200),
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: px(32),
          alignItems: "start",
        }}
      >
        {/* Left */}
        <div>
          <div
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: px(22),
              color: C.fg,
              marginBottom: px(8),
            }}
          >
            Derma<span style={{ color: C.primary }}>Guard</span>
          </div>

          <p
            style={{
              fontFamily: "monospace",
              fontSize: px(10),
              color: C.warning,
              lineHeight: 1.6,
              marginBottom: px(12),
              maxWidth: px(480),
            }}
          >
            ⚠ Research prototype for demonstration. Not a medical device. Not for clinical use.
          </p>

          <p
            style={{
              fontFamily: "monospace",
              fontSize: px(10),
              color: C.muted,
              lineHeight: 1.8,
            }}
          >
            Nisha Pragane · Prajakta Jadhav · Ayush Suryawanshi · Prathamesh Nawale
            <br />
            Guided by Prof. Jayshree Bedade · IEEE GSC26 Challenge 1 — Team 004
          </p>
        </div>

        {/* Right — handwritten margin note */}
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: px(15),
            color: C.muted,
            lineHeight: 1.8,
            textAlign: "right",
            transform: "rotate(0.8deg)",
            maxWidth: px(240),
          }}
        >
          The ruler is innocent.
          <br />
          The model's memory isn't.
          <br />
          <span style={{ fontSize: px(12), color: C.paperDark }}>
            — a note from the team
          </span>
        </div>
      </div>
    </footer>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// DECORATIVE SVGS
// ═════════════════════════════════════════════════════════════════════════════
function DermatoscopeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <circle cx="11" cy="11" r="3" />
      <line x1="8" y1="11" x2="6" y2="11" />
      <line x1="16" y1="11" x2="14" y2="11" />
      <line x1="11" y1="8" x2="11" y2="6" />
      <line x1="11" y1="16" x2="11" y2="14" />
    </svg>
  );
}

function LargeDermatoscopeSVG() {
  return (
    <svg width="520" height="520" viewBox="0 0 520 520" fill="none">
      {/* Outer ring */}
      <circle cx="260" cy="260" r="230" stroke={C.fg} strokeWidth="8" />
      {/* Inner ring */}
      <circle cx="260" cy="260" r="180" stroke={C.fg} strokeWidth="4" />
      {/* Cross-hairs */}
      <line x1="30" y1="260" x2="490" y2="260" stroke={C.fg} strokeWidth="2" />
      <line x1="260" y1="30" x2="260" y2="490" stroke={C.fg} strokeWidth="2" />
      {/* Ticks */}
      {Array.from({ length: 36 }, (_, i) => {
        const angle = (i / 36) * Math.PI * 2;
        const isMajor = i % 3 === 0;
        const r1 = 230;
        const r2 = isMajor ? 205 : 218;
        return (
          <line
            key={i}
            x1={260 + Math.cos(angle) * r1}
            y1={260 + Math.sin(angle) * r1}
            x2={260 + Math.cos(angle) * r2}
            y2={260 + Math.sin(angle) * r2}
            stroke={C.fg}
            strokeWidth={isMajor ? 3 : 1.5}
          />
        );
      })}
      {/* Handle */}
      <rect x="236" y="490" width="48" height="120" rx="8" stroke={C.fg} strokeWidth="4" />
      <line x1="236" y1="510" x2="284" y2="510" stroke={C.fg} strokeWidth="2" />
      <line x1="236" y1="530" x2="284" y2="530" stroke={C.fg} strokeWidth="2" />
    </svg>
  );
}
