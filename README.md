# LoanKart India – Kavya voice demo

A branded, browser-based voice interface for **Kavya**, LoanKart India's existing AI loan
assistant (Tamil • Tanglish • English). The agent itself lives in Sarvam Voice Agents; this
project is only the customer-facing web page plus a tiny serverless proxy that keeps the Sarvam
API key on the server.

```
Browser  ──GET /api/config──────────▶  Vercel function  (returns org/workspace/app IDs)
Browser  ──GET /api/sarvam/…/url────▶  Vercel function  ──X-API-Key──▶  apps.sarvam.ai (signed WS URL)
Browser  ◀══════ WebSocket audio ═════════════════════════════════════▶  Sarvam voice runtime
```

The official SDK (`sarvam-conv-ai-sdk/browser`) makes one HTTP call to obtain a short-lived
signed WebSocket URL, then streams audio directly to Sarvam over that URL. Only that one HTTP
call goes through our proxy, so no WebSocket proxying is needed and the API key never leaves the
server.

---

## 1. Install

Requirements: Node.js 20 or newer, npm 10 or newer.

```bash
git clone <your-repo-url> loan-kart-voice-demo
cd loan-kart-voice-demo
npm install
```

`.npmrc` sets `legacy-peer-deps=true` because the SDK declares `node` as a peer dependency, which
would otherwise make npm download the unrelated `node` npm package.

## 2. Run locally

```bash
cp .env.example .env     # then fill in the values (see section 4)
npm run dev              # http://localhost:5173
```

`npm run dev` serves the UI **and** the two API routes (`/api/config`, `/api/sarvam/*`) through
a small Vite middleware, so you do not need the Vercel CLI for local development. Vite reads
`.env` on the Node side only; because none of the variables start with `VITE_`, none of them are
bundled into the browser.

Other scripts:

```bash
npm run build    # type-check (tsc -b) + production build into dist/
npm run preview  # serve dist/ locally (API routes are NOT available in preview; use dev or Vercel)
npm run lint     # oxlint
```

## 3. Create Sarvam credentials

1. Sign in to the Sarvam Voice Agents dashboard at <https://dashboard.sarvam.ai> with the account
   that owns the Kavya agent.
2. Open **Settings → API Key** and create (or rotate) a key, as described at
   <https://docs.sarvam.ai/conversations/settings/api-key>. This is `SARVAM_API_KEY`.
   Treat it like a password: server-side only, never in the browser, never committed.
3. Collect the three identifiers of the existing Kavya agent (section 9 below).

## 4. Required environment variables

All variables are **server-side only**. Put them in `.env` locally and in Vercel's project
settings in production. Never commit `.env`.

| Variable              | Required | Secret | Where it is used                                      |
| --------------------- | -------- | ------ | ----------------------------------------------------- |
| `SARVAM_API_KEY`      | yes      | **yes**| `api/_lib/sarvam.mjs` – injected as `X-API-Key` header |
| `SARVAM_ORG_ID`       | yes      | no     | returned by `/api/config`; proxy is locked to it      |
| `SARVAM_WORKSPACE_ID` | yes      | no     | returned by `/api/config`; proxy is locked to it      |
| `SARVAM_APP_ID`       | yes      | no     | returned by `/api/config`; proxy is locked to it      |
| `SARVAM_APP_VERSION`  | no       | no     | leave empty to use the latest **committed** version   |

There are intentionally **no `VITE_*` variables**. If you ever see `VITE_SARVAM_API_KEY`
anywhere, delete it: Vite would ship it to every visitor.

If any required variable is missing, the UI shows "Kavya is not available right now" instead of
crashing, and the server logs which variables are missing.

## 5. Deploy to Vercel

### Option A – Vercel dashboard (recommended)

1. Push the repository to GitHub (section 6).
2. Go to <https://vercel.com/new>, import the repository.
   Framework preset: **Vite** (auto-detected). Build command `npm run build`, output `dist`.
3. Under **Environment Variables** add the four `SARVAM_*` values from section 4
   (and optionally `SARVAM_APP_VERSION`). Apply them to Production and Preview.
4. Click **Deploy**. Vercel builds the UI and automatically turns `api/config.mjs` and
   `api/sarvam-proxy.mjs` into serverless functions.
5. Open the deployment URL (`https://<project>.vercel.app`) and click **Start Conversation**.

### Option B – Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env add SARVAM_API_KEY production
vercel env add SARVAM_ORG_ID production
vercel env add SARVAM_WORKSPACE_ID production
vercel env add SARVAM_APP_ID production
vercel --prod
```

After changing environment variables in Vercel, redeploy for them to take effect.

## 6. GitHub

```bash
cd loan-kart-voice-demo
git init
git add .
git status                       # confirm .env is NOT listed (only .env.example)
git commit -m "LoanKart India Kavya voice demo"
git branch -M main
git remote add origin https://github.com/<your-user>/loan-kart-voice-demo.git
git push -u origin main
```

## 7. How the existing Kavya agent is connected

`src/services/kavyaAgent.ts` creates the SDK agent exactly as Sarvam's docs describe for a
proxied setup:

```ts
new ConversationAgent({
  apiKey: "",                 // empty on purpose – the proxy adds it
  baseUrl: "/api/sarvam/",    // our Vercel function
  platform: "browser",
  config: {
    org_id, workspace_id, app_id,   // from GET /api/config
    // version omitted => latest COMMITTED version of Kavya
    user_identifier: "<anonymous per-browser id>",
    user_identifier_type: "custom",
    interaction_type: InteractionType.CALL,
    input_sample_rate: 16000,
    output_sample_rate: 16000,
  },
  audioInterface: new BrowserAudioInterface(16000),
  stateCallback, audioLevelCallback, eventCallback, endCallback,
});
```

Nothing about the agent (prompt, voice, languages, flows) is defined here. To change Kavya's
behaviour, edit and **commit** the agent in the Sarvam dashboard; the website picks up the latest
committed version automatically on the next conversation.

The proxy (`api/_lib/sarvam.mjs`) only forwards
`GET orgs/<org>/workspaces/<workspace>/apps/<app>/url` and refuses any other path or any IDs
that differ from the configured ones, so the key cannot be used to reach other agents.

## 8. Testing microphone permissions

Microphone access requires a **secure context**: `https://…` or `http://localhost`. A plain
`http://192.168.x.x` URL will fail with the "browser can't make voice calls" message.

