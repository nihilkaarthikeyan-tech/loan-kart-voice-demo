/**
 * Thin service layer around the official Sarvam Web SDK.
 *
 * - Fetches the agent identifiers from OUR backend (/api/config).
 * - Creates a ConversationAgent that talks to OUR proxy (/api/sarvam/).
 * - The browser never holds a Sarvam API key: `apiKey` is intentionally "".
 */
import {
  AgentState,
  BrowserAudioInterface,
  ConversationAgent,
  InteractionType,
  type AudioLevel,
  type ServerEventBase,
} from "sarvam-conv-ai-sdk/browser";
import { KavyaError } from "../lib/errors";

export { AgentState };

export interface KavyaConfig {
  orgId: string;
  workspaceId: string;
  appId: string;
  version: number | null;
}

export const SAMPLE_RATE = 16000;
export const PROXY_BASE_URL = "/api/sarvam/";

export async function fetchKavyaConfig(): Promise<KavyaConfig> {
  let res: Response;
  try {
    res = await fetch("/api/config", { cache: "no-store" });
  } catch (err) {
    throw new KavyaError(navigator.onLine === false ? "offline" : "connect_failed", err);
  }
  if (res.status === 503) {
    const body = (await res.json().catch(() => ({}))) as { missing?: string[] };
    const missing = body.missing?.length ? body.missing.join(", ") : "unknown";
    throw new KavyaError(
      "not_configured",
      undefined,
      `Server is missing environment variables: ${missing}. Fill them in .env (local) or Vercel settings.`,
    );
  }
  if (!res.ok) throw new KavyaError("connect_failed", new Error(`config ${res.status}`));

  const data = (await res.json()) as Partial<KavyaConfig>;
  if (!data.orgId || !data.workspaceId || !data.appId) {
    throw new KavyaError("not_configured");
  }
  return {
    orgId: data.orgId,
    workspaceId: data.workspaceId,
    appId: data.appId,
    version: typeof data.version === "number" ? data.version : null,
  };
}

/** A stable anonymous identifier for this browser (used for Sarvam analytics only). */
export function getUserIdentifier(): string {
  const KEY = "loankart_visitor_id";
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const fresh = `web-${crypto.randomUUID()}`;
    localStorage.setItem(KEY, fresh);
    return fresh;
  } catch {
    return `web-${Date.now()}`;
  }
}

export interface AgentCallbacks {
  onState: (state: AgentState) => void;
  onLevel: (level: AudioLevel) => void;
  onEvent: (event: ServerEventBase) => void;
  onEnd: () => void;
}

export function createKavyaAgent(config: KavyaConfig, cb: AgentCallbacks): ConversationAgent {
  const audioInterface = new BrowserAudioInterface(SAMPLE_RATE, {
    // Phones are often quiet at 1.0; the SDK recommends 1.5-2.0 on mobile.
    outputGain: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 1.6 : 1.0,
  });

  return new ConversationAgent({
    apiKey: "", // Injected server-side by /api/sarvam/* - never in the browser.
    baseUrl: PROXY_BASE_URL,
    platform: "browser",
    config: {
      org_id: config.orgId,
      workspace_id: config.workspaceId,
      app_id: config.appId,
      // Omitting `version` makes Sarvam use the latest COMMITTED version.
      ...(config.version ? { version: config.version } : {}),
      user_identifier: getUserIdentifier(),
      user_identifier_type: "custom",
      interaction_type: InteractionType.CALL,
      input_sample_rate: SAMPLE_RATE,
      output_sample_rate: SAMPLE_RATE,
    },
    audioInterface,
    stateCallback: (state) => cb.onState(state),
    audioLevelCallback: (level) => cb.onLevel(level),
    eventCallback: async (event) => cb.onEvent(event),
    endCallback: async () => cb.onEnd(),
  });
}
