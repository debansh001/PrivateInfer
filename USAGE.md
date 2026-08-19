> [!IMPORTANT]
> **Network Notice:** This application and its smart contracts are currently deployed exclusively on the **Midnight Preview Network**. All transactions, zero-knowledge proofs, and escrow mechanisms occur on the Preview testnet environment.

# 📖 USAGE GUIDE

This guide explains how to walk through the end-to-end lifecycle of a secure AI Inference using **PrivateInfer** on the Midnight Preview Testnet.

---

## 1. Initial Setup (Admin)
Before users can create queries, the master smart contract must be deployed.
1. Navigate to /admin in your browser.
2. Connect your 1AM wallet.
3. Click **Deploy Marketplace Contract**.
4. Approve the transaction.
5. Copy the deployed contract address and paste it into your .env.local file under NEXT_PUBLIC_CONTRACT_ADDRESS.
6. *(If running locally, restart your Next.js server to apply the ENV change).*

---

## 2. Creating a Secure Query (As a User / Hospital)
1. Go to the **Home Page**.
2. Connect your 1AM wallet.
3. Enter your highly sensitive prompt/data into the input box.
   - *Example: "Patient #4928 - Analyze encrypted blood markers [Blob] for early signs of Autoimmune disorders."*
4. Click **Submit Secure Query**.
5. Approve the transaction in your wallet. This locks your tDUST payment in the Midnight Smart Contract Escrow.
6. You will be redirected to the **Query Details Page** where you can track the real-time status.

---

## 3. Processing the AI Inference (As the Provider Node)
1. Click **Provider Hub** in the top navigation bar.
2. You will see the new query sitting in the "Inference Queue" with a status of Processing.
3. *(In a production environment, your TEE node would pull the encrypted blob, decrypt it locally, run the AI model, and generate a ZK-Proof).*
4. Click **Submit Result**.
5. Approve the transaction. This submits the ZK-Proof and the Result Hash to the Midnight smart contract, transitioning the state to Result Verified.

---

## 4. Releasing the Payment (As a User / Hospital)
1. Return to the **Query Details Page** (or refresh it).
2. You will see that the smart contract has successfully verified the provider's ZK-Proof.
3. The page will dynamically display the **"✨ Decrypted AI Output"** mock response.
4. Because the ZK-Proof mathematically guarantees the AI model was run correctly without tampering, you can confidently click the **Release Payment** button.
5. Approve the final transaction in your wallet.
6. The smart contract successfully releases the tDUST escrow to the Provider. 

The lifecycle is complete!


