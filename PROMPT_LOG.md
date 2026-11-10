# Prompt Log — MyRehat Task B

AI assistant: Claude Code (Claude Opus 5.5). The developer drove the work in phases; each entry
summarises the prompt and what the assistant did. No credentials are recorded here.

## Development prompts

| # | Prompt (summary) | Outcome |
|---|---|---|
| 1 | Scaffold with the exact `create-better-t-stack` command (Next + Elysia/Bun, Postgres + Drizzle, Better Auth, oRPC, AI example, Turborepo + Biome, Docker, pnpm) and inspect the result without functional changes. | Scaffold generated as `myrehat-task-b`. pnpm ≥ 10.26 was required, so a temporary pnpm was used just for the scaffold. |
| 2 | Apply the five mandatory Dokploy patches: dummy committed `.env` files, `msgpackr-extract` in `allowBuilds`, compose without host ports and with parameterised env, Next rewrites for `/rpc` + `/api/auth` → `http://server:3000`, Better Auth cookies `lax`/`secure: false`. | Patches applied; only `apps/web/.env` and `apps/server/.env` were un-ignored (anchored `!/.env` in the app `.gitignore`s). |
| 3 | Install dependencies and record a baseline (`check-types`, `build`, Biome check-only). | Baseline green; Biome flagged scaffold formatting only (left untouched). |
| 4 | Define the listing schema and a single source of truth for the four categories; push to the provided PostgreSQL. | A dry run (`drizzle-kit push --explain`) showed the database already had a `listing` table, so the schema was changed to **conform** to it (`contact_wa`, text `id`/`price`/`category`) with an additive-only push: `user_id` FK + index, `updated_at`, category `CHECK`, `verification.id` PK. |
| 5 | Implement F1: authenticated listing creation and a public listing page using the scaffold's oRPC/Better Auth patterns. | `listing.create` (protected, `userId` from the server session) and `listing.list` (public); `/listings` and `/listings/new`. Verified end to end against the database, then test data removed. |
| 6 | Implement F2: `POST /api/webhooks/waha` with AI SDK `generateText` + OpenRouter, returning `{ to, reply }`. | Next.js route handler on the web origin (compose gives `OPENROUTER_*` to the web service). Validation, prompt and provider call are in separate modules so the AI call can be mocked. 400/422/503/502 error handling. |
| 6b | Security pass for F2 and keyless verification. | Found the real key baked into ignored local build output/caches by varlock; artifacts purged, keyless typecheck/build/503 verified. |
| 7 | Finish the task end to end: F3, F4, Vitest, same-origin production setup, deploy. | Browser API calls now always use the web origin (rewrites), F3 `scripts/polish.ts` with ai-sdk-provider-opencode-sdk, F4 hero, Vitest suite (`bunx vitest run`). |
| 8 | Run an end-to-end UAT with Playwright. | `e2e/uat.spec.ts` covers the hero, auth, listing creation for all four categories and the webhook responses. It runs locally or against a deployed URL via `UAT_BASE_URL`. |
| 9 | Improve the look of the web app to match the MyRehat/BuyHomestay brand. | Brand colour tokens (WCAG AA in light and dark), rounded components, Plus Jakarta Sans; header, home, listings, forms, dashboard and AI chat greeting restyled. |
| 10 | Reviewer report: `/listings` returns 500 when a listing has no WhatsApp number. | The number is read null-safely and the page shows "WhatsApp contact not available" instead of crashing. |
| 11 | Find out why production returned another project's listings. | `server` also resolved to another project's service on the shared `dokploy-network`. The compose service was renamed to `taskb14-api`, so the rewrites from patch 4 of the five (entry 2) now target `http://taskb14-api:3000` instead of `http://server:3000`. |
| 12 | Run F3 against a real OpenCode server, not only the mocked unit tests. | Provider 5.x needs OpenCode 2.x: a first attempt with `opencode-ai` (1.x) failed its connection check. With `OPENCODE_PASSWORD=<password> npx @opencode/cli@2.0.24 serve --port 4097`, `scripts/polish.ts` returned a polished description using the default `opencode/big-pickle` model. |
| 13 | Switch the scaffold's AI chat from Google Gemini to OpenRouter. | The endpoint moved from the Elysia server to `POST /api/ai/chat` on the web origin, reusing the F2 OpenRouter settings. Requests are validated and size-limited, client `system` messages are rejected, and `/ai` shows an error when a reply fails. |
| 14 | Let the AI chat answer from the real listings, for example what is available and price ranges. | Read-only `searchListings` tool (`apps/web/src/lib/concierge/listing-search.ts`) over the public `listing.list` API. The model only fills in filters and never writes SQL; prices are compared as numbers and results are capped. |
| 15 | Reviewer follow-up: create a real listing through the form and show it on `/listings`; prove the `item.whatsapp.replace` null-guard with a green Vitest run. | The shared database rejected the existing credentials, so the stack ran locally against a fresh PGlite database with the project schema (`drizzle-kit push`). A real listing was created through `/listings/new` and shown on `/listings` (`docs/proof/`). The guard moved to `apps/web/src/lib/listing-format.ts` with 12 tests, including the `contactWa`-shaped row that caused the 500; Vitest 90/90. |
| 16 | Show the listings a user has created on `/dashboard`. | Protected `listing.mine` filters by the session user; the scaffold's "Private API" placeholder on `/dashboard` became a "My listings" grid with an empty state. The card moved to `apps/web/src/components/listing-card.tsx`, shared with `/listings`. New UAT-20 checks that only the user's own listings appear. |

## Runtime prompts used by the application

- **F2 concierge system prompt:** `apps/web/src/lib/concierge/prompt.ts` (`CONCIERGE_SYSTEM_PROMPT`).
  It scopes the assistant to BuyHomestay questions, keeps replies short and WhatsApp-friendly, and forbids
  inventing listings or claiming bookings.
- **AI chat system prompt:** `apps/web/src/lib/concierge/prompt.ts` (`CHAT_SYSTEM_PROMPT`). Same scope as the concierge,
  written for the website, and it must answer listing questions only from the `searchListings` tool.
- **F3 polish system prompt:** `scripts/polish.ts` (`POLISH_SYSTEM_PROMPT`). It rewrites a listing description,
  keeping every fact and adding no new claims.
