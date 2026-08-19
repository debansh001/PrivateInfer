"use client";

import { useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, CircleDashed, CheckCircle, ExternalLink, AlertTriangle } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";

import { Contract } from '../../../../contracts/managed/privateinfer/contract/index.js';
import { createUnprovenCallTx, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/compact-js';

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
export default function QueryStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // Using the contract address directly instead of a database ID
  const contractAddress = id; 
  
  const [status, setStatus] = useState<string>("PROCESSING");
  const [commitmentHash, setCommitmentHash] = useState<string | null>(null);
  const [resultHash, setResultHash] = useState<string | null>(null);
  const [decryptedData, setDecryptedData] = useState<string | null>(null);
  
  const { isConnected, session, connect } = useWallet();

  useEffect(() => {
    let isMounted = true;
    const pollState = async () => {
      try {
        const res = await fetch(`/api/query/${id}?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.status) setStatus(data.status);
            if (data.commitmentHash) setCommitmentHash(data.commitmentHash);
            if (data.result && data.result.proofHash) {
              setResultHash(data.result.proofHash);
              if (data.result.decryptedData) setDecryptedData(data.result.decryptedData);
            }
          }
        }

        // Continue polling unless paid
        if (status !== "PAID" && isMounted) {
          setTimeout(pollState, 3000);
        }
      } catch (e) {
        console.error("Failed to fetch query status from database", e);
        if (isMounted) setTimeout(pollState, 5000);
      }
    };

    pollState();
    return () => { isMounted = false; };
  }, [id, status]);

  const [isReleasing, setIsReleasing] = useState(false);

  const getCompiledContract = (pkBytes: Uint8Array) => {
    return CompiledContract.make('privateinfer', Contract).pipe(
      CompiledContract.withWitnesses({
        callerAddress: (context: any) => [context.state, pkBytes]
      }),
      CompiledContract.withCompiledFileAssets('/zk/privateinfer'),
    ) as any;
  };

  const handleReleasePayment = async () => {
    if (!isConnected || !session) {
      await connect('preview');
      return;
    }
    
    setIsReleasing(true);
    try {
      const pkBytes = coinPublicKeyToBytes(session.providers.walletProvider.getCoinPublicKey());
      
      const marketplaceAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!marketplaceAddress) throw new Error("Marketplace address not set in .env.local!");

      const queryIdBuffer = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        queryIdBuffer[i] = parseInt(id.slice(i * 2, i * 2 + 2), 16);
      }

      const callTxData = await createUnprovenCallTx(session.providers as any, {
        compiledContract: getCompiledContract(pkBytes),
        contractAddress: marketplaceAddress,
        circuitId: 'releasePayment',
        args: [queryIdBuffer],
      });

      await submitTxAsync(session.providers as any, { unprovenTx: callTxData.private.unprovenTx, circuitId: 'releasePayment' });
      
      await fetch(`/api/query/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" })
      });

      setStatus("PAID");
      alert("Payment Released Successfully!");
    } catch (e: any) {
      console.error(e);
      alert("Failed to release payment: " + (e.message || e));
    } finally {
      setIsReleasing(false);
    }
  };

  const steps = [
    { id: "PROCESSING", label: "Query Deployed (Processing)", desc: "Contract deployed, waiting for provider inference", hash: commitmentHash },
    { id: "RESULT_READY", label: "Result Verified", desc: "Result hash committed to Midnight chain", hash: resultHash },
    { id: "PAID", label: "Provider Paid", desc: "tDUST released on-chain", hash: null },
  ];

  const getStepState = (stepId: string, currentStatus: string) => {
    const statuses = ["PROCESSING", "RESULT_READY", "PAID"];
    const stepIdx = statuses.indexOf(stepId);
    const currentIdx = statuses.indexOf(currentStatus);
    
    if (stepIdx < currentIdx) return "COMPLETED";
    if (stepIdx === currentIdx) return "ACTIVE";
    return "UPCOMING";
  };

  return (
    <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-display font-bold">Query Status</h1>
          <Badge variant="outline" className="font-mono bg-surface border-border">
            Contract: {contractAddress.slice(0, 10)}...
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Track the lifecycle of your query directly on the Midnight Preview network.
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-2 space-y-6">
          <h3 className="font-bold text-lg border-b border-border pb-2">Lifecycle</h3>
          <div className="space-y-6">
            {steps.map((step, idx) => {
              const state = getStepState(step.id, status);
              return (
                <div key={idx} className="flex gap-4 relative">
                  {idx !== steps.length - 1 && (
                    <div className="absolute left-[11px] top-8 bottom-[-16px] w-[2px] bg-border" />
                  )}
                  <div className="relative z-10 flex-shrink-0 bg-background">
                    {state === "COMPLETED" && <CheckCircle className="w-6 h-6 text-accent-verified" />}
                    {state === "ACTIVE" && <CircleDashed className="w-6 h-6 text-accent-primary animate-spin-slow" />}
                    {state === "UPCOMING" && <div className="w-6 h-6 rounded-full border-2 border-border" />}
                  </div>
                  <div>
                    <div className={`font-semibold ${state === "ACTIVE" ? "text-primary" : state === "COMPLETED" ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                      {step.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{step.desc}</div>
                    {step.hash && (state === "COMPLETED" || state === "ACTIVE") && (
                      <div 
                        className="text-xs font-mono mt-2 text-accent-primary flex items-center gap-1 cursor-pointer hover:underline"
                        onClick={() => {
                          navigator.clipboard.writeText(typeof step.hash === 'string' ? step.hash : "");
                          alert("Copied hash to clipboard! Paste it in your 1AM wallet or Midnight Explorer.");
                        }}
                      >
                        {typeof step.hash === 'string' ? step.hash.slice(0, 10) : "Hash..."} 
                        <span className="text-xs ml-1 bg-accent-primary/20 px-1 py-0.5 rounded">Copy</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-3">
          {(status === "RESULT_READY" || status === "PAID") && resultHash ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-surface border-border">
                <CardHeader className="border-b border-border/50 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle2 className="w-5 h-5 text-accent-verified" />
                    Secure AI Result Received
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {decryptedData && (
                    <div className="bg-primary/5 rounded-md p-4 border border-primary/20 mb-6">
                      <div className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                        <span>✨ Decrypted AI Output</span>
                      </div>
                      <div className="text-sm leading-relaxed text-foreground">
                        {decryptedData}
                      </div>
                    </div>
                  )}
                  <div className="bg-background rounded-md p-4 border border-border mb-6">
                    <div className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Cryptographic Proof (Hash)</div>
                    <div className="font-mono text-xs break-all text-muted-foreground">{resultHash}</div>
                  </div>
                  
                  {status === "RESULT_READY" && (
                    <div className="border-t border-border pt-6 mt-2">
                      <h4 className="font-semibold mb-2">Final Step: Release Payment</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        The provider has securely proven the result. Release the tDUST payment to the provider to complete the lifecycle.
                      </p>
                      <button 
                        onClick={handleReleasePayment}
                        disabled={isReleasing}
                        className="bg-accent-verified hover:bg-accent-verified/90 text-white px-6 py-2 rounded-md font-medium text-sm transition-colors w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isReleasing ? <CircleDashed className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {isReleasing ? "Releasing..." : "Release Payment"}
                      </button>
                    </div>
                  )}
                  {status === "PAID" && (
                    <div className="border-t border-border pt-6 mt-2 text-center text-accent-verified font-medium">
                      Payment Successfully Released!
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="h-full min-h-[300px] border-dashed border-border/50 bg-background flex flex-col items-center justify-center text-center p-6">
              <Shield className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <CardTitle className="text-muted-foreground">Waiting for Provider</CardTitle>
              <CardDescription className="max-w-xs mt-2">
                Waiting for the provider to submit the result hash to the smart contract on the Midnight Preview network.
              </CardDescription>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
