import type { ConversationStatus } from "../hooks/useKavyaConversation";

const LABELS: Record<ConversationStatus, string> = {
  idle: "Ready to help",
  connecting: "Connecting…",
  listening: "Kavya is listening…",
  user_speaking: "Listening…",
  speaking: "Kavya is speaking…",
  ended: "Conversation ended",
};

const DOT: Record<ConversationStatus, string> = {
  idle: "bg-teal-400",
  connecting: "bg-cream-100/70 animate-pulse",
  listening: "bg-teal-400 animate-pulse",
  user_speaking: "bg-teal-400",
  speaking: "bg-saffron-400",
  ended: "bg-cream-100/40",
};

export function StatusBadge({ status, isMuted }: { status: ConversationStatus; isMuted: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-10 flex-wrap items-center justify-center gap-2 text-base font-semibold text-cream-100"
    >
      <span className="flex items-center gap-2 rounded-full border border-cream-100/10 bg-navy-950/60 px-4 py-2">
        <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${DOT[status]}`} />
        {LABELS[status]}
      </span>
      {isMuted && (
        <span className="rounded-full border border-coral-500/50 bg-coral-500/15 px-3 py-2 text-sm text-coral-500">
          Microphone muted
        </span>
      )}
    </div>
  );
}
