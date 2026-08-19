> [!IMPORTANT]
> **Network Notice:** This application and its smart contracts are currently deployed exclusively on the **Midnight Preview Network**. All transactions, zero-knowledge proofs, and escrow mechanisms occur on the Preview testnet environment.

# 📄 PROPOSAL: PrivateInfer

**Secure, Trustless Off-Chain AI Inference Powered by Midnight Preview Network's Zero-Knowledge Proofs.**

## 1. The Core Problem
As AI integrates into critical enterprise operations—especially in **Healthcare, Finance, and Legal** sectors—organizations face a massive roadblock: **Data Privacy**.

If a hospital needs to use an advanced AI model to analyze a patient's medical history for early disease detection, they face a dilemma:
- **Centralized APIs (like ChatGPT):** Expose highly confidential patient data to third parties, violating HIPAA regulations and destroying trust.
- **Traditional Public Blockchains:** Publishing the data on-chain is even worse, as it creates an immutable, public record of sensitive information.

Because of this tradeoff between **utility** and **privacy**, industries with sensitive data cannot adopt third-party AI inference at scale.

## 2. The PrivateInfer Solution
**PrivateInfer** leverages the **Midnight Preview Network** to provide a trustless marketplace for secure, off-chain AI inference. 

We decouple the **execution** of the AI from the **verification** of the AI.

1. **Encrypted Inputs:** The Query Maker (e.g., a Hospital) submits highly sensitive, encrypted data.
2. **Secure Processing:** A decentralized AI Provider Node picks up the task and processes the data strictly inside a secure "black box" (a Trusted Execution Environment / TEE).
3. **Zero-Knowledge Proofs:** The AI Provider submits the result back to the Midnight smart contract along with a ZK-Proof. This mathematically guarantees to the hospital that the AI model was run exactly as requested—**without ever revealing the patient's data or the result on the public ledger.**
4. **Trustless Escrow:** The smart contract automatically manages the escrow and releases the tDUST payment only when a valid proof is verified on-chain.

## 3. Why Midnight Preview Network?
Midnight is the only network capable of supporting this architecture gracefully because of its native support for **Data Protection** and **Zero-Knowledge Smart Contracts (Compact)**.

- **Public State:** Midnight securely tracks the state machine (Processing, Result Ready, Paid), the escrow balances, and the cryptographic commitment hashes.
- **Private State (Witnesses):** Midnight allows us to assert identity (e.g., verifying the caller is the Query Creator) and execute logic completely locally within a private circuit. The blockchain only receives the zero-knowledge proof, completely shielding the sensitive medical payload.

## 4. Key Value Propositions
* **For Data Owners (Hospitals/Enterprises):** Get the power of advanced AI without ever compromising data privacy or regulatory compliance.
* **For AI Providers:** Monetize proprietary AI models securely.
* **For Web3:** Prove that blockchain can be used for enterprise-grade privacy applications, moving beyond simple token transfers.

## 5. Hackathon Scope & Deliverables
* **Smart Contract:** A .compact smart contract deployed on the Midnight Preview Testnet that handles the escrow lifecycle and verifies ZK-proofs.
* **Query Maker UI:** A Next.js interface for users to deploy queries, commit hashes, and release payments via the 1AM Wallet.
* **AI Provider Hub:** A dashboard for AI nodes to claim queries, mock the secure off-chain execution, and submit the ZK-Proof back to the blockchain.


