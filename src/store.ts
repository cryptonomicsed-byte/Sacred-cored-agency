
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { BrandDNA, Campaign, UserTier, VideoJob, Agent, LeadProfile, ProviderConfig } from './types';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { useTokenStore } from './store/tokenStore';

/**
 * Custom IndexedDB Storage for Zustand
 * Fixes "Quota Exceeded" errors by using IndexedDB (GBs of space) 
 * instead of LocalStorage (5MB limit).
 */
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('coredna_db', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('store');
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('store', 'readonly');
        const store = tx.objectStore('store');
        const getRequest = store.get(name);
        getRequest.onsuccess = () => resolve(getRequest.result || null);
      };
      request.onerror = () => resolve(null);
    });
  },
  setItem: async (name: string, value: string): Promise<void> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('coredna_db', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('store');
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('store', 'readwrite');
        const store = tx.objectStore('store');
        store.put(value, name);
        tx.oncomplete = () => resolve();
      };
    });
  },
  removeItem: async (name: string): Promise<void> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('coredna_db', 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('store', 'readwrite');
        const store = tx.objectStore('store');
        store.delete(name);
        tx.oncomplete = () => resolve();
      };
    });
  },
};

interface AppState {
  isAuthenticated: boolean;
  userId: string | null;
  isAuthReady: boolean;
  isDemo: boolean;
  currentBrand: BrandDNA | null;
  brands: BrandDNA[];
  campaigns: Campaign[];
  leads: LeadProfile[];
  userTier: UserTier;
  tokens: number;
  credits: number;
  videoJobs: VideoJob[];
  agents: Agent[];
  providers: ProviderConfig;
  showTrendPulse: boolean;
  customGeminiKey: string;
  isSidebarOpen: boolean;
  isNavOpen: boolean;
  
  setAuth: (userId: string | null) => void;
  setAuthReady: (ready: boolean) => void;
  setDemo: (isDemo: boolean) => void;
  setBrand: (brand: BrandDNA) => void;
  addBrand: (brand: BrandDNA) => void;
  updateBrand: (id: string, updates: Partial<BrandDNA>) => void;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (campaignId: string, updates: Partial<Campaign>) => void;
  addLeads: (newLeads: LeadProfile[]) => void;
  updateLead: (id: string, updates: Partial<LeadProfile>) => void;
  deleteLead: (id: string) => void;
  scheduleAsset: (assetId: string, scheduledAt: string) => Promise<void>;
  setTier: (tier: UserTier) => void;
  deductTokens: (amount: number) => void;
  addTokens: (amount: number) => void;
  deductCredits: (amount: number) => Promise<boolean>;
  addVideoJob: (job: VideoJob) => void;
  updateVideoJob: (id: string, updates: Partial<VideoJob>) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  updateProviders: (updates: Partial<ProviderConfig>) => void;
  setCustomGeminiKey: (key: string) => void;
  toggleTrendPulse: () => void;
  toggleSidebar: () => void;
  toggleNav: () => void;
  syncTokens: () => Promise<void>;
  logout: () => Promise<void>;
  reset: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      userId: null,
      isAuthReady: false,
      isDemo: false,
      currentBrand: null,
      brands: [],
      campaigns: [],
      leads: [],
      userTier: 'pro',
      tokens: 500,
      credits: 100,
      videoJobs: [],
      agents: [],
      showTrendPulse: false, 
      customGeminiKey: '',
      isSidebarOpen: false,
      isNavOpen: false,
      providers: {
        activeLLM: 'gemini',
        activeImage: 'gemini',
        activeVideo: 'veo',
        activeWorkflow: 'n8n'
      },
      