- **Chrome / Edge (desktop):** click the lock icon → Site settings → Microphone → Allow.
- **Android Chrome:** ⋮ → Settings → Site settings → Microphone, or tap the lock icon on the page.
- **iPhone Safari:** Settings → Safari → Microphone → Allow, or tap "AA" → Website Settings.
  iOS also requires the first audio to start from a tap, which the Start button provides.
- To re-test the "denied" flow, block the microphone in site settings, reload, click Start:
  you should see "Microphone access is required to start the conversation."
- To test "in use", open another tab that is already recording, then click Start.

## 9. Where to get the IDs

Sarvam's documentation says to copy the IDs from the agent's **Deploy with Code** screen
(<https://docs.sarvam.ai/conversations/deploy/deploy-with-code>):

1. Sign in to the Sarvam Voice Agents dashboard (<https://dashboard.sarvam.ai>, also reachable
   as `indus.sarvam.ai/samvaad`).
2. Open the **Kavya** agent (do not create a new one).
3. Go to **Deploy → Deploy with Code (API & SDK)**.
4. The code sample on that screen contains the three values, already filled in for this agent:
   - `org_id` → `SARVAM_ORG_ID`
   - `workspace_id` → `SARVAM_WORKSPACE_ID`
   - `app_id` → `SARVAM_APP_ID`
5. Copy them exactly. Do not type them from memory or guess them.

The agent must have at least one **committed** version (use **Commit** in the agent editor).
Without a committed version Sarvam cannot issue a signed URL and the page shows
"Unable to connect to Kavya right now".

## 10. Testing from a phone

1. Deploy to Vercel (HTTPS is mandatory for the microphone).
2. On the phone, open `https://<project>.vercel.app` in Chrome (Android) or Safari (iPhone).
3. Tap **Start Conversation**, tap **Allow** on the microphone prompt.
4. Wait for "Kavya is listening…", then speak. The orb turns teal while you talk and saffron
   while Kavya answers. Use **Mute** / **End Conversation** as needed.
5. Local network testing without HTTPS is not possible on phones; use the Vercel preview URL,
   or run `npx vite --host` together with a tunnel such as `npx localtunnel --port 5173`.

## 11. Troubleshooting

| Symptom                                               | Cause / fix                                                                                   |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| "Kavya is not available right now"                    | A `SARVAM_*` variable is missing. Check `.env` locally or Vercel env vars, then redeploy.       |
| "Unable to connect to Kavya right now"                | Server logs show the upstream status: 401 = bad API key, 403 = key lacks access, 404 = wrong org/workspace/app ID, "no committed version" = commit the agent in Sarvam. |
| "Connecting to Kavya is taking too long"              | Network or firewall blocks `wss://` traffic to Sarvam; try another network.                   |
| "Microphone access is required…"                      | Permission denied – see section 8.                                                            |
| "This browser can't make voice calls"                 | Page not served over HTTPS/localhost, or very old browser.                                     |
| No sound on phone                                     | Ring/silent switch, Bluetooth output, or volume. The app already boosts output gain on mobile. |
| Works locally, fails on Vercel                        | Env vars not set for the Production environment, or set after the last deploy. Redeploy.      |
| `npm audit` reports `speaker`                         | Optional Node-only dependency of the SDK. It is never bundled into the browser build.          |
| API routes 404 in `npm run preview`                   | Expected: preview serves static files only. Use `npm run dev` or Vercel.                      |

## Project structure

```
loan-kart-voice-demo/
├── api/
│   ├── _lib/sarvam.ts          # proxy + config logic (only place that reads SARVAM_API_KEY)
│   ├── config.ts               # GET /api/config  -> public agent IDs
│   └── sarvam/[...path].ts     # GET /api/sarvam/* -> Sarvam signed-URL endpoint, key injected
├── public/favicon.svg
├── src/
│   ├── components/             # Header, VoiceOrb, StatusBadge, Controls, ErrorBanner, Footer
│   ├── hooks/useKavyaConversation.ts   # session lifecycle, states, error handling, cleanup
│   ├── services/kavyaAgent.ts  # Sarvam SDK wiring (ConversationAgent + BrowserAudioInterface)
│   ├── lib/errors.ts           # error codes -> friendly customer messages
│   ├── App.tsx  main.tsx  index.css
├── .env.example                # placeholders only
├── .gitignore  .npmrc  index.html  package.json
├── tsconfig*.json  vite.config.ts   # vite.config also hosts the local /api middleware
└── README.md
```
