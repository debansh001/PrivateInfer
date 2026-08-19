import Link from "next/link";
import Image from "next/image";
import { Network } from "lucide-react";
import WalletConnect from "./WalletConnect";

export function Header() {
  return (
    <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-accent-primary/10 p-1.5 rounded-md border border-accent-primary/20">
              <Image src="/logo.png" alt="PrivateInfer Logo" width={24} height={24} className="w-5 h-5 object-contain" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight hidden sm:inline-block">PrivateInfer</span>
          </Link>
          <nav className="flex items-center gap-3 md:gap-6 ml-2 md:ml-0">
            <Link href="/provider" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Provider Hub
            </Link>
            <div className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Network className="w-4 h-4" />
              <span className="px-2 py-0.5 rounded-full bg-surface-raised border border-border text-xs font-mono">
                Midnight Preview
              </span>
            </div>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
