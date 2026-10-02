import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Zap } from 'lucide-react';
import { useTokenStore } from '../../store/tokenStore';

interface TokenGateProps {
  cost: number;
  action: string;
  children: React.ReactNode;
}

export const TokenGate: React.FC<TokenGateProps> = ({ cost, action, children }) => {
  const balance = useTokenStore((s) => s.balance);
  const canAfford = balance >= cost;

  if (canAfford) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-40 select-none">
        {children}
      </div>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center z-20">
        <div className="text-center space-y-3 p-6">
          <Lock className="w-8 h-8 text-red-500 mx-auto" />
          <div className="flex items-center justify-center gap-2 text-white font-black text-sm uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-400" />
            {cost} tokens required
          </div>
          <p className="text-zinc-400 text-xs">
            Balance: <span className="text-white font-bold">{balance}</span> tokens
          </p>
          <Link
            to="/settings"
            className="inline-block px-4 py-2 bg-brand-500 text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-brand-400 transition-colors"
          >
            Top Up
          </Link>
        </div>
      </div>
    </div>
  );
};
