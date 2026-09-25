/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Database,
  Server,
  Rocket,
  Clock,
  Shield,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Copy,
} from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { createUnprovenDeployTx, submitTxAsync } from "@midnight-ntwrk/midnight-js-contracts";

import { CompiledContract } from "@midnight-ntwrk/compact-js";
import { Contract } from "../../../contracts/managed/privateinfer/contract/index.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Query {
  id: string;
  status: "PROCESSING" | "RESULT_READY" | "PAID" | "FAILED";
  createdAt: string;
  updatedAt?: string;
}

interface Provider {
  id: string;
  name: string;
  modelHash: string;
  createdAt?: string;
}

type Tab = "overview" | "queries" | "providers" | "deploy";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncate(str: string, len = 12): string {
  if (!str) return "—";
  return str.length > len ? `${str.slice(0, len)}…` : str;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function useLiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Query["status"] }) {
  const map: Record<string, string> = {
    PROCESSING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    RESULT_READY: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    PAID: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    FAILED: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${
        map[status] ?? "bg-zinc-700 text-zinc-300 border-zinc-600"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  delay,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay ?? 0 }}
      className="rounded-xl border border-[#252D44] bg-[#141827] p-5 flex items-center gap-4"
    >
      <div className={`rounded-lg p-2.5 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-white tabular-nums">{value}</p>
      </div>
    </motion.div>
  );
}

function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-xl border border-[#252D44] bg-[#141827] overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#252D44]">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({
  queries,
  provider,
  loading,
  onRefresh,
}: {
  queries: Query[];
  provider: Provider | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const total = queries.length;
  const processing = queries.filter((q) => q.status === "PROCESSING").length;
  const paid = queries.filter((q) => q.status === "PAID").length;
  const contractAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  return (
    <div className="space-y-6">
      {/* Stat grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Queries" value={loading ? "…" : total} icon={Database} accent="bg-blue-500/10 text-blue-400" delay={0} />
        <StatCard label="Processing" value={loading ? "…" : processing} icon={RefreshCw} accent="bg-yellow-500/10 text-yellow-400" delay={0.05} />
        <StatCard label="Providers" value={loading ? "…" : provider ? 1 : 0} icon={Server} accent="bg-violet-500/10 text-violet-400" delay={0.1} />
        <StatCard label="Completed" value={loading ? "…" : paid} icon={CheckCircle} accent="bg-emerald-500/10 text-emerald-400" delay={0.15} />
      </div>

      {/* System status */}
      <SectionCard
        title="System Status"
        action={
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-[#252D44] bg-[#0B0E17] px-4 py-3">
            <span className="text-xs font-medium text-slate-500">Contract Address</span>
            {contractAddress ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-300">{truncate(contractAddress, 20)}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(contractAddress)}
                  className="text-slate-600 hover:text-slate-300 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <span className="text-xs text-red-400">Not deployed</span>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[#252D44] bg-[#0B0E17] px-4 py-3">
            <span className="text-xs font-medium text-slate-500">Network</span>
            <span className="rounded-full bg-violet-500/15 border border-violet-500/30 px-2.5 py-0.5 text-xs font-semibold text-violet-400">
              PREPROD
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[#252D44] bg-[#0B0E17] px-4 py-3">
            <span className="text-xs font-medium text-slate-500">Database</span>
            <div className="flex items-center gap-2">
              {loading ? (
                <span className="text-xs text-slate-500">Checking…</span>
              ) : total >= 0 ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                  <span className="text-xs text-emerald-400 font-medium">Connected</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="text-xs text-red-400 font-medium">Error</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[#252D44] bg-[#0B0E17] px-4 py-3">
            <span className="text-xs font-medium text-slate-500">Active Provider</span>
            {provider ? (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                <span className="font-mono text-xs text-slate-300">{truncate(provider.modelHash, 18)}</span>
              </div>
            ) : (
              <span className="text-xs text-slate-500">None registered</span>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Tab: Queries ─────────────────────────────────────────────────────────────

function QueriesTab({
  queries,
  loading,
  onRefresh,
}: {
  queries: Query[];
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <SectionCard
      title={`All Queries (${queries.length})`}
      action={
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-600">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm">Loading queries…</span>
        </div>
      ) : queries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-600 gap-2">
          <Database className="h-8 w-8 opacity-40" />
          <span className="text-sm">No queries found</span>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#252D44]">
                {["Query ID", "Status", "Created At", "Action"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queries.map((q, i) => (
                <motion.tr
                  key={q.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[#252D44]/60 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-400">
                    <span title={q.id}>{truncate(q.id, 14)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{formatDate(q.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <a
                      href={`/status/${q.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors hover:underline"
                    >
                      View Status →
                    </a>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Tab: Providers ───────────────────────────────────────────────────────────

function ProvidersTab({
  provider,
  loading,
  onRefresh,
}: {
  provider: Provider | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <SectionCard
      title="Registered Providers"
      action={
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-600">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm">Loading providers…</span>
        </div>
      ) : !provider ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-600 gap-2">
          <Server className="h-8 w-8 opacity-40" />
          <span className="text-sm">No provider nodes registered</span>
          <span className="text-xs text-slate-700 max-w-xs text-center">
            Provider nodes self-register via the /provider dashboard
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#252D44]">
                {["Provider ID", "Model Hash", "Name"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <motion.tr
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-[#252D44]/60 hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-5 py-4 font-mono text-xs text-slate-400">
                  <span title={provider.id}>{truncate(provider.id, 16)}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-300" title={provider.modelHash}>
                      {truncate(provider.modelHash, 20)}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(provider.modelHash)}
                      className="text-slate-600 hover:text-slate-300 transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500">{provider.name}</td>
              </motion.tr>
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Tab: Deploy ──────────────────────────────────────────────────────────────

function DeployTab() {
  const { isConnected, session, connect } = useWallet();
  const [address, setAddress] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);

  const getCompiledContract = () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Contract type mismatch in CI
    return CompiledContract.make("privateinfer", Contract).pipe(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Witnesses type mismatch in CI
      CompiledContract.withWitnesses({
        callerAddress: (context: any) => [context.state, new Uint8Array(32)],
      }),
      CompiledContract.withCompiledFileAssets("/zk/privateinfer")
    ) as any;
  };

  const handleDeploy = async () => {
    if (!session) return;
    setDeploying(true);
    try {
      const deployTxData = await createUnprovenDeployTx(session.providers as any, {
        compiledContract: getCompiledContract(),
        args: [],
        signingKey: Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
      });
      await submitTxAsync(session.providers as any, {
        unprovenTx: deployTxData.private.unprovenTx,
      });
      setAddress(deployTxData.public.contractAddress);
    } catch (e) {
      console.error(e);
      alert("Failed to deploy: " + (e as Error).message);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-lg mx-auto space-y-5"
    >
      <div className="rounded-xl border border-[#252D44] bg-[#141827] p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-violet-500/10 p-2.5 text-violet-400">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Deploy Marketplace Contract</h3>
            <p className="text-xs text-slate-500 mt-0.5">Deploys the PrivateInfer smart contract to PREPROD</p>
          </div>
        </div>

        <div className="rounded-lg border border-[#252D44] bg-[#0B0E17] px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">Network</span>
          <span className="rounded-full bg-violet-500/15 border border-violet-500/30 px-2.5 py-0.5 text-xs font-semibold text-violet-400">
            PREPROD
          </span>
        </div>

        <div className="rounded-lg border border-[#252D44] bg-[#0B0E17] px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">Wallet</span>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                <span className="text-xs text-emerald-400 font-medium">Connected</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="text-xs text-red-400 font-medium">Disconnected</span>
              </>
            )}
          </div>
        </div>

        {!isConnected ? (
          <Button
            onClick={() => connect()}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold"
          >
            <Shield className="h-4 w-4 mr-2" />
            Connect 1AM Wallet
          </Button>
        ) : (
          <Button
            onClick={handleDeploy}
            disabled={deploying}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold"
          >
            {deploying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Deploying…
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Deploy Contract
              </>
            )}
          </Button>
        )}
      </div>

      <AnimatePresence>
        {address && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">Deployed Successfully!</span>
            </div>
            <p className="text-xs text-slate-400">Add this to your Vercel environment variables:</p>
            <div className="flex items-center gap-2">
              <pre className="flex-1 overflow-x-auto rounded-lg bg-[#0B0E17] border border-[#252D44] px-3 py-2 font-mono text-xs text-emerald-300">
                {`NEXT_PUBLIC_MARKETPLACE_ADDRESS=${address}`}
              </pre>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(`NEXT_PUBLIC_MARKETPLACE_ADDRESS=${address}`)
                }
                className="shrink-0 rounded-lg border border-[#252D44] bg-[#0B0E17] p-2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if (!correctPassword) {
      setError("Admin panel not configured. Set NEXT_PUBLIC_ADMIN_PASSWORD.");
      return;
    }
    if (password === correctPassword) {
      onLogin();
    } else {
      setError("Incorrect password. Try again.");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E17] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* Logo area */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-xl shadow-violet-900/40"
          >
            <Shield className="h-7 w-7 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Access</h1>
          <p className="mt-1 text-sm text-slate-500">PrivateInfer Control Panel</p>
        </div>

        {/* Card */}
        <motion.div
          animate={shaking ? { x: [-8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-[#252D44] bg-[#141827] p-6 shadow-2xl"
        >
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                autoFocus
                className="w-full rounded-lg border border-[#252D44] bg-[#0B0E17] px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/30"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                  <p className="text-xs text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-violet-900/30"
            >
              Authenticate
            </button>
          </form>
        </motion.div>

        <p className="mt-6 text-center text-xs text-slate-700">
          PrivateInfer · Midnight PREPROD
        </p>
      </motion.div>
    </div>
  );
}

// ─── Tab navigation config ────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "queries", label: "Queries", icon: Database },
  { id: "providers", label: "Providers", icon: Server },
  { id: "deploy", label: "Deploy", icon: Rocket },
];

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [queries, setQueries] = useState<Query[]>([]);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(false);
  const clock = useLiveClock();

  const fetchQueries = useCallback(async () => {
    setLoadingQueries(true);
    try {
      const res = await fetch("/api/queries");
      if (res.ok) {
        const data = await res.json();
        setQueries(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch queries:", e);
    } finally {
      setLoadingQueries(false);
    }
  }, []);

  const fetchProvider = useCallback(async () => {
    setLoadingProvider(true);
    try {
      const res = await fetch("/api/providers");
      if (res.ok) {
        const data = await res.json();
        setProvider(data || null);
      }
    } catch (e) {
      console.error("Failed to fetch provider:", e);
    } finally {
      setLoadingProvider(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQueries();
     
    fetchProvider();
  }, [fetchQueries, fetchProvider]);

  const loading = loadingQueries || loadingProvider;

  const handleRefresh = () => {
    fetchQueries();
    fetchProvider();
  };

  return (
    <div className="min-h-screen bg-[#0B0E17] text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#252D44] bg-[#0B0E17]/90 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 shadow-md shadow-violet-900/40">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">PrivateInfer Admin</span>
          <span className="rounded-full bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-400">
            PREPROD
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          <span className="tabular-nums font-mono">
            {clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Tab bar */}
        <nav className="mb-6 flex gap-1 rounded-xl border border-[#252D44] bg-[#141827] p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors sm:justify-start sm:flex-none sm:px-4 ${
                activeTab === id
                  ? "bg-[#0B0E17] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              {id === "queries" && queries.length > 0 && (
                <span className="ml-1 hidden rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-400 sm:inline">
                  {queries.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && (
              <OverviewTab queries={queries} provider={provider} loading={loading} onRefresh={handleRefresh} />
            )}
            {activeTab === "queries" && (
              <QueriesTab queries={queries} loading={loadingQueries} onRefresh={fetchQueries} />
            )}
            {activeTab === "providers" && (
              <ProvidersTab provider={provider} loading={loadingProvider} onRefresh={fetchProvider} />
            )}
            {activeTab === "deploy" && <DeployTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return <Dashboard />;
}
