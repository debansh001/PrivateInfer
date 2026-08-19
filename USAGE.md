# USAGE.md — PrivateInfer

## Who this is for

Anyone running the app locally or using the deployed Vercel instance on the Midnight **Preview** network. This is a hackathon build demonstrating how Midnight's Zero-Knowledge Compact contracts can facilitate trustless AI inferences without exposing sensitive data.

## Disclaimer

This is a Preview-testnet demo. tDUST are test tokens with no real value. Model responses are simulated for the sake of demonstrating the cryptography and state transitions, not medical or legal advice — always consult a licensed professional.

## Basic Flow

### 1. Connect 1AM Wallet
- Click **Connect Wallet** on the landing page or header.
- The **1AM Wallet** extension must be installed and set to the **Midnight Preview** network.
- Once connected, your address and tDUST balance are available to the dApp.

### 2. Admin Setup (First Run Only)
- PrivateInfer uses an advanced **Singleton Marketplace Contract** architecture.
- Navigate to `/admin` to deploy the global Marketplace contract.
- Add the resulting contract address to your `.env.local` as `NEXT_PUBLIC_MARKETPLACE_ADDRESS`.

### 3. Submit a Query (User Flow)
- Navigate to the **Submit Query** screen (`/query/new`).
- Type your question/symptoms into the text box.
- Click **Deploy Contract**. The query payload remains fully off-chain. Only a commitment hash is stored on the ledger inside the global `Map` data structure.
- You're redirected to a status page tracking your specific `Query ID`.

### 4. Process the Query (Provider Flow)
- Open a new tab and navigate to the **Provider Hub** (`/provider`).
- The dashboard indexes the database and lists active queries waiting in the `PROCESSING` state.
- Click **Submit Result**. You will be prompted by the 1AM Wallet to sign a ZK proof transaction that transitions the contract state to `RESULT_READY` and commits the result hash on-chain.

### 5. Settlement (User Flow)
- Switch back to the User tab. The status will update to **Result Ready**.
- Alternatively, on the Provider Hub, click **Release Payment**. This calls the `releasePayment` circuit, simulating the escrow token transfer to the Provider and transitioning the query status to `PAID`.

## Common Issues

| Symptom | Likely cause |
|---|---|
| "Connect Wallet" does nothing | 1AM Wallet extension is not installed or unlocked. |
| Contract call fails with "Marketplace address not set" | You skipped the Admin setup step. Go to `/admin` and update `.env.local`. |
| Transaction hangs indefinitely | Midnight Preview network block times can occasionally spike. Wait 15-30 seconds. |

## Where to look when something breaks

- Frontend errors: browser console.
- Contract call errors: 1AM Wallet transaction popup or the Midnight block explorer.