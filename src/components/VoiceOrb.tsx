import { useEffect, useRef, type RefObject } from "react";
import type { ConversationStatus } from "../hooks/useKavyaConversation";

interface Props {
  status: ConversationStatus;
  isMuted: boolean;
  levelRef: RefObject<number>;
}

/**
 * Decorative, animated voice indicator. Purely visual: the textual status
 * next to it (StatusBadge) is what screen readers announce.
 */
export function VoiceOrb({ status, isMuted, levelRef }: Props) {
  const coreRef = useRef<HTMLDivElement>(null);
  const live = status === "listening" || status === "user_speaking" || status === "speaking";

  // Drive the orb's scale from the live audio level without re-rendering React.
  useEffect(() => {
    if (!live) {
      coreRef.current?.style.setProperty("--level", "0");
      return;
    }
    let frame = 0;
    let smoothed = 0;
    const tick = () => {
      const target = levelRef.current ?? 0;
      smoothed += (target - smoothed) * 0.25;
      coreRef.current?.style.setProperty("--level", smoothed.toFixed(3));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [live, levelRef]);

  const ringColor =
    status === "speaking"
      ? "bg-saffron-400"
      : status === "user_speaking"
        ? "bg-teal-400"
        : "bg-white";

  const gradient =
    status === "speaking"
      ? "from-saffron-400 via-saffron-500 to-saffron-600"
      : status === "user_speaking"
        ? "from-teal-400 via-teal-500 to-navy-600"
        : status === "connecting"
          ? "from-navy-600 via-navy-700 to-navy-800"
          : "from-navy-600 via-navy-700 to-navy-900";

  return (
    <div
      aria-hidden="true"
      className="relative grid h-56 w-56 place-items-center sm:h-64 sm:w-64"
      style={{ "--level": 0 } as React.CSSProperties}
    >
      {live && (
        <>
          <span className={`absolute inset-6 rounded-full ${ringColor} opacity-30 animate-pulse-ring`} />
          <span
            className={`absolute inset-6 rounded-full ${ringColor} opacity-30 animate-pulse-ring`}
            style={{ animationDelay: "1.2s" }}
          />
        </>
      )}

      {/* Outer glow */}
      <span
        className={`absolute inset-4 rounded-full bg-gradient-to-br ${gradient} opacity-40 blur-2xl transition-opacity duration-500`}
      />

      {/* Core */}
      <div
        ref={coreRef}
        className={`relative grid h-40 w-40 place-items-center rounded-full bg-gradient-to-br ${gradient} shadow-2xl shadow-black/50 ring-4 ring-white/10 transition-[background] duration-500 sm:h-44 sm:w-44 ${status === "idle" ? "animate-float" : ""}`}
        style={{ transform: "scale(calc(1 + var(--level) * 0.18))" }}
      >
        {status === "connecting" && (
          <span className="h-16 w-16 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        )}

        {status === "speaking" && <WaveBars />}

        {(status === "listening" || status === "user_speaking") && (
          <MicIcon muted={isMuted} className="h-16 w-16 text-white drop-shadow" />
        )}

        {(status === "idle" || status === "ended") && (
          <MicIcon muted={false} className="h-16 w-16 text-white/90" />
        )}
      </div>
    </div>
  );
}

function WaveBars() {
  return (
    <div className="flex h-16 items-center gap-1.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="wave-bar block h-14 w-2.5 rounded-full bg-navy-950/80"
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
