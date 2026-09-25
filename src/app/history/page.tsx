"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  History,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QueryRecord {
  id: string;
  status: "PROCESSING" | "RESULT_READY" | "PAID" | "FAILED";
  commitmentHash: string;
  reward: string;
  createdAt: string;
  updatedAt: string;
  decryptedData?: string;
  proofHash?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncate(str: string, len = 16) {
  if (!str) return "—";
  return str.length > len ? `${str.slice(0, len)}…` : str;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusBadge({ status }: { status: QueryRecord["status"] }) {
  const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    PROCESSING: {
      cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      label: "Processing",
    },
    RESULT_READY: {
      cls: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: "Result Ready",
    },
    PAID: {
      cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: "Paid",
    },
    FAILED: {
      cls: "bg-red-500/10 text-red-400 border-red-500/30",
      icon: <AlertCircle className="w-3 h-3" />,
      label: "Failed",
    },
  };
  const s = map[status] ?? { cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30", icon: null, label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const { isConnected, address, connect, isConnecting } = useWallet();
  const [queries, setQueries] = useState<QueryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchHistory = async (walletAddress: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/queries?wallet=${encodeURIComponent(walletAddress)}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setQueries(Array.isArray(data) ? data : []);
      setLastRefresh(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load query history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchHistory(address);
    }
  }, [isConnected, address]);

  // ── Not connected ─────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-accent-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-3">Connect Your Wallet</h1>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            Connect your <span className="text-accent-primary font-semibold">1AM Wallet</span> to view your query history on the Midnight PREPROD network.
          </p>
          <Button
            onClick={() => connect()}
            disabled={isConnecting}
            className="bg-accent-primary hover:bg-accent-primary/90 text-white px-6"
          >
            {isConnecting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting…</>
            ) : (
              <><Wallet className="w-4 h-4 mr-2" /> Connect 1AM Wallet</>
            )}
          </Button>
        </motion.div>
      </main>
    );
  }

  // ── Connected ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-[calc(100vh-4rem)] py-12 px-4">
      <div className="container mx-auto max-w-4xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <History className="w-5 h-5 text-accent-primary" />
              <h1 className="text-2xl font-display font-bold">Query History</h1>
            </div>
            <p className="text-muted-foreground text-sm font-mono">
              {truncate(address ?? "", 28)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-xs text-muted-foreground">
                Updated {timeAgo(lastRefresh.toISOString())}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => address && fetchHistory(address)}
              disabled={loading}
              className="border-border"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href="/query/new">
              <Button size="sm" className="bg-accent-primary hover:bg-accent-primary/90 text-white">
                New Query <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 mb-6 text-sm text-red-400"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeleton */}
        {loading && queries.length === 0 && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface h-20 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && queries.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-14 h-14 rounded-2xl bg-surface-raised border border-border flex items-center justify-center mx-auto mb-5">
              <History className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No queries yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
              Queries you submit using this wallet will appear here. Each query is ZK-verified on Midnight PREPROD.
            </p>
            <Link href="/query/new">
              <Button className="bg-accent-primary hover:bg-accent-primary/90 text-white">
                Submit Your First Query <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Query list */}
        <AnimatePresence>
          {queries.length > 0 && (
            <motion.div className="space-y-3">
              {queries.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="rounded-xl border border-border bg-surface p-4 hover:border-accent-primary/30 transition-colors group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: ID + hash */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={q.status} />
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(q.createdAt)}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground truncate">
                        ID: {truncate(q.id, 40)}
                      </p>
                      {q.proofHash && (
                        <p className="font-mono text-xs text-accent-verified/70 mt-0.5 truncate">
                          Proof: {truncate(q.proofHash, 36)}
                        </p>
                      )}
                    </div>

                    {/* Right: reward + actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-accent-primary tabular-nums">
                        {q.reward}
                      </span>
                      <a
                        href={`https://explorer.1am.xyz/address/${address}?network=preprod`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-accent-primary hover:bg-accent-primary/10 transition-colors"
                        title="View on 1AM Explorer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Link href={`/query/${q.id}`}>
                        <Button size="sm" variant="outline" className="border-border group-hover:border-accent-primary/40 transition-colors">
                          View Status <ArrowRight className="w-3 h-3 ml-1.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Expandable result preview (only when RESULT_READY or PAID) */}
                  {q.decryptedData && (q.status === "RESULT_READY" || q.status === "PAID") && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">AI Result Preview</p>
                      <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                        {q.decryptedData}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats footer */}
        {queries.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 grid grid-cols-3 gap-4 p-4 rounded-xl border border-border bg-surface-raised/60"
          >
            {[
              { label: "Total Queries", value: queries.length },
              { label: "Completed", value: queries.filter(q => q.status === "PAID").length },
              { label: "Pending", value: queries.filter(q => q.status === "PROCESSING" || q.status === "RESULT_READY").length },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold font-display text-accent-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        )}

      </div>
    </main>
  );
}
