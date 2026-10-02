import { handleConfig, sendNodeResponse } from "./_lib/sarvam.mjs";

/**
 * GET /api/config
 * @param {import("node:http").IncomingMessage} _req
 * @param {import("node:http").ServerResponse} res
 */
export default function handler(_req, res) {
  sendNodeResponse(res, handleConfig(process.env));
}
