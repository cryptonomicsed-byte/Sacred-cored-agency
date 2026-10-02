import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface TokenState {
  balance: number;
  tier: 'free' | 'pro' | 'agency';
  setBalance: (n: number) => void;
  setTier: (t: 'free' | 'pro' | 'agency') => void;
  deductOptimistic: (n: number) => void;
  rollback: (n: number) => void;
  reset: () => void;
}

export const useTokenStore = create<TokenState>()(
  persist(
    (set) => ({
      balance: 0,
      tier: 'free',
      setBalance: (n) => set({ balance: n }),
      setTier: (t) => set({ tier: t }),
      deductOptimistic: (n) => set((state) => ({ balance: Math.max(0, state.balance - n) })),
      rollback: (n) => set((state) => ({ balance: state.balance + n })),
      reset: () => set({ balance: 0, tier: 'free' }),
    }),
    {
      name: 'sca-tokens',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
