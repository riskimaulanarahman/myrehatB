# Reviewer follow-up — proof

## 1. A real listing through the form

The shared database rejected the existing credentials, so this was run locally against a fresh
PostgreSQL (PGlite) with the project schema applied by `drizzle-kit push`. Nothing was seeded.

| File | Shows |
|---|---|
| `1-form-filled.png` | `/listings/new`, signed in as a new account, form filled in |
| `2-listings-page.png` | After submit: redirect to `/listings`, "Listing created" toast, the new card (outlined) |

Stored row (`listing` joined to `user`):

```
title                                   | price  | category     | contact_wa      | owner
Homestay 3 Kamar dekat Pantai Cherating | 450000 | Buy Property | +60 12-345 6789 | riski.demo+1794316731671@example.com
```

Reproduce:

```bash
(cd packages/db && DATABASE_URL=<local postgres> npx drizzle-kit push)
DATABASE_URL=<local postgres> pnpm run dev
# sign up at /login, open /listings/new, submit, then /listings
```

### Why the shared `/listings` shows only "Test" rows

The page renders whatever is in the `listing` table; the code never creates "Test" data.

- `packages/api/src/routers/listing.ts` — `listing.list` returns **every** row, with no owner or status filter.
- `packages/db/src/schema/listing.ts` — `listing` is the externally provided table in the shared
  `taskb14` database, so rows written by anyone with access to it are listed.
- `e2e/uat.spec.ts` — the UAT suite creates `UAT Homestay <stamp>` listings and does not delete them
  (there is no delete procedure).
- Before commit `aa24071`, production's web container could reach another project's API, so it showed
  that project's data.

## 2. The `item.whatsapp.replace` null-guard

Guard: `getWhatsAppLink()` in `apps/web/src/lib/listing-format.ts`, used by
`apps/web/src/app/listings/page.tsx` (introduced in `40a5649`, now unit-tested).

Why it crashed:

1. The Drizzle column is `text("contact_wa").notNull()`, so oRPC types `whatsapp` as `string` and
   TypeScript allowed `item.whatsapp.replace(...)` with no check. That type is only a compile-time promise.
2. At runtime the value was `undefined`: production's `/rpc` was answered by another project's API on the
   shared `dokploy-network`, which returns `contactWa`, not `whatsapp` (fixed in `aa24071`).
3. `/listings` is a Server Component with no error boundary, so one bad card turned the whole page into a 500.

Tests: `apps/web/src/lib/listing-format.test.ts`, including a `contactWa`-shaped row that shows the old
expression throws `TypeError` while the guard returns `null`.

| File | Shows |
|---|---|
| `vitest-green.png` | `bunx vitest run --reporter=verbose`: 9 files, 90 tests passed |
| `vitest.log` | The same run as plain text |
