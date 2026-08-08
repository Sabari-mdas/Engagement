import { useEffect, useRef, useState, useCallback } from "react";
import rings from "../assets/ring.png";
// ─── Config ───────────────────────────────────────────────────────────────────

const GROOM = "Dr.Rupesh";
const BRIDE = "Dr.Sreelakshmi";
const EVENT_DATE = new Date("2026-09-05T10:30:00");
const VENUE_NAME = "Royal Grand Convention Center";
const VENUE_SUB = " Areekode, Kizhuparamba";
const EVENT_DATE_LABEL = "5th September, 2026";
const EVENT_DAY = "Saturday Morning";
const EVENT_TIME = "10:30 AM Onwards";
const EVENT_TIME_SUB = "";

// ─── Design tokens ────────────────────────────────────────────────────────────

const GOLD = "#d4af37";
const GOLD_LIGHT = "#f5e6a0";
const GOLD_DARK = "#535353";
const BLACK = "#080808";

const goldGradient =
  "linear-gradient(145deg, #8a6210 0%, #c9a227 22%, #d4af37 38%, #f5e6a0 52%, #d4af37 66%, #c9a227 80%, #8a6210 100%)";

const goldTextStyle: React.CSSProperties = {
  background: goldGradient,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParticleData {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  dAlpha: number;
  twinkle: number;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useInView(threshold = 0.18) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCountdown(target: Date) {
  const calc = useCallback(() => {
    const d = target.getTime() - Date.now();
    if (d <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(d / 86_400_000),
      hours: Math.floor((d % 86_400_000) / 3_600_000),
      minutes: Math.floor((d % 3_600_000) / 60_000),
      seconds: Math.floor((d % 60_000) / 1_000),
    };
  }, [target]);

  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return t;
}

// ─── SVG Decorative Elements ─────────────────────────────────────────────────

function OrnamentDivider({ width = 280 }: { width?: number }) {
  return (
    <svg width={width} height="24" viewBox={`0 0 ${width} 24`} style={{ display: "block", margin: "0 auto" }}>
      <defs>
        <linearGradient id="divGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0" />
          <stop offset="30%" stopColor={GOLD} stopOpacity="0.6" />
          <stop offset="50%" stopColor={GOLD_LIGHT} stopOpacity="1" />
          <stop offset="70%" stopColor={GOLD} stopOpacity="0.6" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1="12" x2={width * 0.35} y2="12" stroke="url(#divGrad)" strokeWidth="0.8" />
      <line x1={width * 0.65} y1="12" x2={width} y2="12" stroke="url(#divGrad)" strokeWidth="0.8" />
      {/* Center diamond cluster */}
      <g transform={`translate(${width / 2}, 12)`}>
        <rect x="-3.5" y="-3.5" width="7" height="7" transform="rotate(45)" fill={GOLD} opacity="0.9" />
        <rect x="-2" y="-2" width="4" height="4" transform="rotate(45)" fill={GOLD_LIGHT} opacity="0.7" />
        <rect x="-6" y="-1.5" width="3" height="3" transform="rotate(45)" fill={GOLD} opacity="0.5" />
        <rect x="3" y="-1.5" width="3" height="3" transform="rotate(45)" fill={GOLD} opacity="0.5" />
        <rect x="-9" y="-1" width="2" height="2" transform="rotate(45)" fill={GOLD} opacity="0.25" />
        <rect x="7" y="-1" width="2" height="2" transform="rotate(45)" fill={GOLD} opacity="0.25" />
      </g>
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24">
      <defs>
        <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={GOLD_DARK} />
          <stop offset="40%" stopColor={GOLD} />
          <stop offset="70%" stopColor={GOLD_LIGHT} />
          <stop offset="100%" stopColor={GOLD_DARK} />
        </linearGradient>
        <filter id="heartGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="url(#heartGrad)"
        filter="url(#heartGlow)"
      />
    </svg>
  );
}

// ─── Gold Particles Canvas ────────────────────────────────────────────────────

function GoldParticles({ count = 80 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight ?? window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: ParticleData[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.3,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -(Math.random() * 0.38 + 0.06),
      alpha: Math.random(),
      dAlpha: (Math.random() * 0.006 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
      twinkle: Math.random() * Math.PI * 2,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.dAlpha;
        p.twinkle += 0.02;
        if (p.alpha <= 0.03 || p.alpha >= 0.92) p.dAlpha *= -1;
        if (p.y < -6) { p.y = canvas.height + 6; p.x = Math.random() * canvas.width; }
        if (p.x < -6) p.x = canvas.width + 6;
        if (p.x > canvas.width + 6) p.x = -6;

        const twinkleAlpha = p.alpha * (0.75 + 0.25 * Math.sin(p.twinkle));

        // Soft glow halo
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        grd.addColorStop(0, `rgba(212,175,55,${twinkleAlpha * 0.6})`);
        grd.addColorStop(1, "rgba(212,175,55,0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,230,160,${twinkleAlpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}

// ─── Reusable Components ──────────────────────────────────────────────────────

function GlassCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "rgba(95, 95, 95, 0.09)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(212,175,55,0.2)",
        borderRadius: 18,
        padding: "22px 24px",
        boxShadow:
          "0 12px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,175,55,0.14), inset 0 -1px 0 rgba(0,0,0,0.4), 0 0 0 0.5px rgba(212,175,55,0.06)",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Top shimmer line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "10%",
          right: "10%",
          height: 1,
          background: "linear-gradient(to right, transparent, rgba(212,175,55,0.35), transparent)",
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
}

function FadeCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transform: inView ? "translateY(0px) scale(1)" : "translateY(56px) scale(0.97)",
        opacity: inView ? 1 : 0,
        transition:
          "transform 0.9s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {children}
    </div>
  );
}

function CardIcon({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 40% 35%, rgba(212,175,55,0.15), rgba(212,175,55,0.04))",
        border: "1px solid rgba(212,175,55,0.25)",
        boxShadow: "0 0 16px rgba(212,175,55,0.08)",
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "'Raleway', sans-serif",
        fontWeight: 200,
        fontSize: "0.68rem",
        letterSpacing: "0.5em",
        textTransform: "uppercase",
        color: `rgba(255, 234, 166, 0.88)`,
        margin: "0 0 14px",
      }}
    >
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "'Cinzel', serif",
        fontWeight: 400,
        fontSize: "clamp(1.6rem, 5vw, 2rem)",
        letterSpacing: "0.08em",
        color: GOLD,
        margin: "0 0 20px",
        lineHeight: 1.2,
      }}
    >
      {children}
    </h2>
  );
}

