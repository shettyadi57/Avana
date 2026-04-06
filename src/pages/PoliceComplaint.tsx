import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  MapPin, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building2, 
  Phone,
  Lock,
  EyeOff,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';

export default function PoliceComplaint() {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [complaintType, setComplaintType] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  const policeStations = [
    { name: 'Central Police Station', distance: '0.8 km', phone: '100', address: 'MG Road, Central District' },
    { name: 'Women\'s Help Desk - Station B', distance: '1.2 km', phone: '1091', address: 'Park Avenue, North Wing' },
    { name: 'Cyber Crime Cell', distance: '2.5 km', phone: '1930', address: 'Tech Park, Block C' },
  ];

  const handleComplaint = async () => {
    setLoading(true);
    const path = 'police_reports';
    try {
      await addDoc(collection(db, 'police_reports'), {
        userId: isAnonymous ? null : user?.uid,
        userName: isAnonymous ? 'Anonymous' : profile?.displayName,
        type: complaintType,
        description: description || 'No additional details provided.',
        location: { lat: 12.9716, lng: 77.5946, address: 'Current Location' },
        timestamp: serverTimestamp(),
        status: 'received',
        isAnonymous
      });
      setStep(3);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600/20 rounded-2xl mb-2">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-white">Silent Police Complaint</h1>
        <p className="text-slate-400">If you are in danger or facing harassment, use this to alert the nearest police station silently. No phone call required.</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-purple-400" />
                Select Incident Type
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  'Sexual Harassment',
                  'Stalking',
                  'Domestic Violence',
                  'Cyber Bullying',
                  'Physical Assault',
                  'Other Threat'
                ].map((type) => (
                  <button
                    key={type}
                    onClick={() => { setComplaintType(type); setStep(2); }}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all group",
                      complaintType === type 
                        ? "bg-purple-600/20 border-purple-500 text-purple-400" 
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{type}</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                Nearest Police Stations
              </h2>
              <div className="space-y-3">
                {policeStations.map((station, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <div>
                      <p className="text-white font-bold text-sm">{station.name}</p>
                      <p className="text-slate-500 text-xs">{station.distance} • {station.address}</p>
                    </div>
                    <a href={`tel:${station.phone}`} className="p-2 bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors">
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Finalize Report</h2>
                <button onClick={() => setStep(1)} className="text-xs text-purple-400 font-bold hover:underline">Change Type</button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-purple-600/10 border border-purple-500/20 rounded-2xl">
                  <p className="text-xs text-purple-400 uppercase font-bold tracking-wider mb-1">Selected Type</p>
                  <p className="text-white font-bold text-lg">{complaintType}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 ml-1">Additional Details (Optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the situation, location details, or suspect description..."
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-purple-600 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-xl">
                      <EyeOff className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Anonymous Mode</p>
                      <p className="text-xs text-slate-500">Hide your identity from public</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      isAnonymous ? "bg-purple-600" : "bg-slate-800"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      isAnonymous ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>

                <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
                  <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-300 leading-relaxed">
                    Your live location and audio recording will be automatically attached to this report for immediate police response.
                  </p>
                </div>
              </div>

              <button
                onClick={handleComplaint}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-5 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-3 group"
              >
                {loading ? 'Sending Report...' : 'SEND SILENT COMPLAINT'}
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 border border-green-500/30 rounded-[2.5rem] p-12 text-center space-y-8"
          >
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,197,94,0.3)]">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white">Complaint Received</h2>
              <p className="text-slate-400 text-lg max-w-md mx-auto">
                Your report has been dispatched to the **Central Police Station**. A patrol unit has been alerted to your live location.
              </p>
            </div>
            <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 inline-block text-left">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-white font-bold">Estimated Response Time</span>
              </div>
              <p className="text-2xl font-black text-purple-400">3 - 5 Minutes</p>
              <p className="text-xs text-slate-500 mt-1">Stay in a safe, well-lit area if possible.</p>
            </div>
            <div className="pt-8">
              <button
                onClick={() => setStep(1)}
                className="text-slate-400 hover:text-white font-bold transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
