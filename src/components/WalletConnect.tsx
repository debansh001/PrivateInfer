"use client";

import { Loader2, LogOut, Shield, Smartphone } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

export default function WalletConnect() {
  const { isConnected, address, walletType, walletStatus, isConnecting, connect, disconnect } = useWallet();

  if (walletStatus === 'checking')
    return <span className="text-zinc-600 text-[11px] font-mono animate-pulse">Checking wallet...</span>;

  if (isConnected)
    return (
      <div className="flex items-center gap-3 border border-border px-4 py-2 rounded-md bg-surface">
        {walletType === 'lace'
          ? <Smartphone className="w-3.5 h-3.5 text-accent-primary" />
          : <Shield className="w-3.5 h-3.5 text-accent-primary" />}
        <div>
          <span className="text-[9px] tracking-[0.2em] font-mono text-muted-foreground uppercase block">
            {walletType === '1am' ? '1AM' : 'Lace'}
          </span>
          <span className="text-[11px] font-mono text-primary truncate max-w-[130px] block">{address}</span>
        </div>
        <button onClick={disconnect} title="Disconnect" className="text-muted-foreground hover:text-red-400">
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => connect('preview')}
        disabled={isConnecting}
        className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary/90 text-background text-[11px] font-mono tracking-widest uppercase py-2.5 px-5 transition-all disabled:opacity-40 rounded-md"
      >
        {isConnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
        Connect 1AM Wallet
      </button>
      {walletStatus === 'not-found' &&
        <p className="text-[10px] font-mono text-muted-foreground">Install 1AM wallet extension</p>}
    </div>
  );
}