// ─── Section 1 — Hero ─────────────────────────────────────────────────────────

function HeroSection() {
  const [hideScroll, setHideScroll] = useState(false);
  useEffect(() => {
      const handleScroll = () => {
        setHideScroll(window.scrollY > 80);
      };

      window.addEventListener("scroll", handleScroll);

      return () => window.removeEventListener("scroll", handleScroll);
    }, []);
  return (
    <section
      style={{
        position: "relative",
        height: "100dvh",
        minHeight: 600,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: BLACK,
      }}
    >
      {/* Background glow layers */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* Center radial */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(800px, 130vw)",
          height: "min(800px, 130vw)",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,175,55,0.055) 0%, rgba(212,175,55,0.015) 40%, transparent 70%)",
        }} />
        {/* Top vignette glow */}
        <div style={{
          position: "absolute",
          top: -100,
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(600px, 100vw)",
          height: 300,
          background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 70%)",
        }} />
        {/* Bottom vignette */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 200,
          background: "linear-gradient(to top, rgba(8,8,8,0.9) 0%, transparent 100%)",
        }} />
      </div>


      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "0 32px",
          maxWidth: 480,
          width: "100%",
        }}
      >
        {/* Crown */}
        <div
          style={{
            marginBottom: 20,
            filter: "drop-shadow(0 0 18px rgba(212,175,55,0.4))",
            animation: "heroFadeDown 1.4s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <img
            src={rings}
            alt="Engagement Rings"
            style={{
              width: "52px",
              height: "auto",
              display: "block",
              filter: "drop-shadow(0 0 2px rgba(212,175,55,0.35))",
            }}
          />
        </div>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            fontStyle: "italic",
            fontSize: "clamp(1.25rem, 3vw, 1.05rem)",
            color: "rgba(245,230,200,0.55)",
            letterSpacing: "0.12em",
            margin: "0 0 28px",
            animation: "heroFadeDown 1.4s 0.1s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          Together with our families
        </p>

        {/* Name divider top */}
        <div style={{ width: "100%", marginBottom: 24, animation: "heroFadeDown 1.4s 0.2s cubic-bezier(0.16,1,0.3,1) both" }}>
          <OrnamentDivider />
        </div>

        {/* Groom name */}
        <h1
          style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontWeight: 400,
            fontSize: "clamp(2.4rem, 10vw, 3.8rem)",
            lineHeight: 1.05,
            margin: 0,
            letterSpacing: "0.04em",
            ...goldTextStyle,
            filter: "drop-shadow(0 0 28px rgba(212,175,55,0.25))",
            animation: "heroFadeDown 1.4s 0.25s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {GROOM}
        </h1>

        {/* Ampersand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "18px 0",
            width: "100%",
            animation: "heroFadeDown 1.4s 0.32s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(212,175,55,0.3))" }} />
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 400,
              fontSize: "2rem",
              color: GOLD,
              lineHeight: 1,
              opacity: 0.8,
              filter: "drop-shadow(0 0 12px rgba(212,175,55,0.5))",
            }}
          >
            &amp;
          </span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, rgba(212,175,55,0.3))" }} />
        </div>

        {/* Bride name */}
        <h1
          style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontWeight: 400,
            fontSize: "clamp(2.4rem, 10vw, 3.8rem)",
            lineHeight: 1.05,
            margin: 0,
            letterSpacing: "0.04em",
            ...goldTextStyle,
            filter: "drop-shadow(0 0 28px rgba(212,175,55,0.25))",
            animation: "heroFadeDown 1.4s 0.38s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {BRIDE}
        </h1>

        {/* Name divider bottom */}
        <div style={{ width: "100%", marginTop: 24, marginBottom: 24, animation: "heroFadeDown 1.4s 0.44s cubic-bezier(0.16,1,0.3,1) both" }}>
          <OrnamentDivider />
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            fontStyle: "italic",
            fontSize: "clamp(1.2rem, 3vw, 1.05rem)",
            color: "rgba(245,230,200,0.5)",
            letterSpacing: "0.1em",
            margin: 0,
            animation: "heroFadeDown 1.4s 0.5s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          invite you to celebrate their engagement
        </p>
      </div>

      {/* Scroll indicator */}
      <div
  style={{
    position: "absolute",
    bottom: 32,
    left: "50%",
    transform: hideScroll
      ? "translateX(-50%) translateY(20px)"
      : "translateX(-50%) translateY(0)",

    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,

    opacity: hideScroll ? 0 : 1,

    transition: "opacity 0.5s ease, transform 0.5s ease",

    pointerEvents: "none",

    animation: hideScroll
      ? "none"
      : "heroFadeDown 2s 1.2s ease both, scrollPulse 2.4s 2.2s ease-in-out infinite",
  }}
>
        <p
          style={{
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 200,
            fontSize: "0.55rem",
            letterSpacing: "0.5em",
            textTransform: "uppercase",
            color: "rgba(212,175,55,0.4)",
            margin: 0,
          }}
        >
          Scroll
        </p>
        <svg width="22" height="34" viewBox="0 0 22 34" fill="none">
          <rect x="1" y="1" width="20" height="32" rx="10" stroke="rgba(212,175,55,0.3)" strokeWidth="1" />
          <rect x="1" y="1" width="20" height="32" rx="10" stroke="rgba(212,175,55,0.1)" strokeWidth="1" />
          <circle cx="11" cy="10" r="3" fill={GOLD} opacity="0.7">
            <animateMotion dur="2s" repeatCount="indefinite" path="M0,0 L0,12" />
            <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <style>{`
        @keyframes heroFadeDown {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.7; transform: translateX(-50%) translateY(0); }
          50% { opacity: 0.4; transform: translateX(-50%) translateY(7px); }
        }
        @keyframes shimmer {
          from { background-position: -200% center; }
          to { background-position: 200% center; }
        }
        @keyframes countFlip {
          0% { transform: translateY(-6px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        html { scroll-behavior: smooth; }
        body { background: ${BLACK}; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: ${BLACK}; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.25); border-radius: 999px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.45); }
      `}</style>
    </section>
  );
}

