import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { handleConfig, handleProxy, missingServerConfig } from "./api/_lib/sarvam.mjs";

/**
 * Local-development stand-in for the Vercel functions in /api.
 * It reads SARVAM_* from `.env` on the Node side only, so the API key never
 * reaches the browser bundle. In production, Vercel serves /api/* itself and
 * this plugin is not part of the build output.
 */
function devApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: "loankart-dev-api",
    apply: "serve",
    configureServer(server) {
      const missing = missingServerConfig(env);
      if (missing.length > 0) {
        server.config.logger.warn(
          `\n[loankart] Kavya is NOT configured. Missing in .env: ${missing.join(", ")}\n` +
            `[loankart] Copy .env.example to .env and fill in the values, then restart npm run dev.\n`,
        );
      } else {
        server.config.logger.info(
          `[loankart] Sarvam config loaded (org ${env.SARVAM_ORG_ID}, app ${env.SARVAM_APP_ID}, ` +
            `version ${env.SARVAM_APP_VERSION?.trim() || "latest committed"}). API key stays server-side.`,
        );
      }
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        let result;
        if (url.pathname === "/api/config") {
          result = handleConfig(env);
        } else if (url.pathname.startsWith("/api/sarvam/")) {
          result = await handleProxy(
            env,
            req.method ?? "GET",
            url.pathname.slice("/api/sarvam/".length),
            url.search,
          );
        } else {
          return next();
        }
        res.writeHead(result.status, result.headers);
        res.end(result.body);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Third argument "" loads every variable (not only VITE_*) for server use.
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), devApiPlugin(env)],
    server: { port: 5173 },
  };
});
