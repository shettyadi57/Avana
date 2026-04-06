import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  doc,
  increment
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Incident } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  MessageCircle, 
  ThumbsUp, 
  MapPin, 
  Clock, 
  Plus, 
  X,
  ShieldAlert,
  EyeOff,
  Share2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

export default function CommunityPage() {
  const { user, profile } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'alert' | 'warning' | 'info'>('all');
  const [showNewAlertBadge, setShowNewAlertBadge] = useState(false);
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<any>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Incident['type']>('info');
  const [locationName, setLocationName] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const path = 'incidents';
    const q = query(collection(db, 'incidents'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
      
      if (snapshot.empty && data.length === 0) {
        seedMockData();
      } else {
        // Check for new alerts if we already have data
        if (incidents.length > 0 && data.length > incidents.length) {
          const latest = data[0];
          if (latest.timestamp && lastViewedTimestamp && latest.timestamp.toMillis() > lastViewedTimestamp.toMillis()) {
            setShowNewAlertBadge(true);
          }
        }
        
        setIncidents(data);
        if (!lastViewedTimestamp && data.length > 0) {
          setLastViewedTimestamp(data[0].timestamp);
        }
        setLoading(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return unsubscribe;
  }, [incidents.length, lastViewedTimestamp]);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredIncidents(incidents);
    } else {
      setFilteredIncidents(incidents.filter(i => {
        // Map types to categories
        if (filter === 'alert' && (i.type === 'alert' || i.type === 'kidnapping' || i.type === 'harassment')) return true;
        if (filter === 'warning' && (i.type === 'warning' || i.type === 'suspicious')) return true;
        if (filter === 'info' && (i.type === 'info' || i.type === 'safe')) return true;
        return i.type === filter;
      }));
    }
  }, [filter, incidents]);

  const seedMockData = async () => {
    const path = 'incidents';
    const mockIncidents = [
      {
        title: 'Suspicious individual following women',
        description: 'A man in a black hoodie has been seen following women near the Central Metro exit for the past 3 nights. Please avoid this exit after 10 PM.',
        type: 'warning',
        location: { lat: 12.9716, lng: 77.5946, address: 'Central Metro Station' },
        timestamp: serverTimestamp(),
        anonymous: true,
        likes: 24,
        comments: 5
      },
      {
        title: 'Attempted Kidnapping Thwarted',
        description: 'A white van was spotted trying to pull a girl in near the University Gate. Bystanders intervened. Police have been notified.',
        type: 'alert',
        location: { lat: 12.9800, lng: 77.6000, address: 'University Gate' },
        timestamp: serverTimestamp(),
        anonymous: true,
        likes: 156,
        comments: 32
      },
      {
        title: 'Safe Route Verified: Park Avenue',
        description: 'Well-lit and active police patrolling observed tonight. Recommended for walking even late at night.',
        type: 'info',
        location: { lat: 12.9750, lng: 77.5980, address: 'Park Avenue' },
        timestamp: serverTimestamp(),
        anonymous: false,
        userName: 'SafetyVolunteer',
        likes: 45,
        comments: 2
      }
    ];

    try {
      for (const incident of mockIncidents) {
        await addDoc(collection(db, 'incidents'), incident);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !locationName) return;

    setSubmitting(true);
    const path = 'incidents';
    try {
      // Get current location if possible
      let lat = 12.9716;
      let lng = 77.5946;
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        });
      }

      await addDoc(collection(db, 'incidents'), {
        title,
        description,
        type,
        anonymous,
        userId: anonymous ? null : user?.uid,
        userName: anonymous ? 'Anonymous' : profile?.displayName,
        location: { lat, lng, address: locationName },
        timestamp: serverTimestamp(),
        likes: 0,
        comments: 0
      });
      
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setLocationName('');
      setSubmitting(false);
      setLastViewedTimestamp(new Date());
    } catch (error) {
      setSubmitting(false);
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleLike = async (id: string) => {
    const path = `incidents/${id}`;
    try {
      const docRef = doc(db, 'incidents', id);
      await updateDoc(docRef, { likes: increment(1) });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const refreshFeed = () => {
    setShowNewAlertBadge(false);
    if (incidents.length > 0) {
      setLastViewedTimestamp(incidents[0].timestamp);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getIndicatorColor = (type: string) => {
    if (type === 'alert' || type === 'kidnapping' || type === 'harassment') return 'bg-red-500';
    if (type === 'warning' || type === 'suspicious') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-8 pb-12 relative">
      {/* New Alert Badge */}
      <AnimatePresence>
        {showNewAlertBadge && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50"
          >
            <button 
              onClick={refreshFeed}
              className="bg-brand-orange text-white px-6 py-2 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-brand-orange/40 flex items-center gap-2"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              New alert received
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Community Safety Feed</h1>
          <p className="text-slate-400 font-medium">Real-time safety reports from users in your area.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-orange hover:bg-brand-yellow text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,126,95,0.3)] transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Report Incident
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'all', label: 'All Reports' },
          { id: 'alert', label: 'Alerts' },
          { id: 'warning', label: 'Warnings' },
          { id: 'info', label: 'Info' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as any)}
            className={cn(
              "px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all whitespace-nowrap border",
              filter === t.id 
                ? "bg-white text-slate-950 border-white shadow-lg" 
                : "bg-slate-900/50 text-slate-500 border-white/5 hover:border-white/10"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredIncidents.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="lg:col-span-2 text-center py-20 glass-dark rounded-[3rem] border border-white/5"
              >
                <ShieldAlert className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-500">No reports found in this category</h3>
              </motion.div>
            ) : (
              filteredIncidents.map((incident) => (
                <motion.div
                  key={incident.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-dark border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-white/10 transition-all group relative"
                >
                  <div className="p-8 space-y-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        {/* Color Indicator */}
                        <div className={cn(
                          "w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]",
                          getIndicatorColor(incident.type).replace('bg-', 'text-')
                        )} />
                        
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                          incident.type === 'alert' || incident.type === 'kidnapping' || incident.type === 'harassment' ? "bg-red-500/20 text-red-400" :
                          incident.type === 'info' || incident.type === 'safe' ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                        )}>
                          {incident.type === 'info' || incident.type === 'safe' ? <ShieldAlert className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white line-clamp-1 group-hover:text-brand-orange transition-colors">{incident.title}</h3>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md",
                              incident.type === 'alert' || incident.type === 'kidnapping' || incident.type === 'harassment' ? "bg-red-500/10 text-red-400" :
                              incident.type === 'info' || incident.type === 'safe' ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                            )}>
                              {incident.type}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {incident.timestamp ? formatDistanceToNow(incident.timestamp.toDate()) + ' ago' : 'Just now'}
                            </span>
                          </div>
                        </div>
                      </div>
                      {incident.anonymous && (
                        <div className="p-2.5 bg-white/5 rounded-xl text-slate-500" title="Anonymous Report">
                          <EyeOff className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <p className="text-slate-300 text-base leading-relaxed font-medium">
                      {incident.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-400 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <MapPin className="w-4 h-4 text-brand-orange" />
                      <span className="font-bold">{incident.location.address}</span>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <button 
                          onClick={() => handleLike(incident.id)}
                          className="flex items-center gap-2 text-slate-400 hover:text-brand-orange transition-colors group/btn"
                        >
                          <ThumbsUp className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-sm font-black tracking-tighter">{incident.likes}</span>
                        </button>
                        <button className="flex items-center gap-2 text-slate-400 hover:text-brand-blue transition-colors group/btn">
                          <MessageCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-sm font-black tracking-tighter">{incident.comments}</span>
                        </button>
                      </div>
                      <button className="text-slate-500 hover:text-white transition-colors">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Report Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-lg bg-slate-950 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Report Incident</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Help keep your community safe.</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Incident Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Suspicious activity near metro"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-brand-orange outline-none transition-all placeholder:text-slate-600 font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Incident Type</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'alert', label: 'Alert', color: 'bg-red-500' },
                        { id: 'warning', label: 'Warning', color: 'bg-yellow-500' },
                        { id: 'info', label: 'Info', color: 'bg-green-500' },
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setType(t.id as any)}
                          className={cn(
                            "py-4 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all flex flex-col items-center gap-2",
                            type === t.id 
                              ? "bg-white text-slate-950 border-white shadow-lg" 
                              : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
                          )}
                        >
                          <div className={cn("w-2 h-2 rounded-full", t.color)} />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder="Street name, landmark, or area"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white focus:ring-2 focus:ring-brand-orange outline-none transition-all placeholder:text-slate-600 font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide more details to help others..."
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-brand-orange outline-none transition-all resize-none placeholder:text-slate-600 font-bold"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500">
                        <EyeOff className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Post Anonymously</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-0.5">Hide your identity</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnonymous(!anonymous)}
                      className={cn(
                        "w-14 h-7 rounded-full transition-all relative",
                        anonymous ? "bg-brand-orange" : "bg-slate-800"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1.5 w-4 h-4 bg-white rounded-full transition-all",
                        anonymous ? "left-8" : "left-2"
                      )} />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-brand-orange hover:bg-brand-yellow text-white font-black uppercase tracking-widest py-5 rounded-2xl shadow-[0_0_30px_rgba(255,126,95,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Posting...' : 'Post to Community Feed'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
