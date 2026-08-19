# PrivateInfer — Phase-by-Phase Implementation Plan

Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui · Prisma + Neon
Postgres · Compact contracts on Midnight **Preview** network · Lace wallet ·
GitHub Actions CI/CD → Vercel.

Assumption used throughout: wallet = **Lace**, network = **Preview**
(consistent everywhere — frontend config, faucet, indexer endpoints).

---

## Phase 0 — Project Scaffolding & Dependencies

**Goal:** one repo, correctly configured, before any feature work.

1. **Create the Next.js app**
   - TypeScript, App Router, Tailwind enabled at init.
   - Confirm `src/app` structure, not the older `pages` router.
2. **Install shadcn/ui**
   - Run its init command, pick a base style (`slate` or `neutral` base —
     we override tokens in Phase 1 anyway).
   - Add components as needed per screen (see Phase 1): `button`, `card`,
     `input`, `textarea`, `badge`, `tabs`, `dialog`, `table`, `skeleton`,
     `toast`/`sonner`.
3. **Install Prisma + Neon driver**
   - `prisma`, `@prisma/client`, plus Neon's serverless driver adapter so
     Prisma works well on Vercel's edge/serverless functions.
4. **Install Midnight tooling**
   - `@midnight-ntwrk/midnight-js`, `@midnight-ntwrk/wallet` packages, and
     the Compact compiler CLI (you mentioned you already have Midnight
     skills locally at `C:\Users\User\.agents\` — point your editor/agent
     at that path so contract scaffolding follows whatever conventions are
     already defined there, rather than duplicating a different structure
     here).
5. **Repo hygiene**
   - `.env.local` (gitignored) for secrets, `.env.example` committed.
   - `contracts/` directory at repo root, separate from `src/` — CI will
     build these independently (see Phase 5).
6. **Verify**: `npm run dev` shows the default Next.js page with Tailwind
   + shadcn working before moving on.

---

## Phase 1 — Design System & UI Screens

**Goal:** a distinctive visual identity before wiring up real data — build
every screen against mock/static data first.

### Design tokens (the "Midnight" identity, not a generic template)

- **Palette** — leans into the product's actual name and theme (privacy,
  night, cryptographic calm) rather than a default light/cream template:
  - `--background`: `#0B0E17` (near-black indigo, not pure black)
  - `--surface`: `#141827` (card/panel surfaces)
  - `--surface-raised`: `#1C2136`
  - `--accent-primary`: `#8B7FF5` (soft violet — "encrypted / in progress")
  - `--accent-verified`: `#4FD1C5` (teal — "verified on-chain / paid")
  - `--text-primary`: `#F4F5F9`
  - `--text-muted`: `#8B90A6`
- **Typography**
  - Display face: a geometric/technical sans (e.g. Space Grotesk) for
    headings — used with restraint, not on every line.
  - Body face: a humanist sans (e.g. Inter) for all paragraph/UI text.
  - Monospace: (e.g. JetBrains Mono) reserved specifically for tx hashes,
    commitment hashes, wallet addresses — this is functional, not
    decorative, and reinforces the "cryptographic proof" feel every time
    a hash appears on screen.
- **Signature element:** a subtle animated "commitment seal" — a small
  hexagon/lock glyph next to any hash value that briefly pulses teal when
  a status flips to "Verified on-chain." One recurring motif, used
  consistently, rather than scattered animation.

### Screens to build (mock data first)

1. **Landing page**
   - Hero: one clear sentence — what PrivateInfer does and for whom —
     plus a live-feeling mock "submit a query" widget as the hero visual
     (not a generic stat-block hero).
   - Sections: how it works (3 steps: encrypt → verify → pay), USPs from
     the proposal, and a "for providers" call-to-action.
2. **Connect Wallet screen/modal**
   - Lace connect button, shows address (truncated, monospace) and
     tDUST balance once connected.
3. **Submit Query dashboard**
   - Textarea for symptoms/query, client-side "Encrypting..." state,
     Submit button, then redirect to status view.
4. **Query Status / Tracking screen**
   - Stepper UI: Pending → Processing → Result Ready → Paid, each step
     annotated with its tx hash (monospace, link to explorer) once
     available.
5. **Result screen**
   - Decrypted answer, disclaimer banner, "View on-chain proof" link.
6. **Provider Dashboard** (Phase 2+ feature, scaffold the shell now)
   - Table of queries served, revenue, model hash registered.
7. **Empty/error states**
   - Written in the interface's own voice per screen (e.g. no queries yet
     → "No queries submitted. Start one above." not a generic 404-style
     message).

**Checkpoint before Phase 2:** every screen renders and is responsive
down to mobile using static/mock data — no backend or chain calls yet.

---

