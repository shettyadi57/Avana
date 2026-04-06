import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Navigation, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Compass,
  ArrowRight,
  Clock,
  Car,
  Footprints,
  Bike
} from 'lucide-react';
import { cn } from '../lib/utils';

// Fix Leaflet icon issue
const markerIcon2x = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const markerIcon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const markerShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const LocationMarker = () => {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMap();

  useEffect(() => {
    map.locate().on("locationfound", function (e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    });
  }, [map]);

  return position === null ? null : (
    <>
      <Marker position={position}>
        <Popup>You are here</Popup>
      </Marker>
      <Circle center={position} radius={200} pathOptions={{ color: '#9333ea', fillColor: '#9333ea', fillOpacity: 0.1 }} />
    </>
  );
};

export default function MapPage() {
  const [isJourneyStarted, setIsJourneyStarted] = useState(false);
  const [destination, setDestination] = useState('');
  const [transportMode, setTransportMode] = useState<'walk' | 'bike' | 'cab'>('walk');
  const [riskScore, setRiskScore] = useState(15);

  const safeZones = [
    { id: 1, name: 'Police Station A', position: [12.9716, 77.5946], type: 'police' },
    { id: 2, name: 'Safe Cafe', position: [12.9750, 77.5980], type: 'safe' },
    { id: 3, name: 'Hospital B', position: [12.9680, 77.5920], type: 'hospital' },
  ];

  const handleStartJourney = () => {
    setIsJourneyStarted(true);
    // Simulate risk score changes
    const interval = setInterval(() => {
      setRiskScore(prev => Math.max(5, Math.min(95, prev + (Math.random() * 10 - 5))));
    }, 5000);
    return () => clearInterval(interval);
  };

  return (
    <div className="h-[calc(100vh-8rem)] relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Map */}
      <MapContainer 
        center={[12.9716, 77.5946]} 
        zoom={13} 
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <LocationMarker />
        
        {safeZones.map(zone => (
          <Marker key={zone.id} position={zone.position as any}>
            <Popup>
              <div className="p-2">
                <h4 className="font-bold text-slate-900">{zone.name}</h4>
                <p className="text-xs text-slate-600 uppercase font-medium">{zone.type} Zone</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none flex flex-col p-4 sm:p-6">
        {/* Top Search Bar */}
        <div className="w-full max-w-md mx-auto pointer-events-auto">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-2 rounded-2xl shadow-2xl flex items-center gap-2">
            <div className="p-2 text-purple-400">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              placeholder="Where are you going?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-transparent border-none outline-none text-white flex-1 placeholder:text-slate-500"
            />
            <button className="bg-purple-600 p-2 rounded-xl text-white hover:bg-purple-700 transition-all">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1" />

        {/* Bottom Controls */}
        <div className="w-full max-w-md mx-auto space-y-4 pointer-events-auto">
          <AnimatePresence>
            {isJourneyStarted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-6 rounded-[2rem] shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse",
                      riskScore < 30 ? "bg-green-500/20 text-green-400" : 
                      riskScore < 60 ? "bg-orange-500/20 text-orange-400" : "bg-red-500/20 text-red-400"
                    )}>
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">Live Journey Active</h4>
                      <p className="text-slate-400 text-sm">AI Monitoring Enabled</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Risk Score</p>
                    <p className={cn(
                      "text-2xl font-black",
                      riskScore < 30 ? "text-green-400" : 
                      riskScore < 60 ? "text-orange-400" : "text-red-400"
                    )}>{Math.round(riskScore)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Clock className="w-4 h-4" />
                      EST. ARRIVAL
                    </div>
                    <p className="text-white font-bold">12 mins</p>
                  </div>
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Compass className="w-4 h-4" />
                      DISTANCE
                    </div>
                    <p className="text-white font-bold">2.4 km</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsJourneyStarted(false)}
                  className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold py-4 rounded-2xl border border-red-500/20 transition-all"
                >
                  End Journey
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!isJourneyStarted && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-6 rounded-[2rem] shadow-2xl"
            >
              <div className="flex gap-2 mb-6">
                {[
                  { id: 'walk', icon: Footprints, label: 'Walk' },
                  { id: 'bike', icon: Bike, label: 'Bike' },
                  { id: 'cab', icon: Car, label: 'Cab' },
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setTransportMode(mode.id as any)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all",
                      transportMode === mode.id 
                        ? "bg-purple-600/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.2)]" 
                        : "bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-700"
                    )}
                  >
                    <mode.icon className="w-5 h-5" />
                    <span className="text-xs font-bold">{mode.label}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={handleStartJourney}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <Navigation className="w-5 h-5" />
                Start Safe Journey
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
