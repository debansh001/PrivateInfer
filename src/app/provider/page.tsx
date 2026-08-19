/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cpu, Server, Activity, ArrowRight, ShieldCheck, Play, Lock, CheckCircle2 } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";

import { createUnprovenCallTx, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/compact-js';

// @ts-expect-error Types mismatch for keys in different Midnight SDK versions
// @ts-expect-error Types mismatch for keys in different Midnight SDK versions
import { Contract } from '../../../contracts/managed/privateinfer/contract/index.js';

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
  const [successfulTx, setSuccessfulTx] = useState<{ txId: string, message: string } | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  
  const { isConnected, session, connect } = useWallet();

  // Auto-register the provider wallet when they connect
  useEffect(() => {
    if (!isConnected || !session) return;
    const walletKey = String(session.providers.walletProvider.getCoinPublicKey());
    fetch("/api/provider/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Provider Node", modelHash: walletKey })
    })
      .then(res => res.json())
      .then(data => { if (data.providerId) setProviderId(data.providerId); })
      .catch(console.error);
  }, [isConnected, session]);

  const getCompiledContract = (pkBytes: Uint8Array) => {
    return CompiledContract.make('privateinfer', Contract).pipe(
      CompiledContract.withWitnesses({
        callerAddress: (context: any) => [context.state, pkBytes]
      }),
      CompiledContract.withCompiledFileAssets('/zk/privateinfer'),
    ) as any;
  };

  useEffect(() => {
    const fetchQueries = () => {
      fetch(`/api/queries?t=${Date.now()}`, { cache: "no-store" })
        .then(res => res.json())
        .then((data: DBQuery[] | any) => {
          if (!Array.isArray(data)) {
            console.error("Expected array from /api/queries, got:", data);
            setQueries([]);
            setIsLoading(false);
            return;
          }
          const onChainQueries = data.filter((q: any) => /^[0-9a-f]{64}$/i.test(q.id));
          setQueries(onChainQueries.map((q: any) => ({ ...q, chainStatus: "PROCESSING", isPolling: false })));
          setIsLoading(false);
        })
        .catch(e => {
          console.error(e);
          setIsLoading(false);
        });
    };

    fetchQueries(); // Fetch immediately on mount
    const interval = setInterval(fetchQueries, 5000); // Then poll every 5s
    
    return () => clearInterval(interval);
  }, []);

  const handleSubmitResult = async (queryIdHex: string) => {
    if (!session) return;
    setProcessingId(queryIdHex);
    try {
      // Generate a mock result proof hash
      const resultBuffer = new Uint8Array(32);
      crypto.getRandomValues(resultBuffer);

      const pkBytes = coinPublicKeyToBytes(session.providers.walletProvider.getCoinPublicKey());

      const contractAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress) throw new Error("Marketplace address not set in .env.local! Please complete Admin Setup.");

      // Validate that the queryId is a real 64-char hex on-chain ID
      if (!/^[0-9a-f]{64}$/i.test(queryIdHex)) {
        throw new Error("This query was not created on-chain and cannot be submitted.");
      }

      const queryIdBuffer = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        queryIdBuffer[i] = parseInt(queryIdHex.slice(i * 2, i * 2 + 2), 16);
      }

      const callTxData = await createUnprovenCallTx(session.providers as any, {
        compiledContract: getCompiledContract(pkBytes),
        contractAddress,
        circuitId: 'submitResult',
        args: [queryIdBuffer, resultBuffer],
      });

      const txId = await submitTxAsync(session.providers as any, { unprovenTx: callTxData.private.unprovenTx, circuitId: 'submitResult' });
      
      // Update local state optimistically
      setQueries(queries.map(q => q.id === queryIdHex ? { ...q, chainStatus: "RESULT_READY" } : q));
      setSuccessfulTx({ txId: txId as string, message: "Result Submitted Successfully" });
    } catch (e) {
      console.error(e);
      alert("Failed to submit result: " + (e as Error).message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReleasePayment = async (queryIdHex: string) => {
    if (!session) return;
    setProcessingId(queryIdHex);
    try {
      const pkBytes = coinPublicKeyToBytes(session.providers.walletProvider.getCoinPublicKey());
      
      const contractAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress) throw new Error("Marketplace address not set in .env.local! Please complete Admin Setup.");

      const queryIdBuffer = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        queryIdBuffer[i] = parseInt(queryIdHex.slice(i * 2, i * 2 + 2), 16);
      }

      const callTxData = await createUnprovenCallTx(session.providers as any, {
        compiledContract: getCompiledContract(pkBytes),
        contractAddress,
        circuitId: 'releasePayment',
        args: [queryIdBuffer],
      });

      const txId = await submitTxAsync(session.providers as any, { unprovenTx: callTxData.private.unprovenTx, circuitId: 'releasePayment' });
      
      setQueries(queries.map(q => q.id === queryIdHex ? { ...q, chainStatus: "PAID", isPolling: false } : q));
      setSuccessfulTx({ txId: txId as string, message: "Payment Released Successfully" });
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
    <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-5xl">
      {successfulTx && (
        <div className="mb-8 p-6 bg-surface border border-accent-verified rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-accent-verified/10 p-3 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-accent-verified" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{successfulTx.message}</h3>
              <p className="text-sm text-muted-foreground font-mono mt-1 break-all">SDK internal ID: {successfulTx.txId.substring(0, 30)}...</p>
            </div>
          </div>
          <div className="bg-muted text-muted-foreground p-3 rounded-md text-sm mb-4 border border-border">
            💡 <strong>To verify on-chain:</strong> Open your 1AM Wallet's <strong>Transactions</strong> tab, copy the actual Transaction Hash, and search for it in the Midnight Explorer.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSuccessfulTx(null)}>Close</Button>
            <a
              href="https://explorer.preview.midnight.network/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "8px", background: "var(--accent-primary, #7c3aed)", color: "#fff", fontSize: "14px", fontWeight: 500, textDecoration: "none", cursor: "pointer" }}
            >
              Open Midnight Explorer
            </a>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
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
            <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0 pb-4">
              <Table className="min-w-[600px]">
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
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {q.chainStatus === "UNKNOWN" && <Badge variant="outline" className="bg-background text-muted-foreground whitespace-nowrap">Loading...</Badge>}
                        {q.chainStatus === "PROCESSING" && <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 whitespace-nowrap">Processing</Badge>}
                        {q.chainStatus === "RESULT_READY" && <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 whitespace-nowrap">Result Ready</Badge>}
                        {q.chainStatus === "PAID" && <Badge variant="outline" className="bg-accent-verified/10 text-accent-verified border-accent-verified/20 whitespace-nowrap">Paid</Badge>}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {q.chainStatus === "PROCESSING" && (
                          <Button 
                            size="sm" 
                            className="bg-accent-primary hover:bg-accent-primary/90"
                            onClick={() => handleSubmitResult(q.id)}
                            disabled={processingId === q.id}
                          >
                            {processingId === q.id ? "Proving..." : "Submit Result"} 
                            <Play className="w-3 h-3 ml-2 hidden sm:inline-block" />
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
                            <CheckCircle2 className="w-3 h-3 ml-2 hidden sm:inline-block" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
