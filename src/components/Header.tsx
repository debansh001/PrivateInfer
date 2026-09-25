"use client";

import Link from "next/link";
import Image from "next/image";
import { Sun, Moon, Wallet, LogOut, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useWallet } from "@/contexts/WalletContext";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { isConnected, isConnecting, address, connect, disconnect, walletStatus } = useWallet();

  // Avoid hydration mismatch — only render theme icon after mount
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const shortAddress = address
    ? `${address.slice(0, 8)}...${address.slice(-6)}`
    : null;

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/logo.png"
            alt="PrivateInfer"
            width={32}
            height={32}
            className="rounded-md transition-transform group-hover:scale-105"
          />
          <span className="font-display font-bold text-xl tracking-tight">PrivateInfer</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/query/new" className="text-muted-foreground hover:text-primary transition-colors">
            Submit Query
          </Link>
          <Link href="/provider" className="text-muted-foreground hover:text-primary transition-colors">
            Providers
          </Link>
          <Link href="/history" className="text-muted-foreground hover:text-primary transition-colors">
            History
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Dark / Light mode toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-9 h-9 flex items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-raised transition-colors"
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Moon className="w-4 h-4 text-muted-foreground" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>

          {/* Wallet Connect / Disconnect */}
          {isConnected && shortAddress ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-accent-primary/40 bg-accent-primary/5 text-sm font-medium text-accent-primary">
                <div className="w-2 h-2 rounded-full bg-accent-verified animate-pulse" />
                <span className="font-mono text-xs">{shortAddress}</span>
              </div>
              <button
                onClick={disconnect}
                className="w-9 h-9 flex items-center justify-center rounded-md border border-border bg-surface hover:bg-red-500/10 hover:border-red-500/40 transition-colors"
                aria-label="Disconnect wallet"
                title="Disconnect wallet"
              >
                <LogOut className="w-4 h-4 text-muted-foreground hover:text-red-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect()}
              disabled={isConnecting || walletStatus === "not-found"}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-accent-primary text-accent-primary hover:bg-accent-primary/10 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : walletStatus === "not-found" ? (
                <>
                  <Wallet className="w-4 h-4" />
                  No Wallet Found
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
