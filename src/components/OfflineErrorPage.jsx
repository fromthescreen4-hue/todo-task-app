import React, { useState, useEffect } from 'react';
import { 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  Database, 
  ServerOff, 
  CheckCircle2, 
  AlertCircle, 
  HardDrive, 
  Zap, 
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { storageService } from '../services/storageService';

export default function OfflineErrorPage({ 
  isOpen, 
  onClose, 
  onRetryConnection, 
  isOffline, 
  isApiDown,
  onContinueOffline
}) {
  if (!isOpen) return null;

  const [checking, setChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(new Date().toLocaleTimeString());
  const [checkStatusMsg, setCheckStatusMsg] = useState('');
  const [cachedTaskCount, setCachedTaskCount] = useState(0);

  useEffect(() => {
    try {
      const stored = storageService.getTasks();
      setCachedTaskCount(Array.isArray(stored) ? stored.length : 0);
    } catch (e) {
      setCachedTaskCount(0);
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setChecking(true);
    setCheckStatusMsg('Testing connection to server...');

    try {
      // 1. Test Internet Status
      if (!navigator.onLine) {
        throw new Error('Internet connection is currently offline');
      }

      // 2. Test API Health
      const res = await fetch('http://localhost:5000/api/health', { cache: 'no-store' });
      if (res.ok) {
        setCheckStatusMsg('Server Connection Restored! Syncing...');
        setTimeout(() => {
          setChecking(false);
          if (onRetryConnection) onRetryConnection();
          onClose();
        }, 1000);
      } else {
        throw new Error('Server returned HTTP error status: ' + res.status);
      }
    } catch (err) {
      setChecking(false);
      setLastCheckTime(new Date().toLocaleTimeString());
      setCheckStatusMsg(err.message || 'Connection test failed. Server is currently unreachable.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f0e17]/95 backdrop-blur-2xl animate-fade-in font-sans text-white overflow-y-auto">
      
      {/* Background Glowing Ambient Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none animate-coral-glow" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Modal Card */}
      <div className="max-w-lg w-full bg-[#1a1926]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6 my-auto">
        
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold shadow-sm">
              {isOffline ? <WifiOff className="w-5 h-5 animate-pulse" /> : <ServerOff className="w-5 h-5 animate-pulse" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {isOffline ? 'No Internet' : 'Server Disconnected'}
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white tracking-tight mt-0.5">
                {isOffline ? 'Network Connection Lost' : 'API Backend Unreachable'}
              </h2>
            </div>
          </div>
          
          <div className="text-[10px] font-mono text-slate-400">
            Checked {lastCheckTime}
          </div>
        </div>

        {/* Description Banner */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
          <p className="text-xs text-slate-300 leading-relaxed">
            {isOffline 
              ? 'Your device is not connected to the internet. Don\'t worry — DO THIS automatically saves all your task changes locally on your device.'
              : 'The backend server (http://localhost:5000) is unreachable. Your local workspace data remains 100% safe and accessible in offline mode.'}
          </p>

          {checkStatusMsg && (
            <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
              checkStatusMsg.includes('Restored') 
                ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20' 
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
            }`}>
              {checkStatusMsg.includes('Restored') ? <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
              <span>{checkStatusMsg}</span>
            </div>
          )}
        </div>

        {/* Live Diagnostics Summary */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          
          <div className="p-3 bg-white/5 border border-white/5 rounded-2xl space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-indigo-400" /> Internet Status
            </div>
            <div className="font-extrabold flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className={navigator.onLine ? 'text-emerald-400' : 'text-rose-400'}>
                {navigator.onLine ? 'Online' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-white/5 border border-white/5 rounded-2xl space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-orange-400" /> Local Tasks Saved
            </div>
            <div className="font-extrabold text-orange-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>{cachedTaskCount} Tasks Cached</span>
            </div>
          </div>

        </div>

        {/* Troubleshooting Steps */}
        <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-white/5 text-[11px] text-slate-400 space-y-1.5">
          <div className="font-bold text-slate-200 uppercase tracking-wider text-[10px] flex items-center gap-1 mb-1">
            <Info className="w-3.5 h-3.5 text-orange-400" /> Quick Troubleshooting Tips:
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
            <span>Check your Wi-Fi or cellular network connection.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
            <span>Ensure local backend server script (<code className="text-orange-300 font-mono">npm run server</code>) is running.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          
          <button
            onClick={handleTestConnection}
            disabled={checking}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 hover:opacity-95 text-white font-bold text-xs rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Testing Server Connection...' : 'Retry Server Connection'}
          </button>

          <button
            onClick={() => {
              if (onContinueOffline) onContinueOffline();
              onClose();
            }}
            className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-2xl border border-white/10 transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              <span>Continue in Local Offline Mode</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

        </div>

        <div className="text-[10px] text-center text-slate-500">
          DO THIS Workspace • Offline Storage Engine Active
        </div>

      </div>
    </div>
  );
}
