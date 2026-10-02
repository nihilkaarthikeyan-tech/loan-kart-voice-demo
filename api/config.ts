import { handleConfig, toWebResponse } from "./_lib/sarvam.js";

export function GET(): Response {
  return toWebResponse(handleConfig(process.env));
}
