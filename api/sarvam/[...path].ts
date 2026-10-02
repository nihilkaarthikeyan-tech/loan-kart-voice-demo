import { handleProxy, toWebResponse } from "../_lib/sarvam";

const PREFIX = "/api/sarvam/";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.startsWith(PREFIX)
    ? url.pathname.slice(PREFIX.length)
    : url.pathname;
  const result = await handleProxy(process.env, "GET", path, url.search);
  return toWebResponse(result);
}
