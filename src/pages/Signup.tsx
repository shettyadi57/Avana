import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType, googleProvider } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Mail, Lock, User, ArrowRight, Chrome } from 'lucide-react';
import { motion } from 'motion/react';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formatError = (err: any) => {
    if (err.code === 'auth/network-request-failed') {
      return "Network error: Please check your internet connection and ensure no ad-blockers are blocking Firebase (identitytoolkit.googleapis.com).";
    }
    return err.message;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });
      
      const path = `users/${user.uid}`;
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          emergencyContacts: [],
          language: 'en',
          createdAt: new Date(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }

      navigate('/');
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emergencyContacts: [],
          language: 'en',
          createdAt: new Date(),
        });
      }
      navigate('/');
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-dark p-10 rounded-[3rem] shadow-2xl border border-white/10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-orange/10 blur-[60px] rounded-full -mr-24 -mt-24" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-purple/10 blur-[60px] rounded-full -ml-24 -mb-24" />

        <div className="text-center mb-10 relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-brand-orange to-brand-purple rounded-3xl mb-6 shadow-[0_0_30px_rgba(255,126,95,0.4)]">
            <ShieldAlert className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Join Avana</h1>
          <p className="text-slate-400 font-medium">Start your journey towards a safer future today.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-2xl mb-8 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4 relative z-10 mb-8">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 group"
          >
            <Chrome className="w-5 h-5 text-brand-orange" />
            Continue with Google
          </button>
          
          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">OR</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-8 relative z-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all font-medium placeholder:text-slate-600"
                placeholder="Jane Doe"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all font-medium placeholder:text-slate-600"
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all font-medium placeholder:text-slate-600"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-orange to-brand-purple hover:scale-[1.02] active:scale-[0.98] text-white font-black uppercase tracking-widest text-sm py-5 rounded-2xl shadow-[0_0_30px_rgba(255,126,95,0.3)] transition-all flex items-center justify-center gap-3 group"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="text-center mt-10 text-slate-500 text-sm font-medium relative z-10">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-orange hover:text-brand-yellow font-bold transition-colors">
            Log in here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
