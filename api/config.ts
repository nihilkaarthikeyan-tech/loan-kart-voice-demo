import { handleConfig, toWebResponse } from "./_lib/sarvam";

export function GET(): Response {
  return toWebResponse(handleConfig(process.env));
}
