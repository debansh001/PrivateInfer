/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cpu, Server, Activity, ArrowRight, ShieldCheck, Play, Lock, CheckCircle2 } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";

import { createUnprovenCallTx, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/compact-js';

// @ts-expect-error Types mismatch for keys in different Midnight SDK versions
import { Contract } from '../../../contracts/managed/privateinfer/contract/index.js';

type DBQuery = {
  id: string; // The contract address
  status: string;
  createdAt: string;
};

type OnChainQuery = DBQuery & {
  chainStatus: string;
  isPolling: boolean;
};

export default function ProviderDashboard() {
  const [queries, setQueries] = useState<OnChainQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const { isConnected, session, connect } = useWallet();

  const getCompiledContract = () => {
    return CompiledContract.make('privateinfer', Contract).pipe(
      CompiledContract.withVacantWitnesses,
      CompiledContract.withCompiledFileAssets('/zk/privateinfer'),
    ) as any;
  };

  useEffect(() => {
    fetch("/api/queries")
      .then(res => res.json())
      .then((data: DBQuery[]) => {
        setQueries(data.map(q => ({ ...q, chainStatus: "UNKNOWN", isPolling: true })));
        setIsLoading(false);
      })
      .catch(e => {
        console.error(e);
        setIsLoading(false);
      });
  }, []);

  // Poll on-chain state for all active queries
  useEffect(() => {
    if (!session || !isConnected || queries.length === 0) return;

    const pollStates = async () => {
      let updated = false;
      const nextQueries = [...queries];

      for (let i = 0; i < nextQueries.length; i++) {
        const q = nextQueries[i];
        if (!q.isPolling) continue;

        try {
          const stateData = await session.providers.publicDataProvider.queryContractState(q.id);
          if (stateData && stateData.data) {
            const ledger = Contract.ledger(stateData.data);
            if (ledger.status && ledger.status !== q.chainStatus) {
              q.chainStatus = ledger.status;
              if (ledger.status === "PAID") q.isPolling = false;
              updated = true;
            }
          }
        } catch (e) {
          // Ignored, indexer might not have it yet or it errored
        }
      }

      if (updated) setQueries(nextQueries);
      setTimeout(pollStates, 4000);
    };

    const timerId = setTimeout(pollStates, 1000);
    return () => clearTimeout(timerId);
  }, [session, isConnected, queries.length]);

  const handleSubmitResult = async (contractAddress: string) => {
    if (!session) return;
    setProcessingId(contractAddress);
    try {
      // Generate a mock result proof hash
      const resultBuffer = new Uint8Array(32);
      crypto.getRandomValues(resultBuffer);

      const callTxData = await createUnprovenCallTx(session.providers, {
        compiledContract: getCompiledContract(),
        contractAddress,
        circuitId: 'submitResult',
        args: [resultBuffer],
      });

      await submitTxAsync(session.providers, { unprovenTx: callTxData.private.unprovenTx, circuitId: 'submitResult' });
      
      // Update local state optimistically
      setQueries(queries.map(q => q.id === contractAddress ? { ...q, chainStatus: "RESULT_READY" } : q));
    } catch (e) {
      console.error(e);
      alert("Failed to submit result: " + (e as Error).message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReleasePayment = async (contractAddress: string) => {
    if (!session) return;
    setProcessingId(contractAddress);
    try {
      const callTxData = await createUnprovenCallTx(session.providers as any, {
        compiledContract: getCompiledContract(),
        contractAddress,
        circuitId: 'releasePayment',
        args: [],
      });

      await submitTxAsync(session.providers as any, { unprovenTx: callTxData.private.unprovenTx, circuitId: 'releasePayment' });
      
      setQueries(queries.map(q => q.id === contractAddress ? { ...q, chainStatus: "PAID", isPolling: false } : q));
    } catch (e) {
      console.error(e);
      alert("Failed to release payment: " + (e as Error).message);
    } finally {
      setProcessingId(null);
    }
  };

  if (!isConnected) {
    return (
      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl text-center">
        <h1 className="text-3xl font-display font-bold mb-4">Provider Dashboard</h1>
        <Card className="bg-surface border-border p-12 max-w-md mx-auto">
          <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-bold mb-2">Wallet Required</h3>
          <p className="text-muted-foreground mb-6">Connect your 1AM wallet to view and fulfill on-chain inference requests.</p>
          <Button onClick={() => connect('preview')} className="bg-accent-primary">Connect 1AM Wallet</Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Provider Dashboard</h1>
          <p className="text-muted-foreground">
            Manage incoming ZK inference requests and submit proofs directly to the Midnight chain.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-md border border-border">
          <Activity className="w-4 h-4 text-accent-verified" />
          <span className="text-sm font-medium">Node Online</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-surface border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Server className="w-4 h-4" /> Total Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{queries.filter(q => q.chainStatus === "PAID").length}</div>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Active Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{queries.filter(q => q.chainStatus === "PROCESSING" || q.chainStatus === "RESULT_READY").length}</div>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Earned (tDUST)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{queries.filter(q => q.chainStatus === "PAID").length * 5}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Inference Queue</CardTitle>
          <CardDescription>Recent queries assigned to your provider node.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading queue...</div>
          ) : queries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No queries in queue.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Contract Address</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>On-Chain Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queries.map((q) => (
                  <TableRow key={q.id} className="border-border hover:bg-background/50 transition-colors">
                    <TableCell className="font-mono text-sm">{q.id.slice(0, 16)}...</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(q.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {q.chainStatus === "UNKNOWN" && <Badge variant="outline" className="bg-background text-muted-foreground">Loading...</Badge>}
                      {q.chainStatus === "PROCESSING" && <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Processing</Badge>}
                      {q.chainStatus === "RESULT_READY" && <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Result Ready</Badge>}
                      {q.chainStatus === "PAID" && <Badge variant="outline" className="bg-accent-verified/10 text-accent-verified border-accent-verified/20">Paid</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {q.chainStatus === "PROCESSING" && (
                        <Button 
                          size="sm" 
                          className="bg-accent-primary hover:bg-accent-primary/90"
                          onClick={() => handleSubmitResult(q.id)}
                          disabled={processingId === q.id}
                        >
                          {processingId === q.id ? "Proving..." : "Submit Result"} 
                          <Play className="w-3 h-3 ml-2" />
                        </Button>
                      )}
                      {q.chainStatus === "RESULT_READY" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-accent-verified text-accent-verified hover:bg-accent-verified/10"
                          onClick={() => handleReleasePayment(q.id)}
                          disabled={processingId === q.id}
                        >
                          {processingId === q.id ? "Releasing..." : "Release Payment"} 
                          <CheckCircle2 className="w-3 h-3 ml-2" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