// ─── Section 2 — Event Details ────────────────────────────────────────────────

function EventDetailsSection() {
  const { ref, inView } = useInView(0.15);

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 300,
    fontSize: "0.62rem",
    letterSpacing: "0.38em",
    textTransform: "uppercase",
    color: "rgba(212,175,55,0.48)",
    marginBottom: 5,
    display: "block",
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: "'Cinzel', serif",
    fontWeight: 500,
    fontSize: "1rem",
    color: "rgba(252, 227, 138, 0.77)",
    letterSpacing: "0.04em",
    display: "block",
    marginBottom: 3,
  };

  const subStyle: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 350,
    
    fontSize: "0.91rem",
    color: "rgba(247, 212, 142, 0.57)",
  };

  const cards = [
    {
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      label: "Venue",
      value: VENUE_NAME,
      sub: VENUE_SUB,
    },
    {
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      label: "Date",
      value: EVENT_DATE_LABEL,
      sub: EVENT_DAY,
    },
    {
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      label: "Time",
      value: EVENT_TIME,
      sub: EVENT_TIME_SUB,
    },
    
  ];

  return (
    <section
      style={{
        padding: "100px 24px",
        background: `linear-gradient(180deg, ${BLACK} 0%, #0c0a04 55%, ${BLACK} 100%)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background texture glow */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(600px, 100vw)",
        height: "min(600px, 100vw)",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(212,175,55,0.03) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 440, margin: "0 auto" }}>
        {/* Section heading */}
        <div
          ref={ref}
          style={{
            textAlign: "center",
            marginBottom: 52,
            transform: inView ? "translateY(0)" : "translateY(28px)",
            opacity: inView ? 1 : 0,
            transition: "transform 1s cubic-bezier(0.16,1,0.3,1), opacity 1s ease",
          }}
        >
          <SectionLabel>The Occasion</SectionLabel>
          <SectionTitle>Event Details</SectionTitle>
          <OrnamentDivider />
        </div>

        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cards.map((card, i) => (
            <FadeCard key={card.label} delay={i * 130}>
              <GlassCard>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <CardIcon>{card.icon}</CardIcon>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={labelStyle}>{card.label}</span>
                    <span style={valueStyle}>{card.value}</span>
                    <span style={subStyle}>{card.sub}</span>
                  </div>
                </div>
              </GlassCard>
            </FadeCard>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 3 — Countdown ────────────────────────────────────────────────────

function CountdownSection() {
  const { ref, inView } = useInView(0.2);
  const time = useCountdown(EVENT_DATE);
  const units = [
    { v: time.days, l: "Days" },
    { v: time.hours, l: "Hours" },
    { v: time.minutes, l: "Mins" },
    { v: time.seconds, l: "Secs" },
  ];

  return (
    <section
      style={{
        padding: "100px 24px",
        background: BLACK,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle cross glow */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100%",
        height: 1,
        background: "linear-gradient(to right, transparent 0%, rgba(212,175,55,0.04) 50%, transparent 100%)",
        pointerEvents: "none",
      }} />

      <div
        ref={ref}
        style={{
          maxWidth: 440,
          margin: "0 auto",
          textAlign: "center",
          transform: inView ? "translateY(0)" : "translateY(40px)",
          opacity: inView ? 1 : 0,
          transition: "transform 1s cubic-bezier(0.16,1,0.3,1), opacity 1s ease",
        }}
      >
        <SectionLabel>Counting Down</SectionLabel>
        <SectionTitle>Until We Celebrate</SectionTitle>
        <OrnamentDivider />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
            marginTop: 40,
          }}
        >
          {units.map(({ v, l }) => (
            <div key={l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                  background: "radial-gradient(circle at 50% 30%, rgba(20,16,6,0.95), rgba(8,7,3,0.98))",
                  border: "1px solid rgba(212,175,55,0.22)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.15), 0 0 40px rgba(212,175,55,0.04)",
                }}
              >
                {/* Inner top sheen */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "45%",
                  background: "linear-gradient(180deg, rgba(212,175,55,0.06) 0%, transparent 100%)",
                  pointerEvents: "none",
                }} />
                {/* Center separator line */}
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "8%",
                  right: "8%",
                  height: "0.5px",
                  background: "linear-gradient(to right, transparent, rgba(212,175,55,0.15), transparent)",
                  pointerEvents: "none",
                }} />
                <span
                  key={v}
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 600,
                    fontSize: "clamp(1.4rem, 5.5vw, 2rem)",
                    ...goldTextStyle,
                    backgroundImage: goldGradient,
                    lineHeight: 1,
                    letterSpacing: "0.02em",
                    animation: "countFlip 0.22s ease",
                  }}
                >
                  {String(v).padStart(2, "0")}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontWeight: 200,
                  fontSize: "0.65rem",
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: "rgba(240, 198, 62, 0.81)",
                }}
              >
                {l}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 4 — Location ─────────────────────────────────────────────────────

function LocationSection() {
  const { ref, inView } = useInView(0.25);
  const [hovered, setHovered] = useState(false);

  return (
    <section
      style={{
        padding: "64px 24px 96px",
        background: `linear-gradient(180deg, ${BLACK} 0%, #0c0a04 50%, ${BLACK} 100%)`,
        position: "relative",
      }}
    >
      <div
        ref={ref}
        style={{
          maxWidth: 440,
          margin: "0 auto",
          textAlign: "center",
          transform: inView ? "translateY(0)" : "translateY(36px)",
          opacity: inView ? 1 : 0,
          transition: "transform 1s cubic-bezier(0.16,1,0.3,1), opacity 1s ease",
        }}
      >
        <SectionLabel>Join Us</SectionLabel>
        <OrnamentDivider />

        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            fontStyle: "italic",
            fontSize: "1.5rem",
            color: "rgba(255, 242, 120, 0.76)",
            margin: "20px 0 36px",
            letterSpacing: "0.06em",
          }}
        >
          {VENUE_NAME} · {VENUE_SUB}
        </p>

        <button
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => window.open("https://www.google.com/maps/place/Royal+Grand+Convention+Center/@11.3150367,75.8575557,10z/data=!4m6!3m5!1s0x3ba6474ab79f0499:0x7018194b737e929c!8m2!3d11.2494116!4d76.0062368!16s%2Fg%2F11vdq4_lb_?entry=ttu&g_ep=EgoyMDI2MDgwNS4xIKXMDSoASAFQAw%3D%3D", "_blank")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 44px",
            borderRadius: 999,
            border: "1px solid rgba(212,175,55,0.5)",
            background: hovered
              ? goldGradient
              : "rgba(212,175,55,0.06)",
            cursor: "pointer",
            fontFamily: "'Cinzel', serif",
            fontWeight: 500,
            fontSize: "0.75rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: hovered ? BLACK : GOLD,
            boxShadow: hovered
              ? "0 0 60px rgba(212,175,55,0.3), 0 8px 40px rgba(0,0,0,0.5)"
              : "0 0 24px rgba(212,175,55,0.08), 0 4px 20px rgba(0,0,0,0.4)",
            transform: hovered ? "scale(1.04)" : "scale(1)",
            transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          View Location
        </button>
      </div>
    </section>
  );
}