## Phase 2 — Database Layer (Neon + Prisma)

1. Create a Neon project, copy the pooled connection string.
2. Write `schema.prisma`: `Provider`, `Query`, `Result` models (status
   enum: `PENDING → PROCESSING → RESULT_READY → PAID / FAILED`).
3. Run `prisma migrate dev` locally against Neon to create tables.
4. Add a `prisma/seed.ts` with a couple of fake queries/results so the
   Phase 1 screens can switch from static mocks to real (seeded) data.
5. **Checkpoint:** dashboard screens read real rows from Neon.

---

## Phase 3 — API Layer (Next.js Route Handlers)

1. `POST /api/query` — accept encrypted blob + commitment hash, write to
   DB, enqueue a background job, return query id.
2. `GET /api/query/[id]` — return current status (+ result once ready).
3. `POST /api/provider/register` (Phase 2 marketplace feature, stub now).
4. Background processing: since Vercel functions are short-lived, use a
   queue (Upstash Redis + a cron-triggered or Vercel Background Function
   worker) rather than a long-running Node process — this matters
   specifically because you're deploying to Vercel, not a persistent
   server.
5. **Checkpoint:** submitting a query end-to-end updates status through
   all stages using *stubbed* chain calls (see Phase 4).

---

## Phase 4 — Compact Contract (Preview Network)

1. Write the contract: ledger state for commitments, result hashes,
   payment-released flags; circuits for `submitQuery`, `submitResult`,
   `releasePayment`.
2. Compile locally with the Compact CLI.
3. Get tDUST via Lace on **Preview** (faucet: `faucet.preview.midnight.network`,
   matching your `mn_shield-addr_preview...` address — this is the
   consistency fix from your earlier faucet issue).
4. Deploy the compiled contract to Preview, record the contract address
   in `.env` (`NEXT_PUBLIC_CONTRACT_ADDRESS` or server-side equivalent).
5. Replace the Phase 3 stub functions (`submitQueryCommitment`,
   `submitResultOnChain`, `releasePaymentOnChain`) with real calls via
   `@midnight-ntwrk/midnight-js`, pointed at Preview's indexer/node/proof
   server endpoints.
6. **Checkpoint:** a real query flows through DB → queue → contract call
   → visible transaction on the Preview explorer.

---

## Phase 5 — CI/CD (GitHub Actions → Vercel)

Two independent pipelines, since frontend and contracts have different
build tools and failure modes:

1. **Frontend pipeline** (on every push/PR):
   - Install deps, `next build`, type-check, run unit + component tests.
   - On merge to `main`: Vercel deploy (via Vercel's GitHub integration or
     `vercel deploy --prod` in Actions using a Vercel token secret).
2. **Contracts pipeline** (on changes under `contracts/`):
   - Install Compact CLI, `compact compile`, run any contract-level test
     suite (see Phase 6), fail the build if compilation errors.
   - Deployment to Preview stays a **manual** step (`workflow_dispatch`)
     rather than auto-deploy-on-merge — contract deploys are harder to
     undo than a frontend redeploy, so keep a human in the loop here.
3. **Secrets** stored in GitHub Actions secrets + Vercel project env vars:
   `DATABASE_URL`, `UPSTASH_REDIS_*`, `NEXT_PUBLIC_CONTRACT_ADDRESS`,
   `VERCEL_TOKEN`.
4. **Checkpoint:** a PR triggers both pipelines; merging deploys the
   frontend automatically; contract redeploys stay a deliberate action.

---

## Phase 6 — Testing (3+ cases minimum)

Aim for at least one test per layer, not three tests in one layer:

1. **Unit test** — hashing/commitment logic (e.g. `commitmentHash` is
   deterministic for the same input+nonce, differs across nonces).
2. **API/integration test** — `POST /api/query` → row created in a test
   DB with `status = PENDING`; `GET /api/query/[id]` reflects updates.
3. **Component test** — Query Status stepper renders the correct active
   step for each `QueryStatus` value, including the `FAILED` state.
4. *(Optional 4th)* **E2E test** (Playwright) — full happy path against
   stubbed chain calls: submit → poll → see result, without touching the
   real Preview network in CI (keep real-chain runs manual/local).

---

## Phase 7 — Production Readiness Checklist

- [ ] All screens responsive to mobile widths.
- [ ] Loading and error states designed, not left as blank/spinner-only.
- [ ] Secrets never committed; `.env.example` kept current.
- [ ] Explicit UI copy stating this is Preview-testnet, not real money
      or real medical/legal advice (see disclaimer note in USAGE.md).
- [ ] CI green on both pipelines before any deploy.
- [ ] `PROPOSAL.md`, `SETUP.md`, `USAGE.md` reviewed and current.