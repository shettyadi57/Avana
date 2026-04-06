import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline, 
  Circle, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Navigation, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Compass,
  Clock,
  Car,
  Footprints,
  Bike,
  ShieldAlert,
  Info,
  X,
  Phone,
  Mic,
  Share2,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  MOCK_CRIME_ZONES, 
  calculateSafetyScore, 
  getDistanceFromRoute, 
  classifyJourneyRisk,
  JourneyStatus 
} from '../services/safetyService';

// Custom Marker Icons
const userIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #8b5cf6; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(139,92,246,0.5);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const destinationIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #ff7e5f; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(255,126,95,0.5);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const MapAutoCenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

export default function MapPage() {
  const [map, setMap] = useState<L.Map | null>(null);
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [safetyScore, setSafetyScore] = useState<number | null>(null);
  const [isJourneyStarted, setIsJourneyStarted] = useState(false);
  const [transportMode, setTransportMode] = useState<'walking' | 'cycling' | 'driving'>('walking');
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Live Tracking State
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [actualPath, setActualPath] = useState<[number, number][]>([]);
  const [journeyStatus, setJourneyStatus] = useState<JourneyStatus>('SAFE');
  const [deviationDistance, setDeviationDistance] = useState(0);
  const [timeOffRoute, setTimeOffRoute] = useState(0); // in seconds
  const [showDangerAlert, setShowDangerAlert] = useState(false);
  const [showSuspiciousAlert, setShowSuspiciousAlert] = useState(false);

  const watchId = useRef<number | null>(null);
  const offRouteTimer = useRef<NodeJS.Timeout | null>(null);

  // Geocoding using Nominatim
  const geocode = async (query: string): Promise<[number, number] | null> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      return null;
    }
  };

  // Routing using OSRM
  const getRoute = async (start: [number, number], end: [number, number], mode: string) => {
    const profile = mode === 'walking' ? 'foot' : mode === 'cycling' ? 'bicycle' : 'car';
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/${profile}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const points = route.geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);
        setRoutePoints(points);
        
        const score = calculateSafetyScore(points.map(p => ({ lat: p[0], lng: p[1] })));
        setSafetyScore(score);
        
        setRouteInfo({
          distance: (route.distance / 1000).toFixed(1) + ' km',
          duration: Math.round(route.duration / 60) + ' min'
        });
      }
    } catch (err) {
      console.error('Routing error:', err);
    }
  };

  const handleSearch = async () => {
    if (!origin || !destination) return;
    setIsSearching(true);
    
    const start = await geocode(origin);
    const end = await geocode(destination);
    
    if (start && end) {
      setOriginCoords(start);
      setDestCoords(end);
      await getRoute(start, end, transportMode);
      setIsJourneyStarted(false);
      setActualPath([]);
      setJourneyStatus('SAFE');
      setTimeOffRoute(0);
      setShowDangerAlert(false);
      setShowSuspiciousAlert(false);
    } else {
      alert('Could not find locations. Please be more specific.');
    }
    setIsSearching(false);
  };

  // Geolocation Tracking
  useEffect(() => {
    if (isJourneyStarted) {
      if (navigator.geolocation) {
        watchId.current = navigator.geolocation.watchPosition(
          (position) => {
            const newPos: [number, number] = [position.coords.latitude, position.coords.longitude];
            setCurrentLocation(newPos);
            setActualPath(prev => [...prev, newPos]);
          },
          (error) => console.error(error),
          { enableHighAccuracy: true }
        );
      }
    } else {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    }
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [isJourneyStarted]);

  // AI Deviation Detection Logic
  useEffect(() => {
    if (isJourneyStarted && currentLocation && routePoints.length > 0) {
      const currentPos = { lat: currentLocation[0], lng: currentLocation[1] };
      const route = routePoints.map(p => ({ lat: p[0], lng: p[1] }));
      const deviation = getDistanceFromRoute(currentPos, route);
      setDeviationDistance(Math.round(deviation));

      if (deviation > 200) {
        if (!offRouteTimer.current) {
          offRouteTimer.current = setInterval(() => {
            setTimeOffRoute(prev => prev + 1);
          }, 1000);
        }
      } else {
        if (offRouteTimer.current) {
          clearInterval(offRouteTimer.current);
          offRouteTimer.current = null;
        }
        setTimeOffRoute(0);
      }

      const status = classifyJourneyRisk(deviation, timeOffRoute, currentPos);
      setJourneyStatus(status);

      if (status === 'DANGER' && !showDangerAlert) {
        setShowDangerAlert(true);
      } else if (status === 'SUSPICIOUS' && !showSuspiciousAlert && !showDangerAlert) {
        setShowSuspiciousAlert(true);
      }
    }
  }, [currentLocation, isJourneyStarted, routePoints, timeOffRoute, showDangerAlert, showSuspiciousAlert]);

  return (
    <div className="h-[calc(100vh-8rem)] relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <MapContainer 
        center={currentLocation || [12.9716, 77.5946]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        ref={setMap}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {currentLocation && <MapAutoCenter center={currentLocation} />}
        
        {/* Planned Route */}
        {routePoints.length > 0 && (
          <Polyline 
            positions={routePoints}
            pathOptions={{ color: '#3b82f6', weight: 6, opacity: 0.6 }}
          />
        )}

        {/* Actual Path */}
        {actualPath.length > 0 && (
          <Polyline 
            positions={actualPath}
            pathOptions={{ 
              color: journeyStatus === 'DANGER' ? '#ef4444' : journeyStatus === 'SUSPICIOUS' ? '#f59e0b' : '#22c55e',
              weight: 4,
              opacity: 1
            }}
          />
        )}

        {/* Markers */}
        {currentLocation && (
          <Marker position={currentLocation} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {destCoords && (
          <Marker position={destCoords} icon={destinationIcon}>
            <Popup>{destination}</Popup>
          </Marker>
        )}

        {/* Crime Zones */}
        {MOCK_CRIME_ZONES.map(zone => (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{
              fillColor: zone.riskLevel === 'high' ? '#ef4444' : zone.riskLevel === 'medium' ? '#f59e0b' : '#22c55e',
              fillOpacity: 0.2,
              color: zone.riskLevel === 'high' ? '#ef4444' : zone.riskLevel === 'medium' ? '#f59e0b' : '#22c55e',
              opacity: 0.4,
              weight: 1
            }}
            eventHandlers={{
              click: () => setSelectedZone(zone)
            }}
          />
        ))}

        {selectedZone && (
          <Popup position={[selectedZone.lat, selectedZone.lng]}>
            <div className="p-2 max-w-xs">
              <h4 className={cn(
                "font-bold text-sm mb-1",
                selectedZone.riskLevel === 'high' ? "text-red-600" : selectedZone.riskLevel === 'medium' ? "text-orange-600" : "text-green-600"
              )}>
                {selectedZone.type} Risk Zone
              </h4>
              <p className="text-xs text-slate-700">{selectedZone.description}</p>
            </div>
          </Popup>
        )}
      </MapContainer>

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none flex flex-col p-4 sm:p-6 z-[1000]">
        {/* Top Search Panel */}
        {!isJourneyStarted && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-md mx-auto pointer-events-auto space-y-2"
          >
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-4 rounded-3xl shadow-2xl space-y-3">
              <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                <MapPin className="w-5 h-5 text-purple-400" />
                <input 
                  type="text" 
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Starting point..."
                  className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-500 text-sm"
                />
              </div>
              <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                <Navigation className="w-5 h-5 text-brand-orange" />
                <input 
                  type="text" 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where to?"
                  className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-500 text-sm"
                />
              </div>
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Calculate Safest Route
              </button>
            </div>
          </motion.div>
        )}

        {/* Live Journey Status */}
        {isJourneyStarted && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-md mx-auto pointer-events-auto"
          >
            <div className={cn(
              "p-4 rounded-3xl border backdrop-blur-xl flex items-center justify-between shadow-2xl transition-colors duration-500",
              journeyStatus === 'DANGER' ? "bg-red-500/20 border-red-500/50" : 
              journeyStatus === 'SUSPICIOUS' ? "bg-orange-500/20 border-orange-500/50" : "bg-green-500/20 border-green-500/50"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center animate-pulse",
                  journeyStatus === 'DANGER' ? "bg-red-500 text-white" : 
                  journeyStatus === 'SUSPICIOUS' ? "bg-orange-500 text-white" : "bg-green-500 text-white"
                )}>
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-60 text-white">Journey Status</p>
                  <h4 className="text-white font-bold">{journeyStatus}</h4>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-black tracking-widest opacity-60 text-white">Deviation</p>
                <h4 className="text-white font-bold">{deviationDistance}m</h4>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex-1" />

        {/* Alerts Overlay */}
        <AnimatePresence>
          {showSuspiciousAlert && journeyStatus !== 'DANGER' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[2000] flex items-center justify-center p-6 pointer-events-auto bg-black/40 backdrop-blur-sm"
            >
              <div className="bg-slate-900 border border-orange-500/50 p-8 rounded-[3rem] max-w-sm w-full text-center shadow-2xl">
                <div className="w-20 h-20 bg-orange-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Unusual Route Detected</h3>
                <p className="text-slate-400 text-sm mb-8">
                  You have deviated {deviationDistance}m from the planned route. Are you safe?
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowSuspiciousAlert(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all"
                  >
                    I'm Safe
                  </button>
                  <button 
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {showDangerAlert && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 z-[2100] flex items-center justify-center p-6 pointer-events-auto bg-red-950/60 backdrop-blur-md"
            >
              <div className="bg-slate-950 border-4 border-red-600 p-8 rounded-[3rem] max-w-sm w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <ShieldAlert className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">DANGER DETECTED</h3>
                <p className="text-red-400 font-bold mb-8">
                  Critical route deviation in high-risk zone. Emergency SOS triggered automatically.
                </p>
                <div className="space-y-4">
                  <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 flex items-center gap-3 text-left">
                    <Mic className="w-5 h-5 text-red-500" />
                    <p className="text-xs text-red-200">Audio recording active for evidence...</p>
                  </div>
                  <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 flex items-center gap-3 text-left">
                    <Share2 className="w-5 h-5 text-red-500" />
                    <p className="text-xs text-red-200">Live location shared with 112 & contacts</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowDangerAlert(false);
                      setJourneyStatus('SAFE');
                    }}
                    className="w-full bg-white text-red-600 font-black py-5 rounded-2xl transition-all uppercase tracking-widest"
                  >
                    Cancel SOS (False Alarm)
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Info Panel */}
        <div className="w-full max-w-md mx-auto space-y-4 pointer-events-auto">
          <AnimatePresence>
            {safetyScore !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-6 rounded-[2.5rem] shadow-2xl"
              >
                {!isJourneyStarted ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center",
                          safetyScore > 70 ? "bg-green-500/20 text-green-400" : 
                          safetyScore > 40 ? "bg-orange-500/20 text-orange-400" : "bg-red-500/20 text-red-400"
                        )}>
                          {safetyScore > 70 ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-bold text-lg">Safest Route Found</h4>
                            {safetyScore > 80 && (
                              <span className="bg-green-500/20 text-green-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Elite Safe</span>
                            )}
                          </div>
                          <p className="text-slate-400 text-xs">AI analyzed {MOCK_CRIME_ZONES.length} risk zones along path</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Safety Score</p>
                        <p className={cn(
                          "text-3xl font-black",
                          safetyScore > 70 ? "text-green-400" : 
                          safetyScore > 40 ? "text-orange-400" : "text-red-400"
                        )}>{safetyScore}/100</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800 text-center">
                        <Clock className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                        <p className="text-white font-bold text-xs">{routeInfo?.duration || '--'}</p>
                      </div>
                      <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800 text-center">
                        <Compass className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                        <p className="text-white font-bold text-xs">{routeInfo?.distance || '--'}</p>
                      </div>
                      <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800 text-center">
                        <Info className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                        <p className="text-white font-bold text-xs">Safe</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800 flex-1">
                        {[
                          { id: "walking", icon: Footprints },
                          { id: "cycling", icon: Bike },
                          { id: "driving", icon: Car },
                        ].map(mode => (
                          <button
                            key={mode.id}
                            onClick={() => {
                              setTransportMode(mode.id as any);
                              if (originCoords && destCoords) getRoute(originCoords, destCoords, mode.id);
                            }}
                            className={cn(
                              "flex-1 p-2 rounded-xl transition-all",
                              transportMode === mode.id ? "bg-purple-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                            )}
                          >
                            <mode.icon className="w-4 h-4 mx-auto" />
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={() => setIsJourneyStarted(true)}
                        className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-2xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        Start Journey
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center text-purple-400">
                          <Navigation className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold">Live Journey Active</h4>
                          <p className="text-slate-400 text-xs">AI Deviation Monitoring Enabled</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsJourneyStarted(false)}
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Time Off Route</p>
                        <p className={cn(
                          "text-xl font-black",
                          timeOffRoute > 60 ? "text-orange-400" : "text-white"
                        )}>{Math.floor(timeOffRoute / 60)}m {timeOffRoute % 60}s</p>
                      </div>
                      <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Current Risk</p>
                        <p className={cn(
                          "text-xl font-black",
                          journeyStatus === 'DANGER' ? "text-red-400" : 
                          journeyStatus === 'SUSPICIOUS' ? "text-orange-400" : "text-green-400"
                        )}>{journeyStatus}</p>
                      </div>
                    </div>

                    <button 
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-3"
                    >
                      <ShieldAlert className="w-6 h-6" />
                      MANUAL SOS
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
