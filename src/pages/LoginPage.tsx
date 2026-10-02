
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { loginWithGoogle } from '../firebase';
import { 
  Dna, 
  Chrome, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Globe,
  Zap,
  Lock,
  Mail
} from 'lucide-react';

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth, setAuthReady, setDemo } = useStore();

  const handleGuest = () => {
    setDemo(true);
    setAuth('demo-user');
    setAuthReady(true);
    navigate('/');
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        setAuth(user.uid);
        navigate('/');
      }
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden selection:bg-brand-primary/30">
      {/* Background Ambient Effects */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-brand-primary/10 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 glass-card rounded-[3rem] shadow-2xl relative z-10 overflow-hidden min-h-[600px]">
        
        {/* Left Side: Branding */}
        <div className="hidden lg:flex flex-col p-16 bg-black/40 border-r border-white/5 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-50" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-20">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                <Dna className="w-7 h-7 text-black" />
              </div>
              <span className="text-3xl font-display uppercase tracking-tighter holographic-text">Sacred Core</span>
            </div>

            <h2 className="text-5xl font-display uppercase tracking-tighter leading-[0.9] mb-8">
              The Future <br />
              <span className="text-white/20">is</span> <br />
              <span className="text-brand-primary">Sacred.</span>
            </h2>

            <p className="text-white/40 text-lg font-mono uppercase tracking-widest leading-relaxed mb-12 max-w-xs">
              Autonomous Brand DNA Synthesis & Agent Network.
            </p>

            <div className="space-y-6">
              {[
                { icon: ShieldCheck, title: "Neural Encryption", desc: "Zero-trust brand data protocol." },
                { icon: Cpu, title: "Agent Forge", desc: "Autonomous creative synthesis." },
                { icon: Globe, title: "Global Reach", desc: "Instant deployment to the edge." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-primary shrink-0 border border-white/10">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">{item.title}</h4>
                    <p className="text-[10px] text-white/20 uppercase tracking-widest">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto relative z-10 pt-8 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
              <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest font-bold">System Status: Optimal</span>
            </div>
            <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest font-bold">© 2026 SACRED CORE</span>
          </div>
        </div>

        {/* Right Side: Auth */}
        <div className="p-12 md:p-20 flex flex-col justify-center bg-[#080808]">
          <div className="max-w-sm mx-auto w-full space-y-12">
            <div className="text-center lg:text-left space-y-4">
              <h1 className="text-4xl font-display uppercase tracking-tight holographic-text">Initialize</h1>
              <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Verify identity to unlock the brand matrix.</p>
            </div>

            <div className="space-y-6">
              <button 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-5 bg-white text-black rounded-2xl font-bold uppercase text-xs tracking-[0.2em] shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:bg-brand-primary transition-all flex items-center justify-center gap-4 group h-[64px]"
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Chrome className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Authorize with Google
                  </>
                )}
              </button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                <span className="relative bg-[#080808] px-4 text-[8px] font-mono text-white/20 uppercase tracking-widest">Or Secure Link</span>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                  <input 
                    type="email" 
                    placeholder="AGENT@SACREDCORE.AI"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[10px] font-mono text-white focus:border-brand-primary outline-none transition-all placeholder:text-white/10"
                  />
                </div>
                <button className="w-full py-4 bg-white/5 border border-white/10 hover:border-white/30 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                  Request Magic Link
                </button>
              </div>

              <button
                type="button"
                onClick={handleGuest}
                className="w-full mt-4 py-4 bg-gradient-to-r from-brand-primary/20 to-brand-accent/20 border border-brand-primary/30 hover:border-brand-primary/60 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white transition-all"
              >
                Continue as Guest (Demo)
              </button>
            </div>

            <div className="pt-12 text-center">
              <p className="text-[10px] text-white/20 font-mono uppercase tracking-widest">
                New Operative? <Link to="/landing" className="text-brand-primary font-bold hover:underline">Apply for Access</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);

export default LoginPage;
