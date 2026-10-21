import React, { useState } from 'react';
import { UserCheck, LogOut, Cloud } from 'lucide-react';
import { syncToCloudNow } from '../services/db';

export default function Header({ authUser, onLogout, setActiveView }) {
  const [syncing, setSyncing] = useState(false);

  async function handleCloudSync() {
    setSyncing(true);
    try {
      await syncToCloudNow();
    } catch {}
    finally {
      setTimeout(() => setSyncing(false), 1500);
    }
  }

  return (
    <header className="lg:hidden sticky top-0 z-20 bg-[#FFFFFF] border-b border-[#D9DDE2] px-3 sm:px-4 py-2.5 flex items-center justify-between">
      <div
        onClick={() => setActiveView('dashboard')}
        className="flex items-center gap-2.5 cursor-pointer min-w-0"
      >
        <img
          src="/core-fit-logo.png"
          alt="CORE FIT"
          className="w-8 h-8 object-contain flex-shrink-0"
        />
        <div className="min-w-0">
          <span className="text-xs sm:text-sm font-black tracking-tight text-[#15171A] block uppercase leading-none truncate">
            CORE <span className="text-[#FFAE00]">FIT</span>
          </span>
          <span className="text-[8px] sm:text-[9px] uppercase font-bold text-[#555B63] tracking-wider leading-none truncate block mt-0.5">
            Strength From Within
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <button
          onClick={handleCloudSync}
          title="Sync to Cloud"
          className="p-1.5 rounded-[6px] text-[#0284C7] bg-[#F0F9FF] border border-[#BAE6FD]"
        >
          <Cloud className={`w-3.5 h-3.5 ${syncing ? 'animate-bounce' : ''}`} />
        </button>
        <button
          onClick={onLogout}
          title="Sign Out"
          className="p-1.5 rounded-[6px] text-[#555B63] hover:text-[#DC2626] bg-[#F6F6F7] border border-[#D9DDE2]"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
