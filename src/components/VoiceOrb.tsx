import { useEffect, useRef, type RefObject } from "react";
import type { ConversationStatus } from "../hooks/useKavyaConversation";

interface Props {
  status: ConversationStatus;
  isMuted: boolean;
  levelRef: RefObject<number>;
}

/**
 * Kolam voice orb. Concentric dotted rings, drawn the way a kolam is laid
 * out in rice flour, surround a glowing core. The rings turn and brighten
 * with the live audio level. Purely decorative: StatusBadge carries the
 * accessible state text.
 */
export function VoiceOrb({ status, isMuted, levelRef }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const live = status === "listening" || status === "user_speaking" || status === "speaking";

  // Drive --level from the audio level without re-rendering React.
  useEffect(() => {
    if (!live) {
      rootRef.current?.style.setProperty("--level", "0");
      return;
    }
    let frame = 0;
    let smoothed = 0;
    const tick = () => {
      const target = levelRef.current ?? 0;
      smoothed += (target - smoothed) * 0.22;
      rootRef.current?.style.setProperty("--level", smoothed.toFixed(3));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [live, levelRef]);

  const tone =
    status === "speaking"
      ? { ring: "#ffbe4d", core: "url(#coreSaffron)", glow: "rgba(245,166,35,0.45)" }
      : status === "user_speaking"
        ? { ring: "#4ddbcd", core: "url(#coreTeal)", glow: "rgba(46,196,182,0.40)" }
        : status === "connecting"
          ? { ring: "#8da2c0", core: "url(#coreNavy)", glow: "rgba(141,162,192,0.25)" }
          : { ring: "#8da2c0", core: "url(#coreNavy)", glow: "rgba(33,77,128,0.45)" };

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="relative grid h-64 w-64 place-items-center sm:h-72 sm:w-72"
      style={{ "--level": 0 } as React.CSSProperties}
    >
      {/* Glow */}
      <div
        className="absolute inset-8 rounded-full blur-2xl transition-colors duration-700"
        style={{
          background: tone.glow,
          transform: "scale(calc(1 + var(--level) * 0.35))",
        }}
      />

      {live && (
        <>
          <span
            className="absolute inset-10 rounded-full border-2 animate-pulse-ring"
            style={{ borderColor: tone.ring }}
          />
          <span
            className="absolute inset-10 rounded-full border-2 animate-pulse-ring"
            style={{ borderColor: tone.ring, animationDelay: "1.2s" }}
          />
        </>
      )}

      {/* Kolam rings */}
      <svg viewBox="0 0 320 320" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="coreNavy" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#2a5d95" />
            <stop offset="100%" stopColor="#0d2747" />
          </radialGradient>
          <radialGradient id="coreSaffron" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffd07a" />
            <stop offset="100%" stopColor="#d98c0f" />
          </radialGradient>
          <radialGradient id="coreTeal" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#7fe8dd" />
            <stop offset="100%" stopColor="#178f85" />
          </radialGradient>
        </defs>

        <g
          className={live ? "animate-turn" : ""}
          style={{ transformOrigin: "160px 160px", opacity: "calc(0.6 + var(--level) * 0.4)" }}
        >
          <circle cx="160" cy="160" r="150" fill="none" stroke={tone.ring} strokeWidth="2.2"
            strokeLinecap="round" strokeDasharray="0 15.7" className="transition-colors duration-700" />
          <circle cx="160" cy="160" r="128" fill="none" stroke={tone.ring} strokeWidth="2.6"
            strokeLinecap="round" strokeDasharray="0 20.1" className="transition-colors duration-700" />
        </g>
        <g
          className={live ? "animate-turn-reverse" : ""}
          style={{ transformOrigin: "160px 160px", opacity: "calc(0.5 + var(--level) * 0.5)" }}
        >
          <circle cx="160" cy="160" r="106" fill="none" stroke={tone.ring} strokeWidth="3"
            strokeLinecap="round" strokeDasharray="0 27.7" className="transition-colors duration-700" />
          <circle cx="160" cy="160" r="86" fill="none" stroke={tone.ring} strokeWidth="1.5"
            strokeDasharray="4 8" opacity="0.6" className="transition-colors duration-700" />
        </g>

        {/* Core */}
        <g style={{ transformOrigin: "160px 160px", transform: "scale(calc(1 + var(--level) * 0.14))" }}
          className={status === "idle" ? "animate-breathe" : ""}>
          <circle cx="160" cy="160" r="64" fill={tone.core} className="transition-all duration-700" />
          <circle cx="160" cy="160" r="64" fill="none" stroke="rgba(248,241,228,0.18)" strokeWidth="1.5" />
        </g>
      </svg>

      {/* Icon layer */}
      <div className="relative grid h-32 w-32 place-items-center">
        {status === "connecting" && (
          <span className="h-14 w-14 rounded-full border-4 border-cream-100/20 border-t-cream-100 animate-spin" />
        )}
        {status === "speaking" && <WaveBars />}
        {(status === "listening" || status === "user_speaking") && (
          <MicIcon muted={isMuted} className="h-14 w-14 text-cream-100 drop-shadow-lg" />
        )}
        {(status === "idle" || status === "ended") && (
          <MicIcon muted={false} className="h-14 w-14 text-cream-100/90" />
        )}
      </div>
    </div>
  );
}

function WaveBars() {
  return (
    <div className="flex h-14 items-center gap-1.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="wave-bar block h-12 w-2.5 rounded-full bg-navy-950/80"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}

function MicIcon({ muted, className }: { muted: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3M8 21h8" />
      {muted && <path d="M4 4l16 16" strokeWidth="2.4" />}
    </svg>
  );
}
