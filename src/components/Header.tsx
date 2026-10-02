export function Header() {
  return (
    <header className="rise rise-1 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
      <a href="/" className="flex items-center gap-3 rounded-lg" aria-label="LoanKart India home">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-saffron-300 to-saffron-600 font-display text-lg font-extrabold text-navy-950 shadow-lg shadow-saffron-500/30"
        >
          L
        </span>
        <span className="leading-tight">
          <span className="block font-display text-base font-bold tracking-wide text-cream-100 sm:text-lg">
            LOANKART <span className="text-saffron-400">INDIA</span>
          </span>
          <span className="block text-xs font-medium text-slate-400">AI Loan Assistant</span>
        </span>
      </a>
      <span className="flex items-center gap-2 rounded-full border border-cream-100/10 bg-cream-100/5 px-3 py-1.5 text-xs font-semibold text-cream-300">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-teal-400" />
        <span className="hidden sm:inline">Available</span> 24×7
      </span>
    </header>
  );
}
