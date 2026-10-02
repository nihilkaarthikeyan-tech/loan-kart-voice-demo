/**
 * Maps every failure we know about to a stable code plus a friendly,
 * customer-facing message. Raw SDK / HTTP details are logged to the console
 * for developers but never shown in the UI.
 */

export type ErrorCode =
  | "unsupported_browser"
  | "mic_denied"
  | "mic_not_found"
  | "mic_in_use"
  | "not_configured"
  | "offline"
  | "timeout"
  | "connect_failed"
  | "connection_lost";

export const ERROR_MESSAGES: Record<ErrorCode, { title: string; detail: string }> = {
  unsupported_browser: {
    title: "This browser can't make voice calls",
    detail: "Please open this page in a recent version of Chrome, Safari, Edge or Firefox.",
  },
  mic_denied: {
    title: "Microphone access is required to start the conversation.",
    detail:
      "Tap the lock or site-settings icon next to the address bar, allow the microphone, then try again.",
  },
  mic_not_found: {
    title: "No microphone was found",
    detail: "Please connect or enable a microphone and try again.",
  },
  mic_in_use: {
    title: "Your microphone is busy",
    detail: "Another app or tab may be using it. Close that app and try again.",
  },
  not_configured: {
    title: "Kavya is not available right now",
    detail:
      "The voice assistant hasn't been set up on this site yet. Please contact LoanKart India support.",
  },
  offline: {
    title: "You appear to be offline",
    detail: "Please check your internet connection and try again.",
  },
  timeout: {
    title: "Connecting to Kavya is taking too long",
    detail: "Please check your internet connection and try again.",
  },
  connect_failed: {
    title: "Unable to connect to Kavya right now. Please try again.",
    detail: "If this keeps happening, please contact LoanKart India support.",
  },
  connection_lost: {
    title: "The connection to Kavya was lost",
    detail: "Please check your internet connection and start a new conversation.",
  },
};

export class KavyaError extends Error {
  readonly code: ErrorCode;
  /** Developer-facing detail (e.g. missing env vars). Shown only in dev builds. */
  readonly devDetail?: string;
  constructor(code: ErrorCode, cause?: unknown, devDetail?: string) {
    super(ERROR_MESSAGES[code].title, { cause });
    this.name = "KavyaError";
    this.code = code;
    this.devDetail = devDetail;
  }
}

/** Developer hint for an error, if any. */
export function devDetailOf(err: unknown): string | undefined {
  if (err instanceof KavyaError) return err.devDetail;
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  return undefined;
}

/** Translate a browser getUserMedia error into one of our codes. */
export function classifyMicError(err: unknown): ErrorCode {
  const name = err instanceof Error ? err.name : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "mic_denied";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return "mic_not_found";
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return "mic_in_use";
    default:
      return "mic_denied";
  }
}

/** Translate an SDK start()/connect failure into one of our codes. */
export function classifyConnectError(err: unknown): ErrorCode {
  if (err instanceof KavyaError) return err.code;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";

  const status =
    typeof err === "object" && err !== null && "statusCode" in err
      ? Number((err as { statusCode?: number }).statusCode)
      : undefined;
  if (status === 503) return "not_configured";

  // 401/403/404/5xx, "no committed version", invalid JSON etc. all collapse
  // into one friendly message. Details are in the console for developers.
  return "connect_failed";
}