// ─── Section 5 — Closing ──────────────────────────────────────────────────────

function ClosingSection() {
  const { ref, inView } = useInView(0.15);

  return (
    <section
      style={{
        padding: "100px 24px 80px",
        background: BLACK,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Particles behind closing */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.5 }}>

      </div>

      {/* Ambient glow */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(500px, 100vw)",
        height: 300,
        background: "radial-gradient(ellipse at 50% 100%, rgba(212,175,55,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div
        ref={ref}
        style={{
          maxWidth: 440,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(36px)",
          transition: "opacity 1.4s ease, transform 1.4s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Top ornament */}
        <OrnamentDivider width={240} />

        <div style={{ margin: "28px 0 24px", filter: "drop-shadow(0 0 14px rgba(212,175,55,0.45))" }}>
          <HeartIcon />
        </div>

        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            fontStyle: "italic",
            fontSize: "clamp(1.05rem, 3.5vw, 1.2rem)",
            color: "rgba(245,230,200,0.62)",
            lineHeight: 1.9,
            letterSpacing: "0.05em",
            margin: "0 0 36px",
          }}
        >
          "Your presence and blessings<br />would mean the world to us."
        </p>

        <OrnamentDivider width={200} />

        <div style={{ marginTop: 28 }}>
          <p
            style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontWeight: 400,
              fontSize: "clamp(1.3rem, 5vw, 1.7rem)",
              letterSpacing: "0.06em",
              margin: "0 0 10px",
              lineHeight: 1.2,
              ...goldTextStyle,
              backgroundImage: goldGradient,
              filter: "drop-shadow(0 0 18px rgba(212,175,55,0.2))",
            }}
          >
            {'Rupesh'} &amp; {'Sreelakshmi'}
          </p>
          <p
            style={{
              fontFamily: "'Raleway', sans-serif",
              fontWeight: 200,
              fontSize: "0.65rem",
              letterSpacing: "0.48em",
              textTransform: "uppercase",
              color: "rgba(245, 200, 1, 0.76)",
              margin: "10px 0 0",
            }}
          >
            With love &amp; joy
          </p>
        </div>

        {/* Bottom ornamental dots */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 52 }}>
          {[
            { s: 2.5, o: 0.2 }, { s: 3.5, o: 0.38 }, { s: 5, o: 0.65 }, { s: 7, o: 1 },
            { s: 5, o: 0.65 }, { s: 3.5, o: 0.38 }, { s: 2.5, o: 0.2 },
          ].map(({ s, o }, i) => (
            <div key={i} style={{ width: s, height: s, borderRadius: "50%", background: GOLD, opacity: o }} />
          ))}
        </div>

        <p
          style={{
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 200,
            fontSize: "0.52rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(212,175,55,0.18)",
            marginTop: 32,
          }}
        >
          
        </p>
      </div>
    </section>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <main
      style={{
        background: BLACK,
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <GoldParticles count={140} />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
        }}
      >
        <HeroSection />
        <EventDetailsSection />
        <CountdownSection />
        <LocationSection />
        <ClosingSection />
      </div>
    </main>
  );
}
