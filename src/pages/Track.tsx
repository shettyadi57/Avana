import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { MapPin, Battery, Wifi, ShieldCheck, Clock, Navigation } from 'lucide-react';
import { cn } from '../lib/utils';

// Custom SVG Icon for Marker
const customIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #ff7e5f; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(255,126,95,0.6); position: relative;">
          <div style="position: absolute; top: 100%; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #ff7e5f;"></div>
         </div>`,
  iconSize: [24, 32],
  iconAnchor: [12, 32],
});

const MapAutoCenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

export default function TrackPage() {
  const { trackingId } = useParams<{ trackingId: string }>();
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trackingId) return;

    const unsub = onSnapshot(doc(db, 'live_tracking', trackingId), (doc) => {
      if (doc.exists()) {
        setTrackingData(doc.data());
        setLoading(false);
      } else {
        setError('Tracking session not found or has ended.');
        setLoading(false);
      }
    }, (err) => {
      console.error(err);
      setError('Error loading tracking data.');
      setLoading(false);
    });

    return () => unsub();
  }, [trackingId]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-brand-orange border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(255,126,95,0.4)]" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Connecting to Live Stream...</p>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center text-red-500">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">{error || 'Session Ended'}</h1>
        <p className="text-slate-400 max-w-xs mx-auto">This tracking link is no longer active for security reasons.</p>
      </div>
    );
  }

  const center: [number, number] = [trackingData.currentLocation.lat, trackingData.currentLocation.lng];

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col">
      {/* Header Info */}
      <div className="glass-dark p-6 border-b border-white/5 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-brand-orange to-brand-purple rounded-2xl flex items-center justify-center shadow-lg">
              <Navigation className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Tracking {trackingData.userName}</h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-400">Journey Active</span>
                </div>
                <span className="text-slate-600">•</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Updated Just Now</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <Battery className={cn("w-4 h-4", trackingData.batteryLevel < 20 ? "text-red-500" : "text-green-500")} />
                <span className="text-sm font-bold text-white">{trackingData.batteryLevel}%</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Battery Status</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <Wifi className={cn("w-4 h-4", trackingData.networkStatus === 'online' ? "text-blue-500" : "text-slate-500")} />
                <span className="text-sm font-bold text-white uppercase">{trackingData.networkStatus}</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Network</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 relative z-10">
        <MapContainer 
          center={center} 
          zoom={15} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapAutoCenter center={center} />
          <Marker position={center} icon={customIcon}>
            <Popup>
              <div className="text-center p-2">
                <p className="font-bold text-slate-900">{trackingData.userName}</p>
                <p className="text-xs text-slate-500">Current Location</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Floating Action Card */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-dark p-6 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current Coordinates</p>
                <p className="text-sm font-bold text-white">{center[0].toFixed(6)}, {center[1].toFixed(6)}</p>
              </div>
            </div>
            <button className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold text-sm transition-all border border-white/5">
              Open in Google Maps
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
