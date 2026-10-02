
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { 
  Settings, Zap, Shield, Activity, RefreshCw, 
  Cpu, Eye, EyeOff, Cloud, Database, ExternalLink, 
  CheckCircle2, AlertCircle, Play, Workflow, Palette, Film,
  ChevronDown, Globe, Box, Terminal, Layers, Sparkles, Users,
  Power, ZapOff
} from 'lucide-react';
import { healthCheckService, ProviderStatus } from '../services/healthCheckService';
import AffiliateHubPage from './AffiliateHubPage';

// --- Provider Metadata ---
const PROVIDER_METADATA: Record<string, { url: string; docs: string }> = {
  gemini: { url: 'https://aistudio.google.com/app/apikey', docs: 'https://ai.google.dev/docs' },
  n8n: { url: 'https://n8n.io/', docs: 'https://docs.n8n.io/' },
  zapier: { url: 'https://zapier.com/app/settings/details', docs: 'https://platform.zapier.com/' },
  pipedream: { url: 'https://pipedream.com/settings/api', docs: 'https://pipedream.com/docs' },
  activepieces: { url: 'https://www.activepieces.com/', docs: 'https://www.activepieces.com/docs' },
  ghl: { url: 'https://www.gohighlevel.com/', docs: 'https://developers.gohighlevel.com/' },
};

