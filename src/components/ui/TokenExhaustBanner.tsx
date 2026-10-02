import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, X } from 'lucide-react';
import { useTokenStore } from '../../store/tokenStore';

const DISMISS_KEY = 'sca-banner-dismissed';

export const TokenExhaustBanner: React.FC = () => {
  const balance = useTokenStore((s) => s.balance);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === 'true') {
      setDismissed(true);
    }
  }, []);

  // Re-show if they somehow get tokens back
  useEffect(() => {
    if (balance > 0) {
      setDismissed(false);
      sessionStorage.removeItem(DISMISS_KEY);
    }
  }, [balance]);

  if (balance > 0 || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, 'true');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-red-900/90 to-amber-900/90 backdrop-blur-xl border-t border-red-500/30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-white text-sm font-bold">
            You're out of tokens — AI features paused
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/settings"
            className="px-4 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap"
          >
            Top up
          </Link>
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
