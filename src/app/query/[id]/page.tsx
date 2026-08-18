/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, CircleDashed, CheckCircle, ExternalLink, AlertTriangle } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";

// @ts-ignore
import { Contract } from '../../../../contracts/managed/privateinfer/index.js';

export default function QueryStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // Using the contract address directly instead of a database ID
  const contractAddress = id; 
  
  const [status, setStatus] = useState<string>("PROCESSING");
  const [commitmentHash, setCommitmentHash] = useState<string | null>(null);
  const [resultHash, setResultHash] = useState<string | null>(null);
  
  const { isConnected, session, connect } = useWallet();

  useEffect(() => {
    if (!session || !isConnected) return;

    const pollState = async () => {
      try {
        const stateData = await session.providers.publicDataProvider.queryContractState(contractAddress);
        if (stateData && stateData.data) {
          // Deserializes the raw ledger bytes into our typed ledger object
          const ledger = Contract.ledger(stateData.data);
          
          if (ledger.status) setStatus(ledger.status);
          if (ledger.commitmentHash) setCommitmentHash(ledger.commitmentHash);
          if (ledger.resultHash && ledger.resultHash !== "0000000000000000000000000000000000000000000000000000000000000000") {
            setResultHash(ledger.resultHash);
          }
        }

        // Continue polling unless paid
        if (status !== "PAID") {
          setTimeout(pollState, 3000);
        }
      } catch (e) {
        console.error("Failed to poll state from Midnight indexer", e);
        setTimeout(pollState, 5000);
      }
    };

    pollState();
  }, [session, isConnected, contractAddress, status]);

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

      {!isConnected ? (
        <Card className="bg-surface border-border p-8 text-center">
          <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Connect 1AM Wallet</h3>
          <p className="text-muted-foreground mb-6">You must connect your 1AM wallet to read the state of this contract from the network.</p>
          <button onClick={() => connect('preview')} className="bg-accent-primary text-background px-6 py-2 rounded-md font-mono text-sm tracking-wide uppercase font-bold">
            Connect
          </button>
        </Card>
      ) : (
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
                        <div className="text-xs font-mono mt-2 text-accent-primary flex items-center gap-1 cursor-pointer hover:underline">
                          {typeof step.hash === 'string' ? step.hash.slice(0, 10) : "Hash..."} <ExternalLink className="w-3 h-3" />
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
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500/90 rounded-md p-4 flex gap-3 text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p>
                    <strong>On-Chain Only Demo:</strong> The result hash has been committed to the chain. In a full implementation, you would decrypt the off-chain payload using the hash to verify integrity.
                  </p>
                </div>

                <Card className="bg-surface border-border">
                  <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle2 className="w-5 h-5 text-accent-verified" />
                      Result Verified on Midnight
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="bg-background rounded-md p-4 border border-border">
                      <div className="text-sm text-muted-foreground mb-1">On-Chain Result Hash</div>
                      <div className="font-mono text-sm break-all text-primary">{resultHash}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-full min-h-[300px] border-dashed border-border/50 bg-background flex flex-col items-center justify-center text-center p-6">
                <Shield className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <CardTitle className="text-muted-foreground">Listening to Indexer...</CardTitle>
                <CardDescription className="max-w-xs mt-2">
                  Waiting for the provider to submit the result hash to the smart contract on the Midnight Preview network.
                </CardDescription>
              </Card>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
