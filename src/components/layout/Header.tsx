import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-md bg-accent-primary flex items-center justify-center text-primary-foreground">
            <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />
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
        <div className="flex items-center gap-4">
          <Button variant="outline" className="border-accent-primary text-accent-primary hover:bg-accent-primary/10">
            Connect Wallet
          </Button>
        </div>
      </div>
    </header>
  );
}
