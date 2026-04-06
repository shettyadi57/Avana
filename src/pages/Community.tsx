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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Incident['type']>('suspicious');
  const [anonymous, setAnonymous] = useState(false);

  useEffect(() => {
    const path = 'incidents';
    const q = query(collection(db, 'incidents'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        seedMockData();
      } else {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
        setIncidents(data);
        setLoading(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return unsubscribe;
  }, []);

  const seedMockData = async () => {
    const path = 'incidents';
    const mockIncidents = [
      {
        title: 'Suspicious individual following women',
        description: 'A man in a black hoodie has been seen following women near the Central Metro exit for the past 3 nights. Please avoid this exit after 10 PM.',
        type: 'harassment',
        location: { lat: 12.9716, lng: 77.5946, address: 'Central Metro Station' },
        timestamp: serverTimestamp(),
        anonymous: true,
        likes: 24,
        comments: 5
      },
      {
        title: 'Attempted Kidnapping Thwarted',
        description: 'A white van was spotted trying to pull a girl in near the University Gate. Bystanders intervened. Police have been notified.',
        type: 'kidnapping',
        location: { lat: 12.9800, lng: 77.6000, address: 'University Gate' },
        timestamp: serverTimestamp(),
        anonymous: true,
        likes: 156,
        comments: 32
      },
      {
        title: 'Safe Route Verified: Park Avenue',
        description: 'Well-lit and active police patrolling observed tonight. Recommended for walking even late at night.',
        type: 'safe',
        location: { lat: 12.9750, lng: 77.5980, address: 'Park Avenue' },
        timestamp: serverTimestamp(),
        anonymous: false,
        userName: 'SafetyVolunteer',
        likes: 45,
        comments: 2
      },
      {
        title: 'Unsafe Street Lighting',
        description: 'Street lights are out on 5th Cross Road. Extremely dark and feels unsafe. Reported to city council.',
        type: 'suspicious',
        location: { lat: 12.9600, lng: 77.5800, address: '5th Cross Road' },
        timestamp: serverTimestamp(),
        anonymous: false,
        userName: 'Asha_K',
        likes: 12,
        comments: 8
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
    if (!title || !description) return;

    const path = 'incidents';
    try {
      await addDoc(collection(db, 'incidents'), {
        title,
        description,
        type,
        anonymous,
        userId: anonymous ? null : user?.uid,
        userName: anonymous ? 'Anonymous' : profile?.displayName,
        location: { lat: 12.9716, lng: 77.5946, address: 'Current Location' }, // Mock location
        timestamp: serverTimestamp(),
        likes: 0,
        comments: 0
      });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
    } catch (error) {
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

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Community Safety Feed</h1>
          <p className="text-slate-400">Real-time reports from users in your area.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all"
        >
          <Plus className="w-5 h-5" />
          Report Incident
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {incidents.map((incident) => (
            <motion.div
              key={incident.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden hover:border-slate-700 transition-all group"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                      incident.type === 'harassment' || incident.type === 'kidnapping' ? "bg-red-500/20 text-red-400" :
                      incident.type === 'safe' ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"
                    )}>
                      {incident.type === 'safe' ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white line-clamp-1">{incident.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full uppercase tracking-wider",
                          incident.type === 'harassment' ? "bg-red-500/10 text-red-400" :
                          incident.type === 'safe' ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-400"
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
                    <div className="p-2 bg-slate-800/50 rounded-lg text-slate-400" title="Anonymous Report">
                      <EyeOff className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <p className="text-slate-300 text-sm leading-relaxed">
                  {incident.description}
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  {incident.location.address}
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleLike(incident.id)}
                      className="flex items-center gap-2 text-slate-400 hover:text-purple-400 transition-colors"
                    >
                      <ThumbsUp className="w-5 h-5" />
                      <span className="text-sm font-bold">{incident.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm font-bold">{incident.comments}</span>
                    </button>
                  </div>
                  <button className="text-slate-500 hover:text-white transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
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
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-white">Report Incident</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-500 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 ml-1">Incident Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Briefly describe what happened"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 ml-1">Incident Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'harassment', label: 'Harassment', color: 'text-red-400' },
                        { id: 'suspicious', label: 'Suspicious', color: 'text-orange-400' },
                        { id: 'safe', label: 'Safe Zone', color: 'text-green-400' },
                        { id: 'kidnapping', label: 'Kidnapping', color: 'text-red-600' },
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setType(t.id as any)}
                          className={cn(
                            "py-3 px-4 rounded-xl border text-sm font-bold transition-all",
                            type === t.id 
                              ? "bg-purple-600/20 border-purple-500 text-purple-400" 
                              : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                          )}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 ml-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide more details to help others..."
                      rows={4}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-600 outline-none transition-all resize-none"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <EyeOff className="w-5 h-5 text-slate-500" />
                      <div>
                        <p className="text-sm font-bold text-white">Post Anonymously</p>
                        <p className="text-xs text-slate-500">Your identity will be hidden</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnonymous(!anonymous)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        anonymous ? "bg-purple-600" : "bg-slate-800"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        anonymous ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all"
                  >
                    Post to Community
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
