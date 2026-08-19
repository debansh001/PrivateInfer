# SETUP.md — PrivateInfer

Local development setup, in order. Network throughout: **Preview**.
Wallet: **Lace**.

## 1. Prerequisites

- Node.js 20+, npm
- Docker Desktop (for the local Midnight proof server)
- Lace wallet browser extension, set to **Preview** network
- A Neon account (free tier)
- An Upstash account (free tier, Redis)
- Compact compiler CLI installed and on `PATH`

## 2. Clone & install

```bash
git clone <your-repo-url>
cd privateinfer
npm install
```

## 3. Environment variables

Copy the template and fill in real values:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon dashboard → Connection Details → pooled connection string |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Upstash dashboard → REST API tab |
| `UPSTASH_REDIS_TCP_URL` | Upstash dashboard → "Redis" (TCP) connection tab |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Filled in after Phase 4 deploy — leave blank until then |
| `NEXT_PUBLIC_MIDNIGHT_NETWORK` | `preview` |

## 4. Database

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Confirm tables in Neon's SQL editor or Prisma Studio (`npx prisma studio`).

## 5. Local proof server (required for any wallet/contract interaction)

```bash
docker run -p 6300:6300 midnightntwrk/proof-server:latest midnight-proof-server -v
```

Leave this running in its own terminal for the whole dev session.

## 6. Lace wallet

1. Extension set to **Preview** network, proof server set to
   `http://localhost:6300`.
2. Get tDUST: `https://faucet.preview.midnight.network/` using your
   `mn_shield-addr_preview...` address (or the in-wallet "Generate tDUST"
   flow if available in your version, after first receiving tNIGHT).

## 7. Compile & deploy the contract

```bash
cd contracts
compact compile privateinfer.compact ./managed/privateinfer
# deploy script (see contracts/README.md) — writes the deployed address
# to your terminal; copy it into .env.local as NEXT_PUBLIC_CONTRACT_ADDRESS
```

## 8. Run the app

```bash
npm run dev          # Next.js app
npm run worker        # background job worker (separate terminal)
```

Visit `http://localhost:3000`.

## 9. Run tests

```bash
npm run test          # unit + integration
npm run test:e2e       # Playwright, stubbed-chain mode
```

## 10. Deploy

Push to `main` — the frontend CI/CD pipeline deploys to Vercel
automatically (see `IMPLEMENTATION_PLAN.md` Phase 5). Contract
redeploys are manual (`workflow_dispatch` in GitHub Actions).

## Troubleshooting quick reference

- **No address / wrong prefix in Lace:** confirm network dropdown says
  Preview, not Preprod or Undeployed.
- **Faucet says invalid address:** double-check you copied the address
  matching the currently selected network exactly.
- **Wallet won't connect / transactions hang:** confirm the Docker proof
  server is still running — closing that terminal silently breaks
  everything downstream.
- **Prisma can't reach Neon:** confirm you used the *pooled* connection
  string, not the direct one, for serverless/Vercel compatibility.