# PROPOSAL.md — PrivateInfer

**A Confidential AI Inference Marketplace on Midnight**

## The Problem

AI inference today forces a trade-off neither side wants to make. A person
asking a medical symptom-checker or a legal-document analyzer has to send
a raw, often sensitive query to a server they don't control, with no real
guarantee of how it's stored or reused afterward. On the other side, the
model provider has to expose outputs — and often risks exposing
proprietary weights or logic — just to demonstrate the result can be
trusted. This standoff is a real reason healthcare, legal, and finance
use cases haven't adopted third-party AI inference at scale.

## The Solution

PrivateInfer is a marketplace where users submit encrypted queries to AI
models and get back a result plus cryptographic assurance that it was
produced through a verifiable, tamper-evident process — without the
user's query ever sitting in a visible server log, and without the
model's internals being exposed to the user or the network. Midnight's
dual-state architecture keeps the query and the model's outputs off-chain
and private, while a Compact contract anchors commitments, verifies the
provenance chain, and settles payment on-chain.

> **Scope note (Phase 1 honesty):** proving that a model's actual
> computation was numerically correct in zero knowledge (zkML) is still
> an open, research-grade problem — not something a Phase 1 build
> delivers. What Phase 1 *does* deliver is a verifiable custody chain:
> proof that a specific committed query led to a specific committed
> result, tied to a specific declared model version, before payment
> releases. Real "the provider never even sees the plaintext" privacy
> is a Phase 4/5 goal that needs a trusted execution environment or
> homomorphic encryption layered on top.

## USPs

- **Zero query exposure (target state)** — sensitive medical or legal
  questions never touch a visible, persistent server log.
- **Zero model exposure** — providers keep proprietary weights and logic
  private while still proving correctness of custody and provenance.
- **Verifiable trust without an audit** — users don't have to take the
  provider's word for it; the on-chain record is the guarantee.
- **Marketplace neutrality** — multiple model providers can compete on
  the same platform without exposing IP to each other.

## Monetization

Every query is a micropayment, split between the model provider and the
platform — a transaction-fee marketplace, not a subscription. Platform
revenue scales directly with usage rather than requiring upfront
enterprise sales, and providers are incentivized to list because it lets
them monetize models without ever releasing the models themselves.

## Real-World Example

A patient uses a symptom-checker app built on PrivateInfer. Their
symptoms are encrypted client-side before submission. The licensed
medical AI model processes the query and produces an answer plus an
on-chain commitment/result record. The patient receives their result;
the platform verifies the record on-chain and releases a micropayment to
the provider.

## Phase-Wise Plan (summary — full detail in `docs/IMPLEMENTATION_PLAN.md`)

| Phase | Focus |
|---|---|
| 1 | Single model, single use case, manual flow, Preview testnet |
| 2 | Provider registry, multi-provider listings, micropayment settlement |
| 3 | Query batching / cost optimization, second vertical (legal docs) |
| 4 | Reputation layer, dispute resolution, enterprise onboarding |
| 5 | Legal & compliance review before any real clinical/legal use |

## Architecture (concise)

```
User          → encrypts query locally → submits commitment to contract
Provider      → runs inference off-chain → submits result commitment
Midnight Chain→ verifies commitment chain, releases micropayment, records outcome
User          ← receives decrypted result, sees on-chain proof of custody
```

## Note to the Midnight Team

PrivateInfer is proposed as a demonstration of Midnight's capacity to
extend commitment/verification patterns beyond identity and finance into
AI-adjacent workflows — an area where trust and confidentiality are
usually assumed to be mutually exclusive. We'd welcome guidance on
realistic proof-generation performance for future zkML-style work, and
would be glad to explore Preview-network support as a pilot with a small
number of model providers.