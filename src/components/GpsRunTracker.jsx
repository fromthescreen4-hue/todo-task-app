import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Navigation,
  Radio,
  Clock,
  Flame,
  Gauge,
  MapPin,
  Check,
  AlertCircle,
  X
} from 'lucide-react';
import { addManualActivity, todayStr } from '../services/db';

// Haversine formula to compute distance in km between two GPS coordinates
function computeDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function GpsRunTracker({ onClose, onComplete, userWeight = 70 }) {
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [gpsStatus, setGpsStatus] = useState('searching'); // 'searching' | 'locked' | 'unsupported' | 'denied'
  const [accuracy, setAccuracy] = useState(null);
  const [coordsList, setCoordsList] = useState([]);

  const watchIdRef = useRef(null);
  const timerRef = useRef(null);
  const lastCoordRef = useRef(null);

  // Initialize and check geolocation support
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unsupported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsStatus('locked');
        setAccuracy(Math.round(pos.coords.accuracy));
      },
      (err) => {
        if (err.code === 1) setGpsStatus('denied');
        else setGpsStatus('searching');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer loop
  useEffect(() => {
    if (active && !paused) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [active, paused]);

  function startTracking() {
    setActive(true);
    setPaused(false);

    if (navigator.geolocation && gpsStatus !== 'denied' && gpsStatus !== 'unsupported') {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsStatus('locked');
          setAccuracy(Math.round(pos.coords.accuracy));

          const { latitude, longitude, speed } = pos.coords;
          if (speed !== null && speed !== undefined) {
            setSpeedKmh(Math.max(0, speed * 3.6));
          }

          if (lastCoordRef.current) {
            const delta = computeDistanceKm(
              lastCoordRef.current.latitude,
              lastCoordRef.current.longitude,
              latitude,
              longitude
            );
            // Filter noise: only accept deltas > 3 meters and < 150 km/h
            if (delta > 0.003 && delta < 0.2) {
              setDistanceKm((prev) => prev + delta);
              setCoordsList((prev) => [...prev, { lat: latitude, lng: longitude }]);
            }
          }
          lastCoordRef.current = { latitude, longitude };
        },
        (err) => {
          console.warn('GPS Error:', err);
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
    }
  }

  function pauseTracking() {
    setPaused(true);
  }

  function resumeTracking() {
    setPaused(false);
  }

  // Calculate calories: Running MET ~ 9.8
  const hours = seconds / 3600;
  const burnedCalories = Math.round(9.8 * userWeight * hours) || Math.round(distanceKm * 65);

  // Calculate pace in min/km
  const paceMinutes = distanceKm > 0.05 ? (seconds / 60 / distanceKm).toFixed(2) : '0:00';

  function finishAndSave() {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    clearInterval(timerRef.current);

    const runData = {
      type: 'Outdoor Running (GPS)',
      duration: Math.round(seconds / 60) || 1,
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      calories: burnedCalories,
      notes: `GPS Cadence run • Avg pace ${paceMinutes} min/km`
    };

    addManualActivity(todayStr(), runData);

    if (onComplete) onComplete(runData);
    if (onClose) onClose();
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-[12px] p-5 sm:p-6 text-white shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                gpsStatus === 'locked' ? 'bg-[#22C55E]' : 'bg-[#FFAE00]'
              } opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                gpsStatus === 'locked' ? 'bg-[#22C55E]' : 'bg-[#FFAE00]'
              }`}></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-white">
              CORE FIT GPS Run Tracker
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-[#8B939E] hover:text-white p-1 rounded-[6px] hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* GPS Signal Status Pill */}
        <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-white/5 border border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#22C55E]" />
            <span className="text-[11px] font-bold text-[#D1D5DB]">
              {gpsStatus === 'locked'
                ? `GPS Locked • ±${accuracy || 4}m Precision`
                : gpsStatus === 'denied'
                ? 'Location Denied (Manual Mode Active)'
                : 'Acquiring Satellites...'}
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#8B939E]">
            {coordsList.length} WAYPOINTS
          </span>
        </div>

        {/* Big Live Metrics Display */}
        <div className="text-center py-2 space-y-1">
          <span className="text-[10px] uppercase font-mono font-bold text-[#8B939E] tracking-widest block">
            DISTANCE RECORDED
          </span>
          <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white">
            {distanceKm.toFixed(2)}
            <span className="text-lg font-bold text-[#FFAE00] ml-1.5 font-sans">KM</span>
          </div>
        </div>

        {/* Secondary Metrics 3-Grid */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-[10px] bg-white/5 border border-white/10 text-center font-mono">
          <div>
            <span className="text-[9px] uppercase font-bold text-[#8B939E] block">Duration</span>
            <span className="text-lg font-bold text-white">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-[#8B939E] block">Pace / KM</span>
            <span className="text-lg font-bold text-white">{paceMinutes}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-[#8B939E] block">Calories</span>
            <span className="text-lg font-bold text-[#FF6B6B]">{burnedCalories} kcal</span>
          </div>
        </div>

        {/* Live Controls */}
        <div className="pt-2">
          {!active ? (
            <button
              onClick={startTracking}
              className="w-full py-3 rounded-[8px] bg-[#FFAE00] hover:bg-[#F09B00] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Initiate GPS Run</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {!paused ? (
                <button
                  onClick={pauseTracking}
                  className="py-2.5 rounded-[8px] bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Run</span>
                </button>
              ) : (
                <button
                  onClick={resumeTracking}
                  className="py-2.5 rounded-[8px] bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume Run</span>
                </button>
              )}

              <button
                onClick={finishAndSave}
                className="py-2.5 rounded-[8px] bg-[#FFAE00] hover:bg-[#F09B00] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Finish & Save</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
