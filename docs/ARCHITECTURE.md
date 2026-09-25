# PrivateInfer — Architecture Documentation

> **Network:** Midnight PREPROD | **Stack:** Next.js 16 · TypeScript · Tailwind CSS v4 · Prisma · Upstash Redis · Midnight Compact SDK

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Smart Contract Layer](#3-smart-contract-layer)
4. [Frontend Layer](#4-frontend-layer)
5. [Backend / API Layer](#5-backend--api-layer)
6. [Off-Chain Worker](#6-off-chain-worker)
7. [Database Schema](#7-database-schema)
8. [Wallet & ZK Proof Flow](#8-wallet--zk-proof-flow)
9. [Environment Variables](#9-environment-variables)
10. [Key Data Flows](#10-key-data-flows)

---

## 1. System Overview

PrivateInfer is a **confidential AI inference marketplace** on the Midnight blockchain. It enables:

- **Query Makers** (e.g., hospitals, law firms) to submit encrypted, sensitive queries to an AI model without exposing their data on-chain.
- **AI Providers** to process those queries inside a secure off-chain environment and submit cryptographic proofs of correct execution back to the blockchain.
- **Trustless settlement** via ZK-verified escrow — tDUST tokens are only released after the Midnight smart contract verifies the proof.

The core privacy guarantee: **the actual query and the AI response never touch the public ledger.** Only their SHA-256 hashes (commitment and proof hash) are stored on-chain.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
│                                                                     │
│  ┌──────────────┐    ┌─────────────────┐    ┌───────────────────┐  │
│  │  Landing Page│    │ /query/new      │    │ /query/[id]       │  │
│  │  (Marketing) │    │ (Submit Query)  │    │ (Status + Result) │  │
│  └──────────────┘    └────────┬────────┘    └────────┬──────────┘  │
│                               │                      │              │
│  ┌──────────────┐    ┌────────▼────────┐             │              │
│  │ /provider    │    │ 1AM Wallet      │◄────────────┘              │
│  │ (AI Provider │    │ (mn_shield ext) │                            │
│  │  Dashboard)  │    └────────┬────────┘                            │
│  └──────┬───────┘             │                                     │
└─────────┼─────────────────────┼───────────────────────────────────-┘
          │                     │ ZK Transactions
          │              ┌──────▼────────────────────────────────┐
          │              │    MIDNIGHT PREPROD NETWORK            │
          │              │                                        │
          │              │  ┌──────────────────────────────────┐ │
          │              │  │  privateinfer.compact Contract    │ │
          │              │  │                                   │ │
          │              │  │  Circuits:                        │ │
          │              │  │  • createQuery(commitHash, reward)│ │
          │              │  │  • submitResult(queryId, proof)   │ │
          │              │  │  • releasePayment(queryId)        │ │
          │              │  └──────────────────────────────────┘ │
          │              └───────────────────────────────────────┘
          │
          │ REST API (fetch)
┌─────────▼──────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES (/api/*)                      │
│                                                                     │
│  GET  /api/queries        — list all queries (admin/provider)       │
│  GET  /api/query/[id]     — get single query + result               │
│  PATCH /api/query/[id]    — update status (worker → RESULT_READY)   │
│  POST /api/query          — create new query record (off-chain)     │
│  GET  /api/providers      — get registered provider node            │
│  POST /api/provider/register — register provider wallet             │
└─────────────────────┬──────────────────────────────────────────────┘
                      │
         ┌────────────▼──────────┐      ┌───────────────────────┐
         │   NEON POSTGRESQL DB  │      │  UPSTASH REDIS        │
         │   (via Prisma + @neondatabase/serverless) │  (job queue)  │
         │                       │      │                       │
         │   Tables:             │      │  Keys:                │
         │   • Query             │      │  • inference:jobs     │
         │   • Provider          │      │  • job:{id}           │
         │   • Result            │      │                       │
         └───────────────────────┘      └───────────┬───────────┘
                                                    │
                                        ┌───────────▼───────────┐
                                        │  OFF-CHAIN WORKER     │
                                        │  (scripts/worker.ts)  │
                                        │                       │
                                        │  tsx worker.ts        │
                                        │  Polls Redis queue    │
                                        │  → Calls Groq API     │
                                        │  → Stores result in DB│
                                        └───────────────────────┘
```

---

## 3. Smart Contract Layer

**File:** [`contracts/privateinfer.compact`](../contracts/privateinfer.compact)  
**Compiled output:** `contracts/managed/privateinfer/`  
**Deployed address:** `a12de258a554063149957bc7386cefa2e163ddcb7cb25331b357f1b8778f183c` (PREPROD)

### Public State (On-Chain)
Only opaque identifiers and hashes are stored on the public ledger:

| Field | Type | Description |
|---|---|---|
| `queryId` | `Bytes<32>` | SHA-256 of the encrypted query payload |
| `commitmentHash` | `Bytes<32>` | Hash of the query input committed on-chain |
| `resultHash` | `Bytes<32>` | SHA-256 of the AI inference output |
| `status` | `Enum` | `PROCESSING → RESULT_READY → PAID` |
| `escrow` | `Uint<64>` | Locked tDUST reward amount |
| `provider` | `Bytes<32>` | Assigned provider's coin public key |
| `creator` | `Bytes<32>` | Query creator's coin public key |

### Private Witnesses (Off-Chain)
Handled inside local ZK circuit execution, never exposed on-chain:

- **`callerAddress`**: The submitter's coin public key — used to assert `disclose(caller) == query.creator` before releasing escrow, without revealing identity publicly.
- **AI Payload**: The actual prompt and response remain fully off-chain. The ZK proof only verifies that `hash(response) == resultHash`.

### Circuits

| Circuit | Who Calls | What It Does |
|---|---|---|
| `createQuery` | Query Maker | Locks tDUST escrow, commits query hash, assigns provider |
| `submitResult` | AI Provider | Submits result hash + ZK proof, transitions status to `RESULT_READY` |
| `releasePayment` | Query Maker | Verifies caller identity via private witness, releases escrow to provider |

---

## 4. Frontend Layer

**Framework:** Next.js 16.3.1 (App Router, Webpack mode)  
**Styling:** Tailwind CSS v4 + shadcn/ui components  
**Animations:** Framer Motion  
**Theme:** `next-themes` (`attribute="class"`, `defaultTheme="dark"`)

### Pages

| Route | File | Description |
|---|---|---|
| `/` | `src/app/page.tsx` | Full product landing page — hero, stats, How It Works, features grid, FAQ, footer |
| `/query/new` | `src/app/query/new/page.tsx` | Query submission form — connects wallet, calls `createQuery` circuit |
| `/query/[id]` | `src/app/query/[id]/page.tsx` | Query status tracker — polls API, shows ZK proof hash, decrypted result + copy button |
| `/provider` | `src/app/provider/page.tsx` | AI Provider Dashboard — lists PROCESSING queries, calls `submitResult` circuit |
| `/admin` | `src/app/admin/page.tsx` | Admin ops dashboard — password protected, 4 tabs: Overview/Queries/Providers/Deploy |

### Key Components

| Component | File | Description |
|---|---|---|
| `Header` | `src/components/Header.tsx` | Sticky header — logo, nav links, wallet connect button (real connect/disconnect), theme toggle |
| `WalletContext` | `src/contexts/WalletContext.tsx` | React context — manages wallet session, detects 1AM vs Lace, handles connection |

### Theme System
```css
/* Light theme — applied when no class on <html> */
:root {
  --background: #F8F9FC;
  --foreground: #0D1117;
  /* ... */
}

/* Dark theme — applied when next-themes adds class="dark" to <html> */
html.dark, .dark {
  --background: #0B0E17;
  --foreground: #F4F5F9;
  /* ... */
}
```

---

## 5. Backend / API Layer

All API routes live in `src/app/api/`. They are **serverless Next.js Route Handlers** (no Express).

### `GET /api/queries`
Returns all queries from the `Query` table, ordered by `createdAt DESC`.

### `GET /api/query/[id]`
Returns a single query joined with its `Result` record:
```json
{
  "id": "263f453c...",
  "status": "RESULT_READY",
  "commitmentHash": "6ef3114c...",
  "result": {
    "decryptedData": "Based on the provided medical data...",
    "proofHash": "a1b2c3d4..."
  }
}
```

### `PATCH /api/query/[id]`
Updates query status. Used by the worker to transition `PROCESSING → RESULT_READY`. Validates against allowed statuses `['PROCESSING', 'RESULT_READY', 'PAID', 'FAILED']`. Also inserts a `Result` record when transitioning to `RESULT_READY`.

### `POST /api/provider/register`
Registers or updates a provider node. Called automatically when a wallet connects to the `/provider` page. Uses `name = 'Provider Node'` to distinguish real provider nodes from query-maker wallet stubs.

### `GET /api/providers`
Returns the most recently registered `Provider Node` (used by the admin dashboard).

---

## 6. Off-Chain Worker

**File:** `scripts/worker.ts`  
**Run with:** `npm run worker` (requires `tsx`)

The worker is a **long-running Node.js process** that:
1. Polls Upstash Redis every 5 seconds for new inference jobs (`LPOP inference:jobs`)
2. Fetches the job payload (encrypted query text)
3. Calls the **Groq API** with the `mixtral-8x7b-32768` model for fast inference
4. Computes `SHA-256(response)` as the `proofHash`
5. Stores the `decryptedData` and `proofHash` in the `Result` table via `PATCH /api/query/[id]`
6. The AI Provider then calls `submitResult` on-chain with the `proofHash`

> **Note:** The worker does not communicate with the blockchain directly. The on-chain `submitResult` circuit is called manually from the Provider Dashboard UI.

---

## 7. Database Schema

**Database:** Neon PostgreSQL (serverless)  
**ORM:** Prisma 5 + `@neondatabase/serverless` adapter  
**Connection:** `DATABASE_URL` environment variable

```prisma
model Query {
  id             String      @id
  providerId     String
  status         QueryStatus @default(PROCESSING)
  commitmentHash String
  reward         String      @default("5 tDUST")
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  result         Result?
}

model Provider {
  id        String   @id @default(cuid())
  name      String
  modelHash String
  createdAt DateTime @default(now())
  queries   Query[]
}

model Result {
  id            String   @id @default(uuid())
  queryId       String   @unique
  decryptedData String
  proofHash     String
  createdAt     DateTime @default(now())
  query         Query    @relation(...)
}

enum QueryStatus {
  PROCESSING
  RESULT_READY
  PAID
  FAILED
}
```

---

## 8. Wallet & ZK Proof Flow

### Wallet Detection (WalletContext)
```typescript
// Priority order:
if (window.midnight['1am'])      → use 1AM Wallet (recommended)
else if (window.midnight.mnLace) → use Lace Wallet (limited support)
else                             → show "No Wallet Found"

// Network check:
network = process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK || 'preprod'
```

### createQuery Flow (User submits a query)
```
1. User types query text
2. SHA-256(text) → commitmentHash (32 bytes)
3. WalletContext.session.providers → createUnprovenCallTx(createQuery, [commitHash, reward])
4. submitTxAsync → transaction submitted to Midnight PREPROD
5. commitmentHash saved as Query.id in NeonDB
6. Query text pushed to Redis inference:jobs queue
```

### submitResult Flow (Provider submits result)
```
1. Worker picks up job from Redis, runs Groq inference
2. SHA-256(AI response) → proofHash (32 bytes)
3. Worker PATCH /api/query/[id] → stores decryptedData + proofHash in Result table
4. Provider Dashboard fetches proofHash from API
5. Provider calls createUnprovenCallTx(submitResult, [queryId, proofHash])
6. submitTxAsync → ZK proof verified on-chain, status → RESULT_READY
```

### releasePayment Flow (User releases escrow)
```
1. User sees RESULT_READY on /query/[id], clicks "Release Payment"
2. createUnprovenCallTx(releasePayment, [queryId])
   └── Private witness: callerAddress = getCoinPublicKey()
   └── Contract asserts: callerAddress == query.creator
3. submitTxAsync → escrow tDUST transferred to provider wallet
4. PATCH /api/query/[id] → status: PAID
```

---

## 9. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash Redis auth token |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | ✅ | Deployed Midnight contract address |
| `NEXT_PUBLIC_MIDNIGHT_NETWORK` | ✅ | Network name (`preprod`) |
| `GROQ_API_KEY` | ✅ (worker) | Groq API key for AI inference |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | ✅ (admin) | Password to access `/admin` dashboard |
| `NEXT_PUBLIC_MARKETPLACE_ADDRESS` | Optional | Alias for `CONTRACT_ADDRESS` (falls back automatically) |

Copy `.env.example` to `.env.local` and fill in all required values before running locally.

---

## 10. Key Data Flows

### Full End-to-End Happy Path

```
Query Maker                    Midnight Chain              AI Provider           Worker
     │                               │                         │                   │
     │──createQuery(hash, reward)───►│                         │                   │
     │◄─txId ────────────────────────│                         │                   │
     │──POST /api/query (DB)         │                         │                   │
     │──LPUSH Redis:inference:jobs   │                         │                   │
     │                               │                         │◄──LPOP Redis───────│
     │                               │                         │                   │──Groq API
     │                               │                         │                   │◄─response
     │                               │                         │◄─PATCH /api/query─│ (stores result)
     │                               │                         │──submitResult(proof)►│
     │                               │◄─ZK Proof Verified──────│                   │
     │                               │                         │                   │
     │◄──GET /api/query/[id]─────────────────────────────────── polling
     │   (status: RESULT_READY,      │
     │    decryptedData in response) │
     │                               │
     │──releasePayment(queryId)─────►│
     │◄─tDUST transferred to provider│
```
