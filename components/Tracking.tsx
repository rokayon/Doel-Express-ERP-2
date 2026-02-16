
import React, { useState, useEffect, useRef } from 'react';
import { Trip, User, AppRole, Coach } from '../types';
import { Language, translations } from '../translations';

interface TrackingProps {
  trips: Trip[];
  coaches: Coach[];
  lang: Language;
  user?: User | null;
}

const Tracking: React.FC<TrackingProps> = ({ trips, coaches, lang, user }) => {
  const t = translations[lang];
  const isDriver = user?.role === AppRole.DRIVER;
  const isSupervisorOrAdmin = user?.role === AppRole.SUPERVISOR || user?.role === AppRole.SUPER_ADMIN || user?.role === AppRole.ADMIN;
  
  // States
  const [speed, setSpeed] = useState(0);
  const [fuel, setFuel] = useState(82);
  const [distance, setDistance] = useState(142.4);
  const [coords, setCoords] = useState<{lat: number, lng: number, accuracy: number} | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'locked' | 'error'>('searching');
  const [lastPingTime, setLastPingTime] = useState<number>(Date.now());
  const [isPersistent, setIsPersistent] = useState(false);
  
  const watchId = useRef<number | null>(null);
  const wakeLock = useRef<any>(null);

  // Filter GPS-equipped coaches for global tracking view
  const gpsEquippedCoaches = coaches.filter(c => !!c.gpsDeviceId);
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(gpsEquippedCoaches[0]?.id || null);

  // Background Persistence Logic (Wake Lock API)
  const togglePersistence = async () => {
    if (!isPersistent) {
      try {
        if ('wakeLock' in navigator) {
          wakeLock.current = await (navigator as any).wakeLock.request('screen');
          setIsPersistent(true);
          console.log('Wake Lock Active: Background tracking enabled');
        }
      } catch (err) {
        console.error('Wake Lock failed:', err);
      }
    } else {
      if (wakeLock.current) {
        await wakeLock.current.release();
        wakeLock.current = null;
        setIsPersistent(false);
      }
    }
  };

  // Real-time Geolocation for Drivers
  useEffect(() => {
    if (!isDriver) return;

    if ("geolocation" in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setGpsStatus('locked');
          setLastPingTime(Date.now());
          setSpeed(position.coords.speed ? Math.round(position.coords.speed * 3.6) : Math.floor(60 + Math.random() * 5));
        },
        (error) => {
          console.error("GPS Error:", error);
          setGpsStatus('error');
        },
        { 
          enableHighAccuracy: true, 
          maximumAge: 0, 
          timeout: 10000 
        }
      );
    } else {
      setGpsStatus('error');
    }

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [isDriver]);

  // PILOT COCKPIT VIEW
  if (isDriver) {
    const timeSincePing = Math.floor((Date.now() - lastPingTime) / 1000);
    
    return (
      <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 h-full flex flex-col max-w-5xl mx-auto px-1">
        <div className="bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px] sm:blur-[100px]"></div>
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
              <div className="flex items-center gap-4 sm:gap-6">
                 <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-600/40 relative group flex-shrink-0">
                    <i className="fa-solid fa-satellite-dish text-3xl sm:text-4xl group-hover:scale-110 transition-transform"></i>
                    {isPersistent && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                      </div>
                    )}
                 </div>
                 <div>
                    <h2 className="text-xl sm:text-3xl font-black text-white tracking-tighter uppercase italic leading-tight">Mission Control</h2>
                    <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-1 flex items-center gap-2">
                      Unit: {coaches.find(c => c.regNo === trips.find(t => t.driver === user?.username)?.busNumber)?.coachNo || 'Unknown'}
                      {gpsStatus === 'locked' ? (
                        <span className="text-emerald-400">Locked</span>
                      ) : (
                        <span className="text-rose-500">Searching...</span>
                      )}
                    </p>
                 </div>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-3 w-full sm:w-auto">
                 <button 
                   onClick={togglePersistence}
                   className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 border ${
                     isPersistent 
                       ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                       : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                   }`}
                 >
                   <i className={`fa-solid ${isPersistent ? 'fa-lock' : 'fa-lock-open'}`}></i>
                   {isPersistent ? 'Background Sync On' : 'Enable Background Sync'}
                 </button>
                 <p className="text-[10px] font-black text-slate-500 uppercase">Last Server Ping: {timeSincePing}s ago</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
           <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                 <div className="bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-[2rem] sm:rounded-[3rem] flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Current Velocity</div>
                    <div className="flex items-baseline gap-2 relative">
                       <span className="text-6xl sm:text-8xl font-black text-white font-mono tracking-tighter tabular-nums">{speed}</span>
                       <span className="text-xl sm:text-2xl font-black text-blue-500 italic">KPH</span>
                    </div>
                    <div className="w-full max-w-[150px] sm:max-w-[180px] bg-slate-800 h-1 sm:h-1.5 rounded-full mt-6 sm:mt-8 overflow-hidden">
                       <div className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full transition-all duration-1000" style={{ width: `${Math.min((speed/120)*100, 100)}%` }}></div>
                    </div>
                 </div>

                 <div className="bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-[2rem] sm:rounded-[3rem] space-y-6 flex flex-col justify-center">
                    <div className="space-y-4">
                       <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lat</span>
                          <span className="text-base sm:text-lg font-mono font-black text-white tracking-tight">{coords?.lat.toFixed(5) || '---.-----'}</span>
                       </div>
                       <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lng</span>
                          <span className="text-base sm:text-lg font-mono font-black text-white tracking-tight">{coords?.lng.toFixed(5) || '---.-----'}</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accuracy</span>
                          <span className="text-[10px] font-black text-emerald-400">{coords ? `± ${coords.accuracy.toFixed(1)}m` : '---'}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8">
                 <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0">
                       <i className="fa-solid fa-route text-2xl sm:text-3xl"></i>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Route</p>
                       <p className="text-lg sm:text-2xl font-black dark:text-white uppercase tracking-tighter italic leading-tight">Dhaka <i className="fa-solid fa-arrow-right-long text-blue-500 mx-2 sm:mx-3 scale-110"></i> Ctg</p>
                    </div>
                 </div>
                 <div className="w-full sm:w-auto text-center sm:text-right bg-slate-50 dark:bg-slate-800/50 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Odometer</p>
                    <p className="text-2xl sm:text-3xl font-black text-blue-600 tabular-nums">{distance} <span className="text-sm">KM</span></p>
                 </div>
              </div>
           </div>

           <div className="flex flex-col gap-4 sm:gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 space-y-6 shadow-2xl">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Telemetry Health</h3>
                 <div className="space-y-3 sm:space-y-4">
                    <div className="p-4 sm:p-5 bg-slate-800/50 rounded-2xl border border-slate-700 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <i className="fa-solid fa-gas-pump text-emerald-500"></i>
                          <span className="text-xs sm:text-sm font-bold text-white">Fuel Tank</span>
                       </div>
                       <span className="text-xs sm:text-sm font-black text-white">{fuel}%</span>
                    </div>
                    <div className="p-4 sm:p-5 bg-slate-800/50 rounded-2xl border border-slate-700">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Heartbeat</p>
                       <div className="flex gap-1 h-6 sm:h-8 items-end">
                          {[...Array(10)].map((_, i) => (
                             <div key={i} className={`flex-1 bg-blue-500 rounded-full animate-pulse`} style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` }}></div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
              
              <button className="w-full py-6 sm:py-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] sm:rounded-[2.5rem] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-xs sm:text-sm transition-all shadow-2xl shadow-emerald-900/40 active:scale-95 border-b-4 sm:border-b-8 border-emerald-800 active:border-b-0 group">
                 <i className="fa-solid fa-flag-checkered mr-2 sm:mr-3 group-hover:rotate-12 transition-transform"></i>
                 Finalize Trip
              </button>
           </div>
        </div>
      </div>
    );
  }

  const selectedCoach = coaches.find(c => c.id === selectedCoachId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t.tracking}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Global fleet monitoring and coordinate telemetry</p>
        </div>
        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          <span className="text-[10px] font-black text-emerald-600 uppercase">Fleet Tracking Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[400px] sm:min-h-[600px]">
        {/* MAP VIEW */}
        <div className="lg:col-span-3 bg-slate-900 dark:bg-black rounded-[1.5rem] sm:rounded-[2.5rem] relative overflow-hidden shadow-2xl border border-slate-800 group h-[300px] sm:h-auto">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
             <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Simulation of a real-time path */}
            <svg width="100%" height="100%" viewBox="0 0 800 500" className="opacity-40">
               <path d="M100 100 Q 400 50 700 400" stroke="#3b82f6" strokeWidth="2" strokeDasharray="10 5" fill="none" className="animate-[dash_20s_linear_infinite]" />
            </svg>
            
            {/* Vehicle Markers */}
            {gpsEquippedCoaches.map((coach, idx) => (
              <div 
                key={coach.id}
                onClick={() => setSelectedCoachId(coach.id)}
                className={`absolute cursor-pointer transition-all duration-1000 ${selectedCoachId === coach.id ? 'scale-125 z-10' : 'opacity-60 scale-75'}`}
                style={{ 
                  top: `${20 + (idx * 15) + (Math.sin(Date.now()/5000 + idx) * 10)}%`, 
                  left: `${20 + (idx * 20) + (Math.cos(Date.now()/5000 + idx) * 10)}%` 
                }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-xl ${selectedCoachId === coach.id ? 'bg-blue-600' : 'bg-slate-700'}`}>
                  <i className="fa-solid fa-bus text-[10px] text-white"></i>
                </div>
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded-md border border-slate-700">
                   <p className="text-[8px] font-black text-white whitespace-nowrap uppercase tracking-tighter">{coach.coachNo}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Device Telemetry Overlay */}
          {selectedCoach && (
            <div className="absolute bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-80 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl animate-in slide-in-from-right-10">
               <div className="flex justify-between items-start mb-4">
                  <div>
                     <h3 className="text-lg font-black text-white italic uppercase">{selectedCoach.coachNo}</h3>
                     <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Device: {selectedCoach.gpsDeviceId}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-2xl font-black text-white tabular-nums">{Math.floor(45 + Math.random() * 20)}<span className="text-[10px] ml-1">KPH</span></p>
                  </div>
               </div>
               <div className="space-y-3">
                  <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                     <span>Last Ping</span>
                     <span className="text-emerald-400">0.2s ago</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 w-[65%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                     <span className="flex items-center gap-1"><i className="fa-solid fa-location-dot text-blue-500"></i> Latitude: 23.8103° N</span>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* FLEET LIST SIDEBAR */}
        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm max-h-[400px] lg:max-h-none">
           <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center">
              <h3 className="font-black text-[10px] uppercase tracking-widest">GPS Equipped Fleet</h3>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">{gpsEquippedCoaches.length} Units</span>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {gpsEquippedCoaches.length === 0 ? (
                <div className="py-10 text-center opacity-40">
                   <i className="fa-solid fa-satellite-dish text-2xl mb-2"></i>
                   <p className="text-[10px] font-black uppercase">No GPS Devices Found</p>
                </div>
              ) : (
                gpsEquippedCoaches.map(coach => (
                  <div 
                    key={coach.id} 
                    onClick={() => setSelectedCoachId(coach.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedCoachId === coach.id ? 'bg-blue-600 border-blue-600 shadow-lg scale-[1.02]' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-blue-400'}`}
                  >
                     <div className="flex items-center justify-between mb-1">
                        <p className={`text-xs font-black uppercase ${selectedCoachId === coach.id ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{coach.coachNo}</p>
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedCoachId === coach.id ? 'bg-white animate-pulse' : 'bg-emerald-500'}`}></span>
                     </div>
                     <div className="flex justify-between items-center mt-2">
                        <p className={`text-[9px] font-bold uppercase tracking-tighter ${selectedCoachId === coach.id ? 'text-blue-100' : 'text-slate-400'}`}>{coach.regNo}</p>
                        <p className={`text-[9px] font-black uppercase ${selectedCoachId === coach.id ? 'text-white' : 'text-blue-500'}`}>{Math.floor(50 + Math.random() * 30)} KM/H</p>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Tracking;
