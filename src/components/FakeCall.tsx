import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, User, Mic, Video, Grid, Volume2, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

export default function FakeCall({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<'ringing' | 'active'>('ringing');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (status === 'active') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-between p-12 pb-20"
      >
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto flex items-center justify-center">
            <User className="w-12 h-12 text-slate-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Mom</h2>
            <p className="text-slate-400 font-medium">
              {status === 'ringing' ? 'Mobile • Calling...' : `Mobile • ${formatTime(timer)}`}
            </p>
          </div>
        </div>

        {status === 'ringing' ? (
          <div className="w-full max-w-xs flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"
            >
              <PhoneOff className="w-8 h-8" />
            </button>
            <button
              onClick={() => setStatus('active')}
              className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce active:scale-90 transition-all"
            >
              <Phone className="w-8 h-8" />
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-12">
            <div className="grid grid-cols-3 gap-8">
              {[
                { icon: Mic, label: 'Mute' },
                { icon: Grid, label: 'Keypad' },
                { icon: Volume2, label: 'Speaker' },
                { icon: Plus, label: 'Add Call' },
                { icon: Video, label: 'FaceTime' },
                { icon: User, label: 'Contacts' },
              ].map((btn, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white">
                    <btn.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-white/60">{btn.label}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
