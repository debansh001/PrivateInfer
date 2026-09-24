"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render theme icon after mount
  useEffect(() => setMounted(true), []);

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-md bg-accent-primary flex items-center justify-center text-primary-foreground transition-transform group-hover:scale-105">
            <Lock className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">PrivateInfer</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/query/new" className="text-muted-foreground hover:text-primary transition-colors">
            Submit Query
          </Link>
          <Link href="/provider" className="text-muted-foreground hover:text-primary transition-colors">
            Providers
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

          <Link
            href="/query/new"
            className="inline-flex items-center justify-center rounded-md border border-accent-primary text-accent-primary hover:bg-accent-primary/10 px-4 py-2 text-sm font-medium transition-colors"
          >
            Connect Wallet
          </Link>
        </div>
      </div>
    </header>
  );
}
