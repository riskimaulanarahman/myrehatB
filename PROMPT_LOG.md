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

## Runtime prompts used by the application

- **F2 concierge system prompt:** `apps/web/src/lib/concierge/prompt.ts` (`CONCIERGE_SYSTEM_PROMPT`).
  It scopes the assistant to BuyHomestay questions, keeps replies short and WhatsApp-friendly, and forbids
  inventing listings or claiming bookings.
- **F3 polish system prompt:** `scripts/polish.ts` (`POLISH_SYSTEM_PROMPT`). It rewrites a listing description,
  keeping every fact and adding no new claims.
