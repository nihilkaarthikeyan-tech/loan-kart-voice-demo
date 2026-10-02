import { ERROR_MESSAGES, type ErrorCode } from "../lib/errors";

interface Props {
  code: ErrorCode;
  /** Developer detail; rendered only in local dev builds, never in production. */
  devDetail?: string | null;
  onDismiss: () => void;
}

export function ErrorBanner({ code, devDetail, onDismiss }: Props) {
  const { title, detail } = ERROR_MESSAGES[code];
  const showDev = import.meta.env.DEV && !!devDetail;
  return (
    <div
      role="alert"
      className="flex w-full max-w-md items-start gap-3 rounded-2xl border border-coral-500/40 bg-coral-500/10 p-4 text-left"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-6 w-6 shrink-0 text-coral-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </svg>
      <div className="flex-1">
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm text-white/75">{detail}</p>
        {showDev && (
          <p className="mt-2 rounded-lg bg-black/30 p-2 font-mono text-xs text-saffron-400 break-words">
            DEV ONLY: {devDetail}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss message"
        className="-m-1 rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
