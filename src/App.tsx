import { Controls } from "./components/Controls";
import { ErrorBanner } from "./components/ErrorBanner";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { StatusBadge } from "./components/StatusBadge";
import { VoiceOrb } from "./components/VoiceOrb";
import { useKavyaConversation } from "./hooks/useKavyaConversation";

export default function App() {
  const {
    status,
    error,
    errorDetail,
    isMuted,
    isActive,
    levelRef,
    start,
    end,
    reset,
    toggleMute,
  } = useKavyaConversation();

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-navy-950">
      {/* Background accents */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-navy-700/60 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-saffron-600/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-full flex-1 flex-col">
        <Header />

        <main className="flex flex-1 flex-col items-center justify-center px-5 py-6 text-center sm:px-8">
          <section
            aria-labelledby="kavya-heading"
            className="flex w-full max-w-lg flex-col items-center gap-6 rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-8 shadow-2xl shadow-black/40 backdrop-blur sm:px-10 sm:py-10"
          >
            <VoiceOrb status={status} isMuted={isMuted} levelRef={levelRef} />

            <div>
              <h1 id="kavya-heading" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Kavya
              </h1>
              <p className="mt-1 text-base font-semibold text-white/70">AI Loan Assistant</p>
              <p className="mt-3 text-sm font-medium text-saffron-400">
                Tamil <span aria-hidden="true">•</span> Tanglish <span aria-hidden="true">•</span> English
              </p>
            </div>

            <StatusBadge status={status} isMuted={isMuted} />

            {error && <ErrorBanner code={error} devDetail={errorDetail} onDismiss={reset} />}

            <Controls
              status={status}
              isMuted={isMuted}
              onStart={() => void start()}
              onEnd={() => void end()}
              onToggleMute={toggleMute}
            />

            {!isActive ? (
              <p className="max-w-sm text-sm text-white/60">
                Talk naturally with Kavya about your loan requirement.
                <span className="block mt-1">
                  Your browser will ask for microphone access when you start.
                </span>
              </p>
            ) : (
              <p className="max-w-sm text-sm text-white/60">
                Speak naturally. You can interrupt Kavya at any time.
              </p>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
