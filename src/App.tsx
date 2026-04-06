import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  Home, 
  Map as MapIcon, 
  ShieldAlert, 
  MessageSquare, 
  Users, 
  Settings, 
  BookOpen,
  LogOut,
  Menu,
  X,
  Bell,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Pages
import Dashboard from './pages/Dashboard';
import MapPage from './pages/Map';
import SOSPage from './pages/SOS';
import ChatPage from './pages/Chat';
import CommunityPage from './pages/Community';
import SettingsPage from './pages/Settings';
import LearningPage from './pages/Learning';
import PoliceComplaint from './pages/PoliceComplaint';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import TrackPage from './pages/Track';
import { auth } from './firebase';

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Live Map', path: '/map', icon: MapIcon },
    { name: 'SOS Emergency', path: '/sos', icon: ShieldAlert, color: 'text-red-500' },
    { name: 'Silent Complaint', path: '/police-complaint', icon: ShieldAlert, color: 'text-orange-500' },
    { name: 'AI Chatbot', path: '/chat', icon: MessageSquare },
    { name: 'Community', path: '/community', icon: Users },
    { name: 'Learning Hub', path: '/learning', icon: BookOpen },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  if (!user) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -300 }}
        className={cn(
          "fixed top-0 left-0 h-full w-64 glass-dark z-50 transition-all duration-300 lg:translate-x-0",
          !isOpen && "lg:w-20"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-orange to-brand-purple rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,126,95,0.4)]">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            {(isOpen || window.innerWidth >= 1024) && (
              <span className="font-bold text-2xl font-display bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent tracking-tight">
                Avana
              </span>
            )}
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                    isActive 
                      ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10" 
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute left-0 w-1 h-6 bg-brand-orange rounded-r-full"
                    />
                  )}
                  <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", item.color || (isActive ? "text-white" : "group-hover:text-white"))} />
                  {(isOpen || window.innerWidth >= 1024) && (
                    <span className="font-semibold text-sm">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/5">
            <button
              onClick={() => auth.signOut()}
              className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {(isOpen || window.innerWidth >= 1024) && <span className="font-semibold text-sm">Logout</span>}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

const Header = ({ setIsOpen }: { setIsOpen: (v: boolean) => void }) => {
  const { user, profile } = useAuth();
  
  if (!user) return null;

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-20 h-20 bg-slate-950/40 backdrop-blur-xl border-b border-white/5 z-30 flex items-center justify-between px-8">
      <button onClick={() => setIsOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-white">
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-6">
        <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white relative transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-orange rounded-full border-2 border-slate-950" />
        </button>
        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white">{profile?.displayName || 'User'}</p>
            <div className="flex items-center gap-1.5 justify-end mt-0.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">Safe Mode Active</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-orange to-brand-purple p-[2px] shadow-lg">
            <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-white font-bold text-lg">
              {profile?.displayName?.[0] || 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(147,51,234,0.5)]" />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const FloatingButtons = () => {
  const location = useLocation();
  const isSOSPage = location.pathname === '/sos';
  const isTrackPage = location.pathname.startsWith('/track/');

  if (isSOSPage || isTrackPage) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4">
      <Link 
        to="/sos"
        className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)] border-4 border-red-500/30 active:scale-90 transition-all group"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ShieldAlert className="w-10 h-10 text-white" />
        </motion.div>
      </Link>
      
      <Link 
        to="/sos"
        className="w-14 h-14 glass hover:bg-white/10 rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-all shadow-xl"
      >
        <Share2 className="w-6 h-6 text-blue-400" />
      </Link>
    </div>
  );
};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-brand-orange/30">
          <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
          <Header setIsOpen={setIsSidebarOpen} />
          
          <main className={cn(
            "pt-20 min-h-screen transition-all duration-300",
            "lg:pl-20"
          )}>
            <div className="max-w-7xl mx-auto p-6 sm:p-8 lg:p-10">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/track/:trackingId" element={<TrackPage />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
                <Route path="/sos" element={<ProtectedRoute><SOSPage /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
                <Route path="/learning" element={<ProtectedRoute><LearningPage /></ProtectedRoute>} />
                <Route path="/police-complaint" element={<ProtectedRoute><PoliceComplaint /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              </Routes>
            </div>
          </main>

          <FloatingButtons />
        </div>
      </Router>
    </AuthProvider>
  );
}
