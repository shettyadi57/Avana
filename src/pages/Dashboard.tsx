import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Navigation, 
  Users, 
  AlertTriangle, 
  MapPin, 
  TrendingUp, 
  ShieldCheck,
  ArrowRight,
  Phone,
  MessageSquare,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import FakeCall from '../components/FakeCall';

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.02 }}
    className="glass-dark p-6 rounded-[2.5rem] relative overflow-hidden group"
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
    <div className="flex items-start justify-between mb-4 relative z-10">
      <div className={cn("p-4 rounded-2xl shadow-lg", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <span className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full", trend > 0 ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400")}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div className="relative z-10">
      <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
    </div>
  </motion.div>
);

export default function Dashboard() {
  const { profile } = useAuth();
  const [isFakeCallOpen, setIsFakeCallOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const safetyScore = 85;

  return (
    <div className="space-y-8 pb-12">
      <FakeCall isOpen={isFakeCallOpen} onClose={() => setIsFakeCallOpen(false)} />
      
      {showInstallBtn && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-purple/20 border border-brand-purple/30 p-4 rounded-2xl flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-purple/20 rounded-xl flex items-center justify-center text-brand-purple">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Install Avana App</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Access safety tools faster from your home screen</p>
            </div>
          </div>
          <button 
            onClick={handleInstallClick}
            className="bg-brand-purple text-white px-6 py-2 rounded-xl font-bold text-xs shadow-lg shadow-brand-purple/30"
          >
            INSTALL
          </button>
        </motion.div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-brand-orange/20 via-brand-purple/20 to-brand-blue/20 border border-white/10 p-10 sm:p-14 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/10 blur-[100px] rounded-full -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-blue/10 blur-[100px] rounded-full -ml-48 -mb-48" />
        
        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">System Monitoring Active</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
              Hello, <span className="text-brand-orange">{profile?.displayName?.split(' ')[0]}</span>. <br />
              <span className="text-white/60">You are in a</span> <span className="text-green-400">Safe Zone</span>.
            </h1>
            <p className="text-slate-300 text-xl mb-10 max-w-lg leading-relaxed font-medium">
              Avana's AI is monitoring your surroundings and route in real-time. Stay safe, stay connected.
            </p>
            <div className="flex flex-wrap gap-5">
              <Link to="/sos" className="bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center gap-3 shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-all hover:scale-105 active:scale-95">
                <ShieldAlert className="w-6 h-6" />
                TRIGGER SOS
              </Link>
              <Link to="/map" className="glass hover:bg-white/20 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center gap-3 transition-all hover:scale-105 active:scale-95">
                <Navigation className="w-5 h-5" />
                Start Journey
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Risk Score Circle */}
        <div className="absolute top-1/2 right-16 -translate-y-1/2 hidden lg:block">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative w-56 h-56"
          >
            <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl" />
            <svg className="w-full h-full transform -rotate-90 relative z-10">
              <circle
                cx="112"
                cy="112"
                r="100"
                stroke="currentColor"
                strokeWidth="16"
                fill="transparent"
                className="text-white/5"
              />
              <circle
                cx="112"
                cy="112"
                r="100"
                stroke="url(#gradient)"
                strokeWidth="16"
                fill="transparent"
                strokeDasharray={628.3}
                strokeDashoffset={628.3 * (1 - safetyScore / 100)}
                className="drop-shadow-[0_0_15px_rgba(255,126,95,0.5)]"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff7e5f" />
                  <stop offset="100%" stopColor="#9d50bb" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center relative z-20">
              <span className="text-6xl font-bold text-white tracking-tighter">{safetyScore}</span>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Safety Index</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Nearby Safe Zones" value="12" icon={MapPin} color="bg-gradient-to-br from-blue-500 to-blue-700" />
        <StatCard title="Community Reports" value="154" icon={Users} color="bg-gradient-to-br from-brand-purple to-purple-800" trend={12} />
        <StatCard title="Active Journeys" value="1,204" icon={Navigation} color="bg-gradient-to-br from-green-500 to-green-700" />
        <StatCard title="Risk Alerts" value="2" icon={AlertTriangle} color="bg-gradient-to-br from-brand-orange to-red-600" trend={-5} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Incidents */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-brand-orange" />
              Live Safety Feed
            </h2>
            <Link to="/community" className="text-brand-orange hover:text-brand-yellow text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-5">
            {[
              { title: 'Suspicious Activity Reported', area: 'Central Park North', time: '10 mins ago', type: 'harassment' },
              { title: 'Safe Route Verified', area: 'Metro Station Area', time: '25 mins ago', type: 'safe' },
              { title: 'High Crowd Density Alert', area: 'Market Street', time: '1 hour ago', type: 'suspicious' },
            ].map((incident, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-dark p-5 rounded-[2rem] flex items-center gap-5 hover:bg-white/5 transition-all cursor-pointer group border border-white/5"
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                  incident.type === 'harassment' ? "bg-red-500/20 text-red-400" : 
                  incident.type === 'safe' ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"
                )}>
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-bold text-lg leading-tight group-hover:text-brand-orange transition-colors">{incident.title}</h4>
                  <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-wider text-[10px]">{incident.area} • {incident.time}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all">
                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-white tracking-tight">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-5">
            <button 
              onClick={() => window.location.href = 'tel:112'}
              className="glass-dark p-6 rounded-[2.5rem] flex items-center gap-5 hover:bg-white/5 transition-all group border border-red-500/20 bg-red-500/5"
            >
              <div className="w-14 h-14 bg-red-600/20 text-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Phone className="w-7 h-7" />
              </div>
              <div className="text-left">
                <h4 className="text-white font-bold text-lg">Emergency Call</h4>
                <p className="text-red-500/60 text-xs font-black uppercase tracking-wider mt-0.5">Direct dial 112</p>
              </div>
            </button>
            <button 
              onClick={() => setIsFakeCallOpen(true)}
              className="glass-dark p-6 rounded-[2.5rem] flex items-center gap-5 hover:bg-white/5 transition-all group border border-white/5"
            >
              <div className="w-14 h-14 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Phone className="w-7 h-7" />
              </div>
              <div className="text-left">
                <h4 className="text-white font-bold text-lg">Fake Call</h4>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mt-0.5">Escape awkward situations</p>
              </div>
            </button>
            <Link to="/police-complaint" className="glass-dark p-6 rounded-[2.5rem] flex items-center gap-5 hover:bg-white/5 transition-all group border border-white/5">
              <div className="w-14 h-14 bg-red-600/20 text-red-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div className="text-left">
                <h4 className="text-white font-bold text-lg">Silent Complaint</h4>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mt-0.5">Report harassment to police</p>
              </div>
            </Link>
            <button className="glass-dark p-6 rounded-[2.5rem] flex items-center gap-5 hover:bg-white/5 transition-all group border border-white/5">
              <div className="w-14 h-14 bg-purple-600/20 text-purple-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="text-left">
                <h4 className="text-white font-bold text-lg">AI Legal Help</h4>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mt-0.5">Know your rights instantly</p>
              </div>
            </button>
            <button className="glass-dark p-6 rounded-[2.5rem] flex items-center gap-5 hover:bg-white/5 transition-all group border border-white/5">
              <div className="w-14 h-14 bg-green-600/20 text-green-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="text-left">
                <h4 className="text-white font-bold text-lg">Self Defense</h4>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mt-0.5">Quick tips & tutorials</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
