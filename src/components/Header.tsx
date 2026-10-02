export function Header() {
  return (
    <header className="flex items-center justify-between px-5 py-4 sm:px-8">
      <a href="/" className="flex items-center gap-3 rounded-lg" aria-label="LoanKart India home">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-saffron-400 to-saffron-600 text-lg font-extrabold text-navy-950 shadow-lg shadow-saffron-500/30"
        >
          L
        </span>
        <span className="leading-tight">
          <span className="block text-base font-extrabold tracking-wide text-white sm:text-lg">
            LOANKART <span className="text-saffron-400">INDIA</span>
          </span>
          <span className="block text-xs font-medium text-white/60">AI Loan Assistant</span>
        </span>
      </a>
      <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 sm:flex">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-teal-400" />
        Secure &amp; private
      </span>
    </header>
  );
}
