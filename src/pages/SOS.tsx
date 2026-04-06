import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Mic, 
  Camera, 
  X,
  AlertCircle,
  CheckCircle2,
  Users,
  Share2,
  Volume2,
  VolumeX,
  Battery,
  Wifi,
  Plus,
  Trash2,
  Play,
  Square
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';

interface Contact {
  name: string;
  phone: string;
  relation: string;
}

export default function SOSPage() {
  const { user, profile } = useAuth();
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [status, setStatus] = useState<'idle' | 'counting' | 'active' | 'sent'>('idle');
  const [isAlarmOn, setIsAlarmOn] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [networkStatus, setNetworkStatus] = useState<string>('online');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('emergency_contacts');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState<Contact>({ name: '', phone: '', relation: '' });
  const [isTripActive, setIsTripActive] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [aiAlert, setAiAlert] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // AI Safety Logic (Mock)
  useEffect(() => {
    let aiInterval: any;
    if (isTripActive && !isSOSActive) {
      aiInterval = setInterval(() => {
        // Randomly simulate a route deviation for demo purposes
        const shouldAlert = Math.random() > 0.95;
        if (shouldAlert) {
          setAiAlert("AI detected an unusual route deviation. Are you safe?");
          // Auto-trigger SOS after 10 seconds if not dismissed
          const autoTrigger = setTimeout(() => {
            if (aiAlert) triggerSOS();
          }, 10000);
          return () => clearTimeout(autoTrigger);
        }
      }, 15000);
    }
    return () => clearInterval(aiInterval);
  }, [isTripActive, isSOSActive, aiAlert]);

  // Initialize Audio for Alarm
  useEffect(() => {
    audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
    audioRef.current.loop = true;
    
    // Battery Status
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }

    // Network Status
    const updateNetwork = () => setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);

    return () => {
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // SOS Countdown Logic
  useEffect(() => {
    let timer: any;
    if (status === 'counting' && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (status === 'counting' && countdown === 0) {
      triggerSOS();
    }
    return () => clearTimeout(timer);
  }, [status, countdown]);

  // Real-time Location Updates during SOS or Trip
  useEffect(() => {
    let watchId: number;
    if (status === 'active' || isTripActive) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(newLoc);
          if (trackingId) {
            updateTracking(newLoc);
          }
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    }
    return () => navigator.geolocation.clearWatch(watchId);
  }, [status, isTripActive, trackingId]);

  const dialContact = (phone: string) => {
    // Standard tel: link for direct dialing
    window.location.href = `tel:${phone}`;
  };

  const triggerSOS = async () => {
    setStatus('active');
    setIsAlarmOn(true);
    if (audioRef.current) audioRef.current.play();

    // Auto-dial first contact if available - DIRECTLY
    if (contacts.length > 0) {
      dialContact(contacts[0].phone);
    }

    // Get current location
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLocation(loc);

      // Save SOS Alert to Firestore
      try {
        await addDoc(collection(db, 'sos_alerts'), {
          userId: user?.uid || 'guest',
          userName: profile?.displayName || 'Guest User',
          location: {
            ...loc,
            address: 'Emergency SOS Triggered'
          },
          timestamp: serverTimestamp(),
          status: 'active',
          contactsNotified: contacts.map(c => c.phone)
        });
        setStatus('sent');
      } catch (err) {
        console.error("Error triggering SOS:", err);
      }
    });
  };

  const updateTracking = async (loc: { lat: number; lng: number }) => {
    if (!trackingId) return;
    try {
      const trackingRef = doc(db, 'live_tracking', trackingId);
      await updateDoc(trackingRef, {
        currentLocation: loc,
        lastUpdated: serverTimestamp(),
        path: arrayUnion({
          lat: loc.lat,
          lng: loc.lng,
          timestamp: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error("Error updating tracking:", err);
    }
  };

  const startTrip = async () => {
    setIsTripActive(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLocation(loc);
      try {
        const docRef = await addDoc(collection(db, 'live_tracking'), {
          userId: user?.uid || 'guest',
          userName: profile?.displayName || 'Guest User',
          currentLocation: loc,
          path: [{
            lat: loc.lat,
            lng: loc.lng,
            timestamp: new Date().toISOString()
          }],
          status: 'active',
          startTime: serverTimestamp(),
          batteryLevel,
          networkStatus
        });
        setTrackingId(docRef.id);
      } catch (err) {
        console.error("Error starting trip:", err);
      }
    });
  };

  const endTrip = async () => {
    if (trackingId) {
      try {
        await updateDoc(doc(db, 'live_tracking', trackingId), {
          status: 'ended',
          endTime: serverTimestamp()
        });
      } catch (err) {
        console.error("Error ending trip:", err);
      }
    }
    setIsTripActive(false);
    setTrackingId(null);
  };

  const handleTrigger = () => {
    setStatus('counting');
    setCountdown(5);
  };

  const handleCancel = () => {
    setStatus('idle');
    setCountdown(5);
    setIsAlarmOn(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const toggleAlarm = () => {
    if (isAlarmOn) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsAlarmOn(!isAlarmOn);
  };

  const addContact = () => {
    if (newContact.name && newContact.phone) {
      const updated = [...contacts, newContact];
      setContacts(updated);
      localStorage.setItem('emergency_contacts', JSON.stringify(updated));
      setNewContact({ name: '', phone: '', relation: '' });
      setIsAddingContact(false);
    }
  };

  const removeContact = (index: number) => {
    const updated = contacts.filter((_, i) => i !== index);
    setContacts(updated);
    localStorage.setItem('emergency_contacts', JSON.stringify(updated));
  };

  const shareLiveLocation = () => {
    if (!trackingId) {
      startTrip();
    }
    const shareUrl = `${window.location.origin}/track/${trackingId || 'pending'}`;
    if (navigator.share) {
      navigator.share({
        title: 'My Live Location - Avana',
        text: `I am sharing my live location with you for safety. Track me here:`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Tracking link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen pb-32 pt-4 px-4 max-w-4xl mx-auto space-y-8">
      {/* Status Bar */}
      <div className="flex items-center justify-between glass-dark p-4 rounded-3xl border border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Battery className={cn("w-4 h-4", batteryLevel && batteryLevel < 20 ? "text-red-500" : "text-green-500")} />
            <span className="text-xs font-bold">{batteryLevel}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi className={cn("w-4 h-4", networkStatus === 'online' ? "text-blue-500" : "text-slate-500")} />
            <span className="text-xs font-bold uppercase tracking-widest">{networkStatus}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", isTripActive ? "bg-green-500 animate-pulse" : "bg-slate-700")} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {isTripActive ? 'Trip Active' : 'No Active Trip'}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {aiAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass bg-orange-500/20 border-orange-500/30 p-6 rounded-[2rem] flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{aiAlert}</p>
                <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest">SOS will trigger in 10s</p>
              </div>
            </div>
            <button 
              onClick={() => setAiAlert(null)}
              className="bg-orange-500 text-white px-6 py-2 rounded-xl font-bold text-xs"
            >
              I'M SAFE
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="space-y-8"
          >
            {/* Main SOS Button Container */}
            <div className="flex flex-col items-center justify-center py-12 space-y-12">
              <div className="relative">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-red-600 rounded-full blur-3xl"
                />
                <button
                  onClick={handleTrigger}
                  className="relative w-72 h-72 bg-red-600 hover:bg-red-700 rounded-full flex flex-col items-center justify-center gap-4 shadow-[0_0_60px_rgba(220,38,38,0.6)] border-[12px] border-red-500/30 transition-all active:scale-90 group"
                >
                  <ShieldAlert className="w-24 h-24 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-4xl font-black text-white tracking-tighter">SOS</span>
                </button>
              </div>

              <div className="flex gap-4 w-full max-w-sm">
                <button
                  onClick={shareLiveLocation}
                  className="flex-1 glass hover:bg-white/10 p-5 rounded-[2rem] flex flex-col items-center gap-2 transition-all active:scale-95"
                >
                  <Share2 className="w-6 h-6 text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Share Live Location</span>
                </button>
                <button
                  onClick={isTripActive ? endTrip : startTrip}
                  className={cn(
                    "flex-1 glass p-5 rounded-[2rem] flex flex-col items-center gap-2 transition-all active:scale-95",
                    isTripActive ? "bg-green-500/10 border-green-500/30" : "hover:bg-white/10"
                  )}
                >
                  {isTripActive ? <Square className="w-6 h-6 text-green-400" /> : <Play className="w-6 h-6 text-green-400" />}
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {isTripActive ? 'End Trip' : 'Start Trip'}
                  </span>
                </button>
              </div>
            </div>

            {/* Emergency Contacts Section */}
            <div className="glass-dark p-8 rounded-[2.5rem] border border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-brand-purple" />
                  Emergency Contacts
                </h3>
                <button 
                  onClick={() => setIsAddingContact(true)}
                  className="p-2 bg-brand-purple/20 text-brand-purple rounded-xl hover:bg-brand-purple/30 transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contacts.map((contact, i) => (
                  <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-purple/20 rounded-xl flex items-center justify-center text-brand-purple font-bold">
                        {contact.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{contact.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{contact.relation} • {contact.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => dialContact(contact.phone)}
                        className="p-2 text-green-400 hover:bg-green-400/10 rounded-xl transition-all"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => removeContact(i)}
                        className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {contacts.length === 0 && (
                  <div className="col-span-full py-8 text-center border-2 border-dashed border-white/5 rounded-3xl">
                    <p className="text-slate-500 text-sm">No emergency contacts added yet.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {status === 'counting' && (
          <motion.div
            key="counting"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-center space-y-12 py-20"
          >
            <div className="relative w-72 h-72 mx-auto flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="144"
                  cy="144"
                  r="130"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-white/5"
                />
                <motion.circle
                  cx="144"
                  cy="144"
                  r="130"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={816.8}
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: 816.8 }}
                  transition={{ duration: 5, ease: "linear" }}
                  className="text-red-500"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-9xl font-black text-white tracking-tighter">{countdown}</span>
            </div>
            <div className="space-y-8">
              <h2 className="text-4xl font-bold text-white tracking-tight">Triggering SOS...</h2>
              <button
                onClick={handleCancel}
                className="glass px-16 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm text-white hover:bg-white/10 transition-all"
              >
                Cancel Alert
              </button>
            </div>
          </motion.div>
        )}

        {(status === 'active' || status === 'sent') && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-dark p-10 rounded-[3rem] shadow-2xl border border-red-500/30 space-y-10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl",
                  status === 'sent' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400 animate-pulse"
                )}>
                  {status === 'sent' ? <CheckCircle2 className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">
                    {status === 'sent' ? 'Alerts Dispatched' : 'Emergency Mode Active'}
                  </h2>
                  <p className="text-slate-400 font-medium mt-1">
                    {status === 'sent' ? 'Help is on the way. Contacts notified.' : 'Broadcasting location and recording audio...'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={toggleAlarm}
                  className={cn(
                    "p-4 rounded-2xl transition-all",
                    isAlarmOn ? "bg-red-500 text-white shadow-lg shadow-red-500/40" : "bg-white/5 text-slate-400"
                  )}
                >
                  {isAlarmOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </button>
                <button onClick={handleCancel} className="p-4 bg-white/5 text-slate-400 hover:text-white rounded-2xl transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 space-y-6">
                <h3 className="text-slate-300 font-bold flex items-center gap-3">
                  <Users className="w-6 h-6 text-brand-purple" />
                  Contacts Notified
                </h3>
                <div className="space-y-4">
                  {contacts.length ? contacts.map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-purple/20 rounded-xl flex items-center justify-center text-brand-purple font-bold">
                          {c.name[0]}
                        </div>
                        <span className="text-white font-bold">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => dialContact(c.phone)}
                          className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-400 bg-green-500/10 px-3 py-1 rounded-full">Notified</span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500 italic">No emergency contacts set. Notifying nearby users and authorities.</p>
                  )}
                </div>
              </div>

              <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 space-y-6">
                <h3 className="text-slate-300 font-bold flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-brand-blue" />
                  Live Location
                </h3>
                <div className="h-32 bg-slate-900 rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-brand-blue rounded-full animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Fetching GPS...'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button className="bg-white/5 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-white/10 transition-all group">
                <Mic className="w-8 h-8 text-brand-purple group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Audio Rec</span>
              </button>
              <button className="bg-white/5 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-white/10 transition-all group">
                <Camera className="w-8 h-8 text-brand-blue group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Camera</span>
              </button>
              <button 
                onClick={() => dialContact('112')}
                className="bg-white/5 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-white/10 transition-all group"
              >
                <Phone className="w-8 h-8 text-green-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Call 112</span>
              </button>
              <Link to="/police-complaint" className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-red-500/20 transition-all group">
                <ShieldAlert className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Silent Rep</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {isAddingContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingContact(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-dark p-8 rounded-[3rem] border border-white/10 space-y-8"
            >
              <h3 className="text-2xl font-bold text-white">Add Contact</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Name</label>
                  <input 
                    type="text" 
                    value={newContact.name}
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-brand-purple"
                    placeholder="Contact Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={newContact.phone}
                    onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-brand-purple"
                    placeholder="+91 00000 00000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Relation</label>
                  <input 
                    type="text" 
                    value={newContact.relation}
                    onChange={(e) => setNewContact({...newContact, relation: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-brand-purple"
                    placeholder="e.g. Brother, Friend"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsAddingContact(false)}
                  className="flex-1 glass py-4 rounded-2xl font-bold text-slate-400"
                >
                  Cancel
                </button>
                <button 
                  onClick={addContact}
                  className="flex-1 bg-brand-purple text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-purple/30"
                >
                  Save Contact
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