      setAuth: (userId) => set({ userId, isAuthenticated: !!userId }),
      setAuthReady: (ready) => set({ isAuthReady: ready }),
      setDemo: (isDemo) => set({ isDemo }),
      setBrand: (brand) => set({ currentBrand: brand }),
      addBrand: async (brand) => {
        const { userId } = get();
        if (!userId) return;
        try {
          await setDoc(doc(db, 'users', userId, 'brands', brand.id), brand);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${userId}/brands/${brand.id}`);
        }
      },
      updateBrand: async (id, updates) => {
        const { userId } = get();
        if (!userId) return;
        try {
          await updateDoc(doc(db, 'users', userId, 'brands', id), updates);
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `users/${userId}/brands/${id}`);
        }
      },
      addCampaign: async (campaign) => {
        const { userId } = get();
        if (!userId) return;
        try {
          await setDoc(doc(db, 'users', userId, 'campaigns', campaign.id), campaign);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${userId}/campaigns/${campaign.id}`);
        }
      },
      updateCampaign: async (id, updates) => {
        const { userId } = get();
        if (!userId) return;
        try {
          await updateDoc(doc(db, 'users', userId, 'campaigns', id), updates);
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `users/${userId}/campaigns/${id}`);
        }
      },
      
      addLeads: async (newLeads) => {
        const { userId } = get();
        if (!userId) return;
        try {
          for (const lead of newLeads) {
            await setDoc(doc(db, 'users', userId, 'leads', lead.id), lead);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${userId}/leads`);
        }
      },
      updateLead: async (id, updates) => {
        const { userId } = get();
        if (!userId) return;
        try {
          await updateDoc(doc(db, 'users', userId, 'leads', id), updates);
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `users/${userId}/leads/${id}`);
        }
      },
      deleteLead: async (id) => {
        const { userId } = get();
        if (!userId) return;
        try {
          await deleteDoc(doc(db, 'users', userId, 'leads', id));
        } catch (e) {
          handleFirestoreError(e, OperationType.DELETE, `users/${userId}/leads/${id}`);
        }
      },
      
      scheduleAsset: async (assetId, scheduledAt) => {
        const { userId, campaigns } = get();
        if (!userId) return;
        
        // Find the asset and its parent campaign
        let targetAsset: any = null;
        let targetCampaign: any = null;
        
        campaigns.forEach(c => {
          const asset = c.assets.find(a => a.id === assetId);
          if (asset) {
            targetAsset = asset;
            targetCampaign = c;
          }
        });

        if (!targetAsset || !targetCampaign) return;

        // Update in Firestore
        try {
          const updatedAssets = targetCampaign.assets.map((a: any) => 
            a.id === assetId 
              ? { ...a, metadata: { ...a.metadata, status: 'approved', scheduledAt } }
              : a
          );
          
          await updateDoc(doc(db, 'users', userId, 'campaigns', targetCampaign.id), {
            assets: updatedAssets
          });

          // Also trigger the server-side scheduling logic
          await fetch('/api/social/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaignId: targetCampaign.id,
              assetId,
              scheduledAt,
              platforms: [targetAsset.metadata.channel],
              content: targetAsset.content,
              userId
            })
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `users/${userId}/campaigns/${targetCampaign.id}`);
        }
      },
      
      setTier: async (tier) => {
        const { userId } = get();
        if (!userId) return;
        try {
          await updateDoc(doc(db, 'users', userId), { userTier: tier });
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
        }
      },
      deductTokens: async (amount) => {
        const { userId, tokens } = get();
        if (!userId) return;
        try {
          await updateDoc(doc(db, 'users', userId), { tokens: Math.max(0, tokens - amount) });
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
        }
      },
      addTokens: async (amount) => {
        const { userId, tokens } = get();
        if (!userId) return;
        try {
          await updateDoc(doc(db, 'users', userId), { tokens: tokens + amount });
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
        }
      },
      deductCredits: async (amount) => {
        const { userId, credits } = get();
        if (!userId || credits < amount) return false;
        try {
          await updateDoc(doc(db, 'users', userId), { credits: credits - amount });
          return true;
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
          return false;
        }
      },
      addVideoJob: async (job) => {
        const { userId } = get();
        if (!userId) return;
        try {
          await setDoc(doc(db, 'users', userId, 'videoJobs', job.id), job);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${userId}/videoJobs/${job.id}`);
        }
      },
      updateVideoJob: async (id, updates) => {
        const { userId } = get();
        if (!userId) return;
        try {
          await updateDoc(doc(db, 'users', userId, 'videoJobs', id), updates);
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `users/${userId}/videoJobs/${id}`);
        }
      },

      addAgent: async (agent) => {
        const { userId } = get();
        if (!userId) return;
        try {
          await setDoc(doc(db, 'users', userId, 'agents', agent.id), agent);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${userId}/agents/${agent.id}`);
        }
      },
      updateAgent: async (id, updates) => {
        const { userId } = get();
        if (!userId) return;
        try {
          await updateDoc(doc(db, 'users', userId, 'agents', id), updates);
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `users/${userId}/agents/${id}`);
        }
      },
      deleteAgent: async (id) => {
        const { userId } = get();
        if (!userId) return;
        try {
          await deleteDoc(doc(db, 'users', userId, 'agents', id));
        } catch (e) {
          handleFirestoreError(e, OperationType.DELETE, `users/${userId}/agents/${id}`);
        }
      },

      updateProviders: (updates) => set((state) => ({
        providers: { ...state.providers, ...updates }
      })),
      
      setCustomGeminiKey: (key) => set({ customGeminiKey: key }),
      
      toggleTrendPulse: () => set((state) => ({ showTrendPulse: !state.showTrendPulse })),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      toggleNav: () => set((state) => ({ isNavOpen: !state.isNavOpen })),
      
      syncTokens: async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;
          const idToken = await user.getIdToken();
          const res = await fetch('/api/user/tokens', {
            headers: { 'Authorization': `Bearer ${idToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            set({ tokens: data.tokens });
            useTokenStore.getState().setBalance(data.tokens);
            if (data.tier) {
              useTokenStore.getState().setTier(data.tier);
            }
          }
        } catch (e) {
          console.error("Token sync failed", e);
        }
      },

      logout: async () => {
        try {
          await signOut(auth);
          get().reset();
        } catch (e) {
          console.error("Logout failed", e);
        }
      },

      reset: () => {
        useTokenStore.getState().reset();
        set({ isAuthenticated: false, userId: null, currentBrand: null, brands: [], campaigns: [], videoJobs: [], agents: [], leads: [] });
      }
    }),
    {
      name: 'sacred-core-vault',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        brands: state.brands,
        currentBrand: state.currentBrand,
        campaigns: state.campaigns,
        leads: state.leads,
        userTier: state.userTier,
        tokens: state.tokens,
        credits: state.credits,
        videoJobs: state.videoJobs,
        agents: state.agents,
        providers: state.providers,
        showTrendPulse: state.showTrendPulse,
        customGeminiKey: state.customGeminiKey,
        isSidebarOpen: state.isSidebarOpen,
        isNavOpen: state.isNavOpen,
      }),
    }
  )
);
