
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { LiquidGlassCard } from '../components/LiquidGlassCard';
import { Search, Plus, Zap, UserPlus, Send, Filter, Grid, LayoutList, LogOut, Settings, CreditCard, Globe, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

const DashboardPage = () => {
  const { brands, isSidebarOpen, toggleSidebar, addBrand, deductCredits, credits, logout } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [extractUrl, setExtractUrl] = useState('');
  const navigate = useNavigate();

  const handleQuickExtract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractUrl.trim()) return;
    
    let formattedUrl = extractUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }
    
    navigate('/extract', { state: { url: formattedUrl } });
  };

  const filteredBrands = useMemo(() => 
    brands.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [brands, searchQuery]
  );

  const handleCreatePortfolio = async () => {
    const success = await deductCredits(20);
    if (!success) {
      alert("Insufficient credits. 20 credits required for DNA extraction.");
      return;
    }

    const newBrand = {
      id: uuid(),
      name: "New Brand Essence",
      industry: "Technology",
      tone: "Innovative",
      values: ["Excellence", "Future", "Humanity"],
      mission: "To redefine the boundaries of AI-driven brand identity.",
      targetAudience: "Forward-thinking enterprises",
      tagline: "The future is sacred.",
      confidenceScore: 98,
      visualIdentity: {
        primaryColor: '#F27D26',
        secondaryColor: '#00FF00',
        styleKeywords: ['Cinematic', 'Cyber-Organic']
      },
      createdAt: new Date().toISOString()
    };
    
    addBrand(newBrand as any);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white px-8 pb-12 relative overflow-hidden">
      {/* Header Section */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div className="space-y-1">
          <h1 className="text-6xl font-display uppercase tracking-tighter holographic-text">
            Portfolios <span className="text-white/20">/</span> Strands
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
              {brands.length} Active DNA Strands Detected
            </p>
            <div className="h-1 w-1 rounded-full bg-white/20" />
            <div className="flex items-center gap-2 text-[10px] font-mono text-brand-primary uppercase tracking-widest">
              <Plus className="w-3 h-3" />
              Ready for Synthesis
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-primary transition-colors" />
            <input 
              type="text"
              placeholder="FILTER STRANDS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-[10px] font-mono focus:border-brand-primary outline-none transition-all placeholder:text-white/10 w-64"
            />
          </div>

          <button 
            onClick={toggleSidebar}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-500 ${isSidebarOpen ? 'bg-brand-primary border-brand-primary text-black' : 'bg-white/5 border-white/10 text-white hover:border-white/30'}`}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest">Lead Hunter</span>
            <LayoutList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Extract Section */}
      <div className="relative z-10 mb-16">
        <div className="max-w-4xl mx-auto glass-card rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-display uppercase tracking-tight">Neural DNA Extraction</h2>
              </div>
              <p className="text-sm text-white/40 font-mono uppercase tracking-widest leading-relaxed">
                Enter any website URL to decode its brand essence and synthesize a new portfolio strand.
              </p>
            </div>

            <form onSubmit={handleQuickExtract} className="w-full md:w-1/2 flex gap-3">
              <div className="flex-1 relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input 
                  type="url"
                  placeholder="HTTPS://EXAMPLE.COM"
                  value={extractUrl}
                  onChange={(e) => setExtractUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-mono focus:border-brand-primary outline-none transition-all placeholder:text-white/10"
                  required
                />
              </div>
              <button 
                type="submit"
                className="px-8 py-4 bg-white text-black rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-brand-primary transition-all active:scale-95 shadow-xl"
              >
                INITIATE
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="flex gap-8 relative z-10">
        {/* Main Grid */}
        <div className={`flex-1 transition-all duration-700 ${isSidebarOpen ? 'w-2/3' : 'w-full'}`}>
          {filteredBrands.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredBrands.map((brand, index) => (
                  <motion.div
                    key={brand.id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.1, type: 'spring', damping: 20 }}
                  >
                    <LiquidGlassCard 
                      title={brand.name}
                      description={brand.mission}
                      brandColor={index % 2 === 0 ? '#F27D26' : '#00D1FF'}
                      onOpen={() => navigate(`/portfolio/${brand.id}`)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center animate-spin-slow">
                <Zap className="w-10 h-10 text-white/20" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-display uppercase tracking-tight text-white/40">No DNA Strands Found</h3>
                <p className="text-sm text-white/20 font-mono uppercase tracking-widest">Initiate extraction to begin</p>
              </div>
              <button 
                onClick={handleCreatePortfolio}
                className="px-8 py-4 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                Start First Sequence
              </button>
            </div>
          )}
        </div>

        {/* Sidebar: Lead & Closer Section */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="w-[400px] h-[calc(100vh-180px)] glass-card rounded-3xl p-8 sticky top-28 overflow-hidden"
            >
              {/* Scan Line Effect */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                <div className="w-full h-1 bg-brand-primary animate-scan shadow-[0_0_20px_#F27D26]" />
              </div>

              <div className="relative z-10 space-y-8 h-full flex flex-col">
                <div className="space-y-4">
                  <h2 className="text-2xl font-display uppercase tracking-tight text-brand-primary">
                    Lead Hunter
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input 
                      type="text"
                      placeholder="SCANNING FOR TARGETS..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-mono focus:border-brand-primary outline-none transition-colors placeholder:text-white/20"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
                  {[
                    { name: 'Quantum Leap Tech', loc: 'San Francisco, CA', match: '98%' },
                    { name: 'Neural Flow Systems', loc: 'Berlin, DE', match: '95%' },
                    { name: 'Sacred Bio-Tech', loc: 'Tokyo, JP', match: '92%' },
                    { name: 'Aether Dynamics', loc: 'London, UK', match: '89%' },
                    { name: 'Prism Media', loc: 'New York, NY', match: '87%' }
                  ].map((lead, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ x: 5 }}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-primary/50 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-sm group-hover:text-brand-primary transition-colors">{lead.name}</h4>
                          <p className="text-[10px] text-white/40 font-mono">{lead.loc}</p>
                        </div>
                        <div className="px-2 py-1 rounded bg-brand-primary/10 text-brand-primary text-[8px] font-bold uppercase">
                          {lead.match} Match
                        </div>
                      </div>
                      <p className="text-[11px] text-white/60 mb-4 line-clamp-2">
                        High-growth AI startup looking for a complete brand overhaul and autonomous marketing strategy.
                      </p>
                      <div className="flex items-center gap-2">
                        <button className="flex-1 py-2 bg-white/10 hover:bg-brand-primary hover:text-black rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all">
                          Send Pitch
                        </button>
                        <button className="p-2 bg-white/10 hover:bg-brand-accent hover:text-black rounded-lg transition-all">
                          <UserPlus className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/10">
                  <button 
                    onClick={handleCreatePortfolio}
                    className="w-full py-4 bg-brand-primary text-black rounded-2xl font-bold uppercase text-xs tracking-[0.2em] hover:shadow-[0_0_30px_rgba(242,125,38,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Portfolio
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardPage;

