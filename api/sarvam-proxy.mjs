import { handleProxy, sendNodeResponse } from "./_lib/sarvam.mjs";

const PREFIX = "/api/sarvam/";

/**
 * GET /api/sarvam/<path>
 * Reached via the rewrite in vercel.json, which passes the remainder of the
 * path as the `path` query parameter and keeps the SDK's own query string.
 * @param {import("node:http").IncomingMessage} req
 * @param {import("node:http").ServerResponse} res
 */
export default async function handler(req, res) {
  const url = new URL(req.url ?? "/", "http://localhost");

  let path = url.searchParams.get("path") ?? "";
  url.searchParams.delete("path");
  if (!path && url.pathname.startsWith(PREFIX)) {
    path = url.pathname.slice(PREFIX.length);
  }

  const result = await handleProxy(process.env, req.method ?? "GET", path, url.search);
  sendNodeResponse(res, result);
}
