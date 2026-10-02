import type { ConversationStatus } from "../hooks/useKavyaConversation";

interface Props {
  status: ConversationStatus;
  isMuted: boolean;
  onStart: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
}

const base =
  "inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-7 text-base font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

export function Controls({ status, isMuted, onStart, onEnd, onToggleMute }: Props) {
  if (status === "idle" || status === "ended") {
    return (
      <button
        type="button"
        onClick={onStart}
        className={`${base} w-full max-w-xs bg-gradient-to-r from-saffron-400 to-saffron-500 text-navy-950 shadow-lg shadow-saffron-500/30 hover:from-saffron-400 hover:to-saffron-400`}
      >
        <MicGlyph />
        {status === "ended" ? "Start a new conversation" : "Start Conversation"}
      </button>
    );
  }

  const connecting = status === "connecting";

  return (
    <div className="flex w-full max-w-xs flex-col gap-3 sm:max-w-md sm:flex-row">
      <button
        type="button"
        onClick={onToggleMute}
        disabled={connecting}
        aria-pressed={isMuted}
        aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        className={`${base} flex-1 border-2 ${
          isMuted
            ? "border-coral-500 bg-coral-500/15 text-white"
            : "border-white/25 bg-white/5 text-white hover:bg-white/10"
        }`}
      >
        <MicGlyph muted={isMuted} />
        {isMuted ? "Unmute" : "Mute"}
      </button>
      <button
        type="button"
        onClick={onEnd}
        className={`${base} flex-1 bg-coral-500 text-white shadow-lg shadow-coral-500/30 hover:bg-[#ff5252]`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M3.6 14.4a1.5 1.5 0 0 1-.3-1.9c4.9-6.9 12.5-6.9 17.4 0a1.5 1.5 0 0 1-.3 1.9l-2.1 1.8a1.5 1.5 0 0 1-2 0l-1.4-1.3a1.5 1.5 0 0 1-.4-1.5l.3-1.1a9 9 0 0 0-5.6 0l.3 1.1a1.5 1.5 0 0 1-.4 1.5l-1.4 1.3a1.5 1.5 0 0 1-2 0z" />
        </svg>
        End Conversation
      </button>
    </div>
  );
}

function MicGlyph({ muted = false }: { muted?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      {muted && <path d="M4 4l16 16" />}
    </svg>
  );
}
