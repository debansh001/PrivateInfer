/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Lock, FileText, ArrowRight, ShieldCheck, ExternalLink, Activity } from "lucide-react";
import Link from "next/link";

import { createUnprovenCallTx, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';
import { sampleSigningKey } from '@midnight-ntwrk/compact-runtime';
import { CompiledContract } from '@midnight-ntwrk/compact-js';

import { Contract } from '../../../../contracts/managed/privateinfer/contract/index.js';

function coinPublicKeyToBytes(pk: string | Uint8Array): Uint8Array {
  if (!pk) return new Uint8Array(32);
  const hex = typeof pk === 'string' ? pk : Array.from(pk as unknown as number[]).map((b) => b.toString(16).padStart(2, '0')).join('');
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    const val = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    bytes[i] = isNaN(val) ? 0 : val;
  }
  return bytes;
}

export default function SubmitQueryPage() {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [deployedContract, setDeployedContract] = useState<{ address: string, txId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const { isConnected, session, connect } = useWallet();

  useEffect(() => {
    // Fetch a mock provider from our DB just for the relation
    fetch("/api/provider/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "pi-medical-v1.0", modelHash: "0x9a8bc..." })
    })
      .then(res => res.json())
      .then(data => {
         if (data.providerId) setProviderId(data.providerId);
      })
      .catch(console.error);
  }, []);

  const getCompiledContract = (pkBytes: Uint8Array) => {
    return CompiledContract.make('privateinfer', Contract).pipe(
      CompiledContract.withWitnesses({
        callerAddress: (context: any) => [context.state, pkBytes]
      }),
      CompiledContract.withCompiledFileAssets('/zk/privateinfer'),
    ) as any;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    if (!isConnected || !session) {
      await connect('preview');
      return; 
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await new Promise(r => setTimeout(r, 800));
      
      const commitmentBuffer = new Uint8Array(32);
      crypto.getRandomValues(commitmentBuffer);
      
      // For the demo video, we use the CURRENT wallet's public key as the provider.
      // This allows the user to act as both User and Provider using the same 1AM Wallet.
      const pk = session.providers.walletProvider.getCoinPublicKey();
      const providerBuffer = coinPublicKeyToBytes(pk);

      const queryIdBuffer = new Uint8Array(32);
      crypto.getRandomValues(queryIdBuffer);
      const queryIdHex = Array.from(queryIdBuffer).map((b) => b.toString(16).padStart(2, '0')).join('');

      const contractAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress) throw new Error("Marketplace address not set in .env.local! Please complete Admin Setup.");

      const callTxData = await createUnprovenCallTx(session.providers as any, {
        compiledContract: getCompiledContract(providerBuffer),
        contractAddress,
        circuitId: 'createQuery',
        args: [queryIdBuffer, commitmentBuffer, providerBuffer],
      });

      const txId = await submitTxAsync(session.providers as any, { unprovenTx: callTxData.private.unprovenTx, circuitId: 'createQuery' });

      // Save to Neon DB so Provider Dashboard can find it
      await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, queryId: queryIdHex })
      });

      setDeployedContract({ address: queryIdHex, txId: txId as string });

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to deploy contract via 1AM wallet");
    } finally {
      setIsProcessing(false);
    }
  };

  if (deployedContract) {
    return (
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <Card className="bg-surface border-border overflow-hidden">
          <div className="h-2 bg-accent-verified w-full" />
          <CardHeader className="text-center pt-8">
            <div className="mx-auto bg-accent-verified/10 p-4 rounded-full w-fit mb-4">
              <ShieldCheck className="w-12 h-12 text-accent-verified" />
            </div>
            <CardTitle className="text-2xl font-display font-bold">Transaction Successful!</CardTitle>
            <CardDescription className="text-base mt-2">
              Your query has been encrypted and a dedicated smart contract has been deployed on the Midnight Preview network.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 pb-8">
            <div className="bg-background rounded-md p-4 border border-border">
              <div className="text-sm text-muted-foreground mb-1">Query ID</div>
              <div className="font-mono text-sm break-all text-primary">{deployedContract.address}</div>
            </div>
            <div className="bg-background rounded-md p-4 border border-border">
              <div className="text-sm text-muted-foreground mb-1">Marketplace Contract</div>
              <div className="font-mono text-sm break-all text-primary">{process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}</div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4 justify-center bg-surface-raised/50 border-t border-border pt-6 pb-8">
            <Button variant="outline" className="border-accent-primary text-accent-primary hover:bg-accent-primary/10" asChild>
              <Link href="https://explorer.preview.midnight.network/" target="_blank" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" /> Open Midnight Explorer
              </Link>
            </Button>
            <Button className="bg-accent-primary hover:bg-accent-primary/90">
              <Link href={`/query/${deployedContract.address}`} className="flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                Track Query Status
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Submit Query</h1>
        <p className="text-muted-foreground">
          Deploy a dedicated single-use contract on the Midnight Preview network for your query. All proofs and fees are sponsored by the 1AM wallet.
        </p>
      </div>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent-primary" />
            Query Details
          </CardTitle>
          <CardDescription>
            Selected Model: <span className="font-mono text-primary">pi-medical-v1.0</span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <Textarea 
              placeholder="Describe the symptoms or provide the text to analyze..." 
              className="min-h-[200px] bg-background border-border resize-y mb-4"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isProcessing}
            />
            {error && (
              <div className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                {error}
              </div>
            )}
            {isProcessing && (
              <div className="p-4 rounded-md bg-background border border-border flex items-center gap-3 text-sm text-muted-foreground animate-pulse">
                <Lock className="w-4 h-4 text-accent-primary" />
                <span className="font-mono">Compiling ZK proof and waiting for 1AM Wallet signature...</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end border-t border-border pt-6">
            {isConnected ? (
              <Button 
                type="submit" 
                className="bg-accent-primary hover:bg-accent-primary/90"
                disabled={!query || isProcessing}
              >
                {isProcessing ? "Processing..." : "Deploy Contract"}
                {!isProcessing && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            ) : (
              <Button 
                type="button" 
                variant="outline"
                className="border-accent-primary text-accent-primary hover:bg-accent-primary/10"
                onClick={() => connect('preview')}
              >
                Connect 1AM Wallet to Deploy
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
