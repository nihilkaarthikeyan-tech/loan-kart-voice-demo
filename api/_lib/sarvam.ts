/**
 * Server-side helpers shared by the Vercel functions (api/*.ts) and the
 * Vite dev middleware (vite.config.ts).
 *
 * This is the ONLY place that touches SARVAM_API_KEY. Nothing here is ever
 * bundled into the browser.
 */

export const SARVAM_RUNTIME_BASE = "https://apps.sarvam.ai/api/app-runtime/";

export interface SarvamServerEnv {
  SARVAM_API_KEY?: string;
  SARVAM_ORG_ID?: string;
  SARVAM_WORKSPACE_ID?: string;
  SARVAM_APP_ID?: string;
  SARVAM_APP_VERSION?: string;
}

export interface SimpleResponse {
  status: number;
  body: string;
  headers: Record<string, string>;
}

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function json(status: number, data: unknown): SimpleResponse {
  return { status, body: JSON.stringify(data), headers: JSON_HEADERS };
}

/** Names of the env vars that are required but not set. */
export function missingServerConfig(env: SarvamServerEnv): string[] {
  const required: Array<keyof SarvamServerEnv> = [
    "SARVAM_API_KEY",
    "SARVAM_ORG_ID",
    "SARVAM_WORKSPACE_ID",
    "SARVAM_APP_ID",
  ];
  return required.filter((key) => !env[key] || !env[key]!.trim());
}

function parseVersion(raw: string | undefined): number | undefined {
  if (!raw || !raw.trim()) return undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/**
 * GET /api/config
 * Returns the non-secret identifiers the browser needs to address the
 * existing Kavya agent. The API key is never included.
 */
export function handleConfig(env: SarvamServerEnv): SimpleResponse {
  const missing = missingServerConfig(env);
  if (missing.length > 0) {
    console.error("[sarvam] Missing server configuration:", missing.join(", "));
    return json(503, { error: "not_configured", missing });
  }
  return json(200, {
    orgId: env.SARVAM_ORG_ID!.trim(),
    workspaceId: env.SARVAM_WORKSPACE_ID!.trim(),
    appId: env.SARVAM_APP_ID!.trim(),
    version: parseVersion(env.SARVAM_APP_VERSION) ?? null,
  });
}

/**
 * Only the signed-URL endpoint used by the SDK is allowed through:
 *   orgs/{org_id}/workspaces/{workspace_id}/apps/{app_id}/url
 */
const SIGNED_URL_PATH = /^orgs\/([^/]+)\/workspaces\/([^/]+)\/apps\/([^/]+)\/url$/;

/**
 * GET /api/sarvam/<path>?<query>
 * Forwards the SDK's signed-URL request to Sarvam with the API key injected.
 * The route is locked to the configured org/workspace/app so the key can
 * not be used to reach any other agent.
 */
export async function handleProxy(
  env: SarvamServerEnv,
  method: string,
  path: string,
  search: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SimpleResponse> {
  if (method !== "GET") {
    return json(405, { error: "method_not_allowed" });
  }

  const missing = missingServerConfig(env);
  if (missing.length > 0) {
    console.error("[sarvam] Missing server configuration:", missing.join(", "));
    return json(503, { error: "not_configured", missing });
  }

  const match = SIGNED_URL_PATH.exec(path.replace(/^\/+|\/+$/g, ""));
  if (!match) {
    return json(404, { error: "not_found" });
  }
  const [, orgId, workspaceId, appId] = match;
  if (
    orgId !== env.SARVAM_ORG_ID!.trim() ||
    workspaceId !== env.SARVAM_WORKSPACE_ID!.trim() ||
    appId !== env.SARVAM_APP_ID!.trim()
  ) {
    return json(403, { error: "forbidden" });
  }

  const upstream = `${SARVAM_RUNTIME_BASE}${match[0]}${search}`;

  let res: Response;
  try {
    res = await fetchImpl(upstream, {
      method: "GET",
      headers: { "X-API-Key": env.SARVAM_API_KEY!.trim() },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    console.error("[sarvam] Upstream request failed:", err);
    return json(502, { error: "upstream_unreachable" });
  }

  if (!res.ok) {
    // Log the detail server-side; send only the status to the browser.
    const detail = await res.text().catch(() => "");
    console.error(`[sarvam] Upstream responded ${res.status}: ${detail}`);
    return {
      status: res.status,
      body: JSON.stringify({ error: "upstream_error", status: res.status }),
      headers: {
        ...JSON_HEADERS,
        ...(res.headers.get("x-retry-after")
          ? { "x-retry-after": res.headers.get("x-retry-after")! }
          : {}),
      },
    };
  }

  const body = await res.text();
  return { status: 200, body, headers: JSON_HEADERS };
}

/** Adapter: SimpleResponse -> Web Response (Vercel web handlers). */
export function toWebResponse(r: SimpleResponse): Response {
  return new Response(r.body, { status: r.status, headers: r.headers });
}
