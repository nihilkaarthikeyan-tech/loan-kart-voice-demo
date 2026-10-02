import { Controls } from "./components/Controls";
import { ErrorBanner } from "./components/ErrorBanner";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { StatusBadge } from "./components/StatusBadge";
import { VoiceOrb } from "./components/VoiceOrb";
import { useKavyaConversation } from "./hooks/useKavyaConversation";

const PHRASES = [
  { lang: "Tamil", text: "வீட்டுக் கடனுக்கு என்ன ஆவணங்கள் வேண்டும்?", tamil: true },
  { lang: "Tanglish", text: "Personal loan ku interest evlo?", tamil: false },
  { lang: "English", text: "Can I prepay my two-wheeler loan?", tamil: false },
];

const FACTS = [
  { label: "Tap once", detail: "No forms to fill" },
  { label: "Allow the mic", detail: "Your browser asks first" },
  { label: "Just talk", detail: "Interrupt any time" },
];

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
    <div className="kolam-ground relative flex min-h-full flex-col overflow-hidden">
      <Header />

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 pb-10 pt-4 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-10">
        {/* Message */}
        <section className="order-2 flex flex-col gap-7 text-center lg:order-1 lg:text-left">
          <p className="rise rise-2 text-xs font-bold uppercase tracking-[0.22em] text-saffron-400">
            Loan enquiries, spoken
          </p>

          <h1 className="rise rise-2">
            <span lang="ta" className="block font-tamil text-3xl font-bold leading-tight text-cream-100 sm:text-4xl lg:text-5xl">
              கடன் பற்றி பேசலாம்.
            </span>
            <span className="mt-3 block font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-cream-100 sm:text-5xl lg:text-6xl">
              Talk to Kavya about your loan,{" "}
              <span className="text-saffron-400">in your own words.</span>
            </span>
          </h1>

          <p className="rise rise-3 mx-auto max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg lg:mx-0">
            Kavya is LoanKart India's AI loan assistant. Ask about home, personal, vehicle or
            business loans in Tamil, Tanglish or English, and she answers the way a branch
            officer would.
          </p>

          <ul className="rise rise-4 flex flex-col gap-2 text-left" aria-label="Example questions you can ask">
            {PHRASES.map((p) => (
              <li
                key={p.lang}
                className="flex items-center gap-3 rounded-2xl border border-cream-100/10 bg-navy-900/60 px-4 py-3"
              >
                <span className="shrink-0 rounded-full bg-cream-100/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-cream-300">
                  {p.lang}
                </span>
                <span
                  lang={p.tamil ? "ta" : "en"}
                  className={`text-sm text-cream-100 sm:text-base ${p.tamil ? "font-tamil font-semibold" : "font-medium"}`}
                >
                  “{p.text}”
                </span>
              </li>
            ))}
          </ul>

          <ol className="rise rise-5 grid grid-cols-3 gap-3 text-left" aria-label="How it works">
            {FACTS.map((f, i) => (
              <li key={f.label} className="border-l-2 border-saffron-500/60 pl-3">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Step {i + 1}
                </span>
                <span className="block font-display text-sm font-bold text-cream-100 sm:text-base">{f.label}</span>
                <span className="block text-xs text-slate-400">{f.detail}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Call console */}
        <section
          aria-labelledby="kavya-heading"
          className="rise rise-3 order-1 flex w-full flex-col items-center gap-5 justify-self-center rounded-[2rem] border border-cream-100/10 bg-gradient-to-b from-navy-800/80 to-navy-900/80 px-6 py-8 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur sm:max-w-md sm:px-10 sm:py-10 lg:order-2"
        >
          <VoiceOrb status={status} isMuted={isMuted} levelRef={levelRef} />

          <div className="text-center">
            <h2 id="kavya-heading" className="font-display text-3xl font-extrabold tracking-tight text-cream-100">
              Kavya
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-400">AI Loan Assistant</p>
            <p className="mt-2 text-sm font-semibold text-saffron-400">
              Tamil <span aria-hidden="true" className="text-cream-100/30">•</span> Tanglish{" "}
              <span aria-hidden="true" className="text-cream-100/30">•</span> English
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

          <p className="max-w-xs text-center text-sm text-slate-400">
            {!isActive
              ? "Talk naturally with Kavya about your loan requirement."
              : "Speak naturally. You can interrupt Kavya at any time."}
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
