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

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center space-y-12 py-8">
      <FakeCall isOpen={isFakeCallOpen} onClose={() => setIsFakeCallOpen(false)} />
      
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Welcome, <span className="text-brand-orange">{profile?.displayName?.split(' ')[0]}</span>
        </h1>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">System Monitoring Active</p>
        </div>
      </motion.div>

      {/* Massive SOS Button */}
      <div className="relative group">
        {/* Glowing Background Effect */}
        <div className="absolute inset-0 bg-red-600/20 blur-[80px] rounded-full group-hover:bg-red-600/30 transition-all duration-700 animate-pulse" />
        
        <Link to="/sos" className="relative z-10 block">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-64 h-64 sm:w-80 sm:h-80 bg-red-600 rounded-full flex flex-col items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.6)] border-[12px] border-red-500/20 group-hover:border-red-500/40 transition-all"
          >
            <ShieldAlert className="w-24 h-24 sm:w-32 sm:h-32 text-white mb-2" />
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter">SOS</span>
            <span className="text-[10px] font-black text-red-200 uppercase tracking-[0.3em] mt-2">Tap to Alert</span>
          </motion.button>
        </Link>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl px-4">
        <motion.div
          whileHover={{ y: -8 }}
          className="glass-dark p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center group cursor-pointer hover:bg-white/5 transition-all"
          onClick={() => window.location.href = '/sos'}
        >
          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/10">
            <Navigation className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-white font-bold text-lg leading-tight">Share Live Location</h3>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Instant Tracking</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -8 }}
          className="glass-dark p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center group cursor-pointer hover:bg-white/5 transition-all"
          onClick={() => setIsFakeCallOpen(true)}
        >
          <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/10">
            <Phone className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-white font-bold text-lg leading-tight">Fake Phone Call</h3>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Escape Safely</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -8 }}
          className="glass-dark p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center group cursor-pointer hover:bg-white/5 transition-all"
          onClick={() => window.location.href = '/map'}
        >
          <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-green-500/10">
            <MapPin className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-white font-bold text-lg leading-tight">Nearby Safe Zones</h3>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Find Refuge</p>
        </motion.div>
      </div>

      {/* Community Feature Highlight */}
      <Link to="/community" className="w-full max-w-4xl px-4">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="glass-dark p-6 rounded-[2rem] border border-brand-orange/20 bg-brand-orange/5 flex items-center justify-between group"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-brand-orange/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Users className="w-7 h-7 text-brand-orange" />
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">Community Safety Feed</h4>
              <p className="text-slate-500 text-xs font-medium">Real-time alerts from users near you</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-orange group-hover:text-white transition-all text-brand-orange">
            <ArrowRight className="w-5 h-5" />
          </div>
        </motion.div>
      </Link>
    </div>
  );
}