const ProviderCard = ({ 
  id, 
  name, 
  icon: Icon, 
  isActive, 
  onActivate, 
  typeLabel,
  children
}: any) => {
  const meta = PROVIDER_METADATA[id] || { url: '#', docs: '#' };

  return (
    <div className={`group relative bg-dark-surface border rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between ${
      isActive 
        ? 'border-brand-500/50 shadow-[0_0_30px_rgba(20,184,166,0.15)] ring-1 ring-brand-500/30' 
        : 'border-dark-border hover:border-zinc-700 hover:shadow-xl'
    }`}>
      {isActive && (
        <div className="absolute -top-2.5 right-6 px-2.5 py-0.5 bg-brand-500 text-black text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
          Active {typeLabel}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl transition-colors ${isActive ? 'bg-brand-500/20 text-brand-400' : 'bg-black/40 text-zinc-600 group-hover:text-zinc-400'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white uppercase tracking-tighter text-sm">{name}</h3>
              <a href={meta.url} target="_blank" rel="noreferrer" className="text-[9px] font-black text-brand-500/70 hover:text-brand-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                Get API Key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
          <button 
            onClick={onActivate}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              isActive ? 'bg-brand-500 text-black' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            {isActive ? 'Live' : 'Activate'}
          </button>
        </div>
        
        {isActive && children && (
          <div className="pt-4 border-t border-zinc-800 animate-in fade-in slide-in-from-top-1 duration-300">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

const CollapsibleSection = ({ section, providers, updateProviders, typeLabel, customGeminiKey, setCustomGeminiKey }: any) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showKey, setShowKey] = useState(false);

  return (
    <section className="space-y-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between group border-b border-dark-border pb-4 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-brand-500/5 rounded-lg border border-brand-500/10">
            <section.headerIcon className="w-5 h-5 text-brand-500" />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              {section.title}
              <span className="text-[10px] font-black bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full tracking-widest">{section.items.length} Options</span>
            </h2>
            <p className="text-zinc-500 font-medium text-xs mt-0.5">{section.description}</p>
          </div>
        </div>
        <div className={`p-2 rounded-full transition-all ${isOpen ? 'rotate-180 bg-brand-500/10 text-brand-500' : 'bg-zinc-900 text-zinc-600 group-hover:text-zinc-400'}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>
      
      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2 animate-in slide-in-from-top-2 duration-300">
          {section.items.map((item: any) => (
            <ProviderCard 
              key={item.id}
              id={item.id}
              name={item.name}
              icon={item.icon}
              isActive={(providers as any)[section.type] === item.id}
              onActivate={() => updateProviders({ [section.type]: item.id })}
              typeLabel={typeLabel}
            >
              {item.id === 'gemini' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Custom API Key (Optional)</label>
                    <button onClick={() => setShowKey(!showKey)} className="text-zinc-600 hover:text-white transition-colors">
                      {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type={showKey ? "text" : "password"}
                      value={customGeminiKey}
                      onChange={(e) => setCustomGeminiKey(e.target.value)}
                      placeholder="Paste your key here..."
                      className="w-full bg-black/40 border border-zinc-800 rounded-lg py-2 px-3 text-[10px] text-white focus:border-brand-500 outline-none transition-all font-mono"
                    />
                    {customGeminiKey && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      </div>
                    )}
                  </div>
                  <p className="text-[8px] text-zinc-600 leading-tight">
                    Bypasses Sacred Core proxy. Direct client-side inference enabled.
                  </p>
                </div>
              )}
            </ProviderCard>
          ))}
        </div>
      )}
    </section>
  );
};

const SettingsPage = () => {
  const { userTier, setTier, tokens, addTokens, providers, updateProviders, showTrendPulse, toggleTrendPulse, syncTokens, customGeminiKey, setCustomGeminiKey } = useStore();
  const [activeTab, setActiveTab] = useState<'neural' | 'billing' | 'affiliate'>('neural');
  const [isBuying, setIsBuying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    syncTokens();
  }, [syncTokens]);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncTokens();
    setIsSyncing(false);
  };

  useEffect(() => {
    const status = searchParams.get('status');
    const sessionId = searchParams.get('session_id');

    if (status === 'success' && sessionId) {
      // In a real app, you'd verify the session on the server
      // For this demo, we'll optimistically add tokens based on the URL
      addTokens(1000);
      alert("Purchase successful! 1,000 tokens added to your account.");
      // Clear the URL params
      window.history.replaceState({}, '', window.location.pathname + window.location.hash.split('?')[0]);
    } else if (status === 'cancel') {
      alert("Purchase cancelled.");
      window.history.replaceState({}, '', window.location.pathname + window.location.hash.split('?')[0]);
    }
  }, [searchParams, addTokens]);

  const handleBuyTokens = async (packageId: string) => {
    // TODO: Stripe integration post-launch
    // Payments will be added when ready
    setIsBuying(true);
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, userId: 'user_123' }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error("Billing error", e);
    } finally {
      setIsBuying(false);
    }
  };

  const sections = [
    {
      title: 'LLM Inference Engines',
      headerIcon: Cpu,
      description: 'Linguistic core for strategy and assets.',
      type: 'activeLLM',
      label: 'LLM',
      items: [
        { id: 'gemini', name: 'Google Gemini 3', icon: Cloud },
      ]
    },
    {
      title: 'Visual Synthesis Engines',
      headerIcon: Palette,
      description: 'Image generation and design diffusion.',
      type: 'activeImage',
      label: 'Vision',
      items: [
        { id: 'gemini', name: 'Gemini 2.5 Image', icon: Palette },
      ]
    },
    {
      title: 'Motion Synthesis Engines',
      headerIcon: Film,
      description: 'Video and animation generation pipeline.',
      type: 'activeVideo',
      label: 'Motion',
      items: [
        { id: 'veo', name: 'Google Veo 3', icon: Film },
      ]
    },
    {
      title: 'Automation & Workflow Fabric',
      headerIcon: Workflow,
      description: 'External platform and CRM deployment.',
      type: 'activeWorkflow',
      label: 'Fabric',
      items: [
        { id: 'n8n', name: 'n8n Cloud', icon: Workflow },
        { id: 'zapier', name: 'Zapier Central', icon: Zap },
        { id: 'pipedream', name: 'Pipedream', icon: Cloud },
        { id: 'activepieces', name: 'ActivePieces', icon: Box },
        { id: 'ghl', name: 'GoHighLevel', icon: Users },
      ]
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen pb-40">
      <div className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase">Settings</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Neural Protocol & Account Calibration</p>
        </div>
        <div className="flex bg-black/40 border border-zinc-800 rounded-2xl p-1.5 shadow-xl">
           {(['neural', 'billing', 'affiliate'] as const).map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-600 hover:text-zinc-400'}`}>
               {tab === 'neural' ? 'Neural Matrix' : tab === 'billing' ? 'Subscription' : 'Partner Hub'}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-16">
           {activeTab === 'neural' && (
             <div className="space-y-16 animate-in fade-in duration-500">
                
                {/* System Governance Card - Master Toggle */}
                <div className="bg-dark-surface border border-dark-border rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity"><Activity className="w-40 h-40" /></div>
                   <div className="flex items-center gap-8">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${showTrendPulse ? 'bg-brand-600 text-white shadow-[0_0_20px_rgba(20,184,166,0.4)]' : 'bg-zinc-800 text-zinc-500'}`}>
                         {showTrendPulse ? <Zap className="w-8 h-8 fill-current" /> : <ZapOff className="w-8 h-8" />}
                      </div>
                      <div>
                         <h2 className="text-2xl font-black text-white uppercase tracking-tighter">System Governance</h2>
                         <p className="text-zinc-500 text-sm font-medium mt-1">Control the Global Neural Feed (Trending Pulse) to conserve API resource quotas.</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 bg-black/40 p-4 rounded-3xl border border-zinc-800">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${showTrendPulse ? 'text-brand-500' : 'text-zinc-700'}`}>
                         {showTrendPulse ? 'Feed Active' : 'Feed Disabled'}
                      </span>
                      <button 
                        onClick={toggleTrendPulse}
                        className={`w-14 h-7 rounded-full transition-all duration-300 relative border ${
                          showTrendPulse ? 'bg-brand-600 border-brand-400 shadow-inner' : 'bg-zinc-900 border-zinc-700'
                        }`}
                      >
                         <div className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center shadow-lg ${
                           showTrendPulse ? 'right-1 bg-white text-brand-600' : 'left-1 bg-zinc-700 text-zinc-400'
                         }`}>
                            <Power className="w-3 h-3" />
                         </div>
                      </button>
                   </div>
                </div>

                {sections.map((section, idx) => (
                  <CollapsibleSection 
                    key={idx} 
                    section={section} 
                    providers={providers} 
                    updateProviders={updateProviders} 
                    typeLabel={section.label} 
                    customGeminiKey={customGeminiKey}
                    setCustomGeminiKey={setCustomGeminiKey}
                  />
                ))}
                
                <div className="bg-brand-950/10 border border-brand-500/20 p-10 rounded-[3rem] flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent pointer-events-none" />
                   <div className="w-20 h-20 bg-brand-500/10 rounded-3xl flex items-center justify-center text-brand-500 shrink-0 group-hover:rotate-12 transition-transform duration-500 border border-brand-500/20">
                      <Shield className="w-10 h-10" />
                   </div>
                   <div>
                      <p className="text-xl text-brand-100 font-black mb-3 uppercase tracking-tighter">Secure Neural Proxy Protocol</p>
                      <p className="text-sm text-brand-400/80 leading-loose font-medium max-w-4xl">
                         Sacred Core uses a secure server-side proxy for all AI operations. Your requests are processed using our enterprise-grade neural infrastructure, ensuring maximum privacy and performance. No client-side API keys are required, and all usage is tracked via Sacred Tokens.
                      </p>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'billing' && (
             <div className="space-y-12 animate-in fade-in duration-500">
                <div className="bg-gradient-to-br from-brand-900/40 to-purple-900/40 border border-brand-500/30 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/10 blur-[120px] rounded-full group-hover:bg-brand-500/20 transition-all duration-1000" />
                   <div className="flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
                      <div className="text-center md:text-left">
                         <div className="text-[10px] font-black text-brand-400 uppercase tracking-[0.4em] mb-6">Current Standing</div>
                         <div className="text-8xl font-black text-white capitalize tracking-tighter mb-6">{userTier}</div>
                         <div className="flex items-center gap-3 text-zinc-500 uppercase font-black text-[10px] tracking-widest bg-black/40 w-fit px-4 py-2 rounded-full border border-zinc-800">
                           <Activity className="w-4 h-4 text-green-500" /> Account Status: Operational
                         </div>
                      </div>
                      <div className="text-center md:text-right bg-black/60 backdrop-blur-xl p-10 rounded-[2.5rem] border border-zinc-800 shadow-2xl relative">
                         <button 
                           onClick={handleSync}
                           disabled={isSyncing}
                           className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-brand-500 transition-colors"
                           title="Sync Balance"
                         >
                           <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                         </button>
                         <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Sacred Token Balance</div>
                         <div className="text-7xl font-black text-white tabular-nums mb-6">{tokens}</div>
                         <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Tokens power your neural operations</div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   {[
                     { id: 'starter-pack', name: 'Starter Pack', tokens: 1000, price: '$10', desc: 'Perfect for small brand experiments.' },
                     { id: 'pro-pack', name: 'Pro Bundle', tokens: 5000, price: '$45', desc: 'Best value for active creators.', popular: true },
                     { id: 'agency-pack', name: 'Agency Vault', tokens: 20000, price: '$150', desc: 'Maximum scale for high-volume ops.' },
                   ].map((pkg) => (
                     <div key={pkg.id} className={`bg-dark-surface border rounded-[2rem] p-8 flex flex-col justify-between transition-all hover:shadow-2xl ${pkg.popular ? 'border-brand-500 shadow-[0_0_30px_rgba(20,184,166,0.1)] scale-105 z-10' : 'border-dark-border'}`}>
                        <div>
                           {pkg.popular && <span className="text-[9px] font-black bg-brand-500 text-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">Most Popular</span>}
                           <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">{pkg.name}</h3>
                           <p className="text-zinc-500 text-xs font-medium mb-6">{pkg.desc}</p>
                           <div className="text-4xl font-black text-white mb-1">{pkg.tokens}</div>
                           <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-8">Sacred Tokens</div>
                        </div>
                        <div>
                           <div className="text-2xl font-black text-brand-400 mb-6">{pkg.price}</div>
                           <button 
                             onClick={() => handleBuyTokens(pkg.id)}
                             disabled={isBuying}
                             className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${pkg.popular ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-xl shadow-brand-900/20' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}
                           >
                             {isBuying ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Purchase Pack'}
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {activeTab === 'affiliate' && <div className="animate-in fade-in duration-500"><AffiliateHubPage /></div>}
      </div>
    </div>
  );
};

export default SettingsPage;
