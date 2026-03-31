

import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useStore } from './store';
import { FirebaseSync } from './components/FirebaseSync';

import DashboardPage from './pages/DashboardPage';
import PortfolioWorkspace from './pages/PortfolioWorkspace';
import LoginPage from './pages/LoginPage';
import CampaignsPage from './pages/CampaignsPage';
import AutomationsPage from './pages/AutomationsPage';
import BattleModePage from './pages/BattleModePage';
import LeadHunterPage from './pages/LeadHunterPage';
import LiveSessionPage from './pages/LiveSessionPage';
import BrandSimulatorPage from './pages/BrandSimulatorPage';
import AgentForgePage from './pages/AgentForgePage';
import SiteBuilderPage from './pages/SiteBuilderPage';
import LandingPage from './pages/LandingPage';
import SharedProfilePage from './pages/SharedProfilePage';
import SettingsPage from './pages/SettingsPage';
import ExtractPage from './pages/ExtractPage';

// Fix: Use optional children to resolve TypeScript error "Property 'children' is missing in type '{}'" 
// when the component is instantiated within a prop like 'element' in react-router-dom
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated, isAuthReady } = useStore();
  const location = useLocation();

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050505]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F27D26]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default function App() {
  const { isAuthenticated } = useStore();

  return (
    <HashRouter>
      <FirebaseSync />
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/share/:id" element={<SharedProfilePage />} />

          {/* Protected App Routes */}
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/portfolio/:id" element={<ProtectedRoute><PortfolioWorkspace /></ProtectedRoute>} />
          <Route path="/simulator" element={<ProtectedRoute><BrandSimulatorPage /></ProtectedRoute>} />
          <Route path="/campaigns" element={<ProtectedRoute><CampaignsPage /></ProtectedRoute>} />
          <Route path="/agents" element={<ProtectedRoute><AgentForgePage /></ProtectedRoute>} />
          <Route path="/builder" element={<ProtectedRoute><SiteBuilderPage /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><LeadHunterPage /></ProtectedRoute>} />
          <Route path="/live" element={<ProtectedRoute><LiveSessionPage /></ProtectedRoute>} />
          <Route path="/automations" element={<ProtectedRoute><AutomationsPage /></ProtectedRoute>} />
          <Route path="/battle" element={<ProtectedRoute><BattleModePage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/extract" element={<ProtectedRoute><ExtractPage /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}