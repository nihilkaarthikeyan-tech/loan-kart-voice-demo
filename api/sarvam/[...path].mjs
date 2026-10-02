import { handleProxy, sendNodeResponse } from "../_lib/sarvam.mjs";

const PREFIX = "/api/sarvam/";

/**
 * GET /api/sarvam/<path>
 * @param {import("node:http").IncomingMessage} req
 * @param {import("node:http").ServerResponse} res
 */
export default async function handler(req, res) {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname.startsWith(PREFIX)
    ? url.pathname.slice(PREFIX.length)
    : url.pathname;
  const result = await handleProxy(process.env, req.method ?? "GET", path, url.search);
  sendNodeResponse(res, result);
}
