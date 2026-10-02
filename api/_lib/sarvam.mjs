/**
 * Server-side helpers shared by the Vercel functions (api/*.mjs) and the
 * Vite dev middleware (vite.config.ts).
 *
 * This is the ONLY place that touches SARVAM_API_KEY. Nothing here is ever
 * bundled into the browser. Plain ESM JavaScript so Vercel runs it as-is.
 */

export const SARVAM_RUNTIME_BASE = "https://apps.sarvam.ai/api/app-runtime/";

/**
 * @typedef {Object} SarvamServerEnv
 * @property {string} [SARVAM_API_KEY]
 * @property {string} [SARVAM_ORG_ID]
 * @property {string} [SARVAM_WORKSPACE_ID]
 * @property {string} [SARVAM_APP_ID]
 * @property {string} [SARVAM_APP_VERSION]
 */

/**
 * @typedef {Object} SimpleResponse
 * @property {number} status
 * @property {string} body
 * @property {Record<string, string>} headers
 */

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

/**
 * @param {number} status
 * @param {unknown} data
 * @returns {SimpleResponse}
 */
function json(status, data) {
  return { status, body: JSON.stringify(data), headers: JSON_HEADERS };
}

/**
 * Names of the env vars that are required but not set.
 * @param {SarvamServerEnv} env
 * @returns {string[]}
 */
export function missingServerConfig(env) {
  const required = ["SARVAM_API_KEY", "SARVAM_ORG_ID", "SARVAM_WORKSPACE_ID", "SARVAM_APP_ID"];
  return required.filter((key) => {
    const value = /** @type {Record<string, string | undefined>} */ (env)[key];
    return !value || !value.trim();
  });
}

/**
 * @param {string | undefined} raw
 * @returns {number | undefined}
 */
function parseVersion(raw) {
  if (!raw || !raw.trim()) return undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/**
 * GET /api/config
 * Returns the non-secret identifiers the browser needs to address the
 * existing Kavya agent. The API key is never included.
 * @param {SarvamServerEnv} env
 * @returns {SimpleResponse}
 */
export function handleConfig(env) {
  const missing = missingServerConfig(env);
  if (missing.length > 0) {
    console.error("[sarvam] Missing server configuration:", missing.join(", "));
    return json(503, { error: "not_configured", missing });
  }
  return json(200, {
    orgId: /** @type {string} */ (env.SARVAM_ORG_ID).trim(),
    workspaceId: /** @type {string} */ (env.SARVAM_WORKSPACE_ID).trim(),
    appId: /** @type {string} */ (env.SARVAM_APP_ID).trim(),
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
 * @param {SarvamServerEnv} env
 * @param {string} method
 * @param {string} path
 * @param {string} search
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<SimpleResponse>}
 */
export async function handleProxy(env, method, path, search, fetchImpl = fetch) {
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
    orgId !== /** @type {string} */ (env.SARVAM_ORG_ID).trim() ||
    workspaceId !== /** @type {string} */ (env.SARVAM_WORKSPACE_ID).trim() ||
    appId !== /** @type {string} */ (env.SARVAM_APP_ID).trim()
  ) {
    return json(403, { error: "forbidden" });
  }

  const upstream = `${SARVAM_RUNTIME_BASE}${match[0]}${search}`;

  /** @type {Response} */
  let res;
  try {
    res = await fetchImpl(upstream, {
      method: "GET",
      headers: { "X-API-Key": /** @type {string} */ (env.SARVAM_API_KEY).trim() },
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
    const retryAfter = res.headers.get("x-retry-after");
    return {
      status: res.status,
      body: JSON.stringify({ error: "upstream_error", status: res.status }),
      headers: retryAfter ? { ...JSON_HEADERS, "x-retry-after": retryAfter } : JSON_HEADERS,
    };
  }

  const body = await res.text();
  return { status: 200, body, headers: JSON_HEADERS };
}

/**
 * Adapter: write a SimpleResponse to a Node.js / Vercel response object.
 * @param {import("node:http").ServerResponse} res
 * @param {SimpleResponse} r
 */
export function sendNodeResponse(res, r) {
  res.writeHead(r.status, r.headers);
  res.end(r.body);
}
