> [!IMPORTANT]
> **Network Notice:** This application and its smart contracts are currently deployed exclusively on the **Midnight Preview Network**. All transactions, zero-knowledge proofs, and escrow mechanisms occur on the Preview testnet environment.

# 🛠️ SETUP INSTRUCTIONS

Follow these steps to run **PrivateInfer** locally.

## Prerequisites
1. **Node.js (v20+)**
2. **Docker Desktop** (Optional, only required if you want to modify and recompile the .compact smart contract locally)
3. **1AM Wallet Extension** installed in your browser and funded with testnet tDUST.
4. **PostgreSQL Database** (We recommend Neon DB).

---

## 1. Environment Variables
Create a .env.local file in the root directory and add the following keys:

\\\env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@host/dbname"

# Midnight Preview Network Configuration
NEXT_PUBLIC_NETWORK_ID="preview"
NEXT_PUBLIC_INDEXER_URL="https://indexer.preview.midnight.network"
NEXT_PUBLIC_NODE_URL="https://rpc.preview.midnight.network"
NEXT_PUBLIC_PROVER_URL="https://prover.preview.midnight.network"

# Contract Deployment (Will be filled in after admin deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS=""
\\\

---

## 2. Install Dependencies
Run the following command to install all frontend and Midnight SDK dependencies:
\\\ash
npm install
\\\

---

## 3. Database Setup (Prisma)
Initialize your PostgreSQL database with the required tables:
\\\ash
npx prisma generate
npx prisma db push
\\\

---

## 4. Run the Development Server
Start the Next.js application:
\\\ash
npm run dev
\\\
The application will be available at [http://localhost:3000](http://localhost:3000).

---

## 5. Testing
The project includes a robust Jest test suite to ensure cryptographic utilities (like wallet public key parsing) function flawlessly.

Run the tests using:
\\\ash
npm test
\\\

---

## 6. (Optional) Recompiling the Smart Contract
The smart contract is already compiled and available in contracts/managed/. If you modify contracts/privateinfer.compact, you can recompile it using the official Midnight Docker image:

\\\ash
docker run --rm -v "\D:\Coding Only\Projects\MIDNIGHT\DEBANSH\PrivateInfer/contracts:/workspace" -w /workspace midnightntwrk/compactc:latest compact compile privateinfer.compact managed/privateinfer
\\\
*(Note: This is automatically handled by our GitHub Actions CI pipeline upon pushing to the main branch).*


