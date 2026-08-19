/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { createUnprovenDeployTx, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';
import { sampleSigningKey } from '@midnight-ntwrk/compact-runtime';
import { CompiledContract } from '@midnight-ntwrk/compact-js';

import { Contract } from '../../../contracts/managed/privateinfer/contract/index.js';

export default function AdminPage() {
  const { isConnected, session, connect } = useWallet();
  const [address, setAddress] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const getCompiledContract = () => {
    return CompiledContract.make('privateinfer', Contract).pipe(
      CompiledContract.withWitnesses({
        callerAddress: (context: any) => [context.state, new Uint8Array(32)]
      }),
      CompiledContract.withCompiledFileAssets('/zk/privateinfer'),
    ) as any;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "midnight2026") {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  const handleDeploy = async () => {
    if (!session) return;
    try {
      const deployTxData = await createUnprovenDeployTx(
        session.providers as any,
        { 
          compiledContract: getCompiledContract(), 
          args: [], 
          signingKey: sampleSigningKey() 
        },
      );

      await submitTxAsync(session.providers as any, { unprovenTx: deployTxData.private.unprovenTx });
      setAddress(deployTxData.public.contractAddress);
    } catch (e) {
      console.error(e);
      alert("Failed to deploy: " + (e as Error).message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-12 max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-4">Admin Setup</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input 
            type="password" 
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Enter Admin Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit">Login</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-12 text-center">
      <h1 className="text-3xl font-bold mb-4">Admin Setup</h1>
      {!isConnected ? (
        <Button onClick={() => connect('preview')}>Connect Wallet</Button>
      ) : (
        <Button onClick={handleDeploy}>Deploy Marketplace Contract</Button>
      )}
      
      {address && (
        <div className="mt-8 p-4 bg-accent-primary/10 border border-accent-primary rounded-md overflow-hidden">
          <h3 className="font-bold">Deployed Successfully!</h3>
          <p>Add this to your .env.local file:</p>
          <pre className="mt-2 font-mono text-xs md:text-sm overflow-x-auto p-2 bg-background rounded">{`NEXT_PUBLIC_MARKETPLACE_ADDRESS=${address}`}</pre>
        </div>
      )}
    </div>
  );
}
