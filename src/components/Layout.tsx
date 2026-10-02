
import React from 'react';
import { useLocation } from 'react-router-dom';
import { ToastContainer } from './ToastContainer';
import { TokenExhaustBanner } from './ui/TokenExhaustBanner';
import { useStore } from '../store';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useStore();
  
  const isPublicRoute = location.pathname === '/landing' || location.pathname === '/login' || location.pathname.startsWith('/share');

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-brand-primary/30 relative overflow-hidden">
      <ToastContainer />
      
      {/* Global Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        
        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
      </div>

      {/* Navigation & Header */}
      {!isPublicRoute && isAuthenticated && (
        <>
          <Sidebar />
          <Header />
        </>
      )}

      {/* Main Content */}
      <main className={`relative z-10 flex flex-col min-h-screen transition-all duration-500 ${!isPublicRoute && isAuthenticated ? 'pt-20' : ''}`}>
        {children}
      </main>

      {/* Token Exhaustion Banner */}
      {!isPublicRoute && isAuthenticated && <TokenExhaustBanner />}
    </div>
  );
};
