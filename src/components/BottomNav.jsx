import React, { useState } from 'react';
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  TrendingUp,
  MoreHorizontal,
  Footprints,
  Scale,
  Droplets,
  Target,
  Settings as SettingsIcon,
  X,
  BookOpen,
  LogOut
} from 'lucide-react';

export default function BottomNav({ activeView, setActiveView, onLogout, authUser }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mainTabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
  ];

  const moreItems = [
    { id: 'library', label: 'Exercise Library', icon: BookOpen, desc: 'Exercise form demonstrations' },
    { id: 'movement', label: 'Movement & Steps', icon: Footprints, desc: 'Daily steps and cardio logs' },
    { id: 'weight', label: 'Weight & Body', icon: Scale, desc: 'Weigh-ins and body measurements' },
    { id: 'habits', label: 'Water & Habits', icon: Droplets, desc: 'Hydration and daily checklist' },
    { id: 'goals', label: 'Goals & Routine', icon: Target, desc: 'Personalized plan & macros' },
    { id: 'settings', label: 'Profile & Settings', icon: SettingsIcon, desc: 'Units, export & data control' },
  ];

  const isMoreActive = moreItems.some(i => i.id === activeView);

  function handleSelect(id) {
    setActiveView(id);
    setDrawerOpen(false);
  }

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#FFFFFF] border-t border-[#D9DDE2] px-2 flex items-center justify-around z-30 shadow-md pb-[env(safe-area-inset-bottom,0px)]">
        {mainTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
                isActive ? 'text-[#FFAE00]' : 'text-[#555B63] hover:text-[#15171A]'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFAE00] mt-0.5 animate-pulse" />
              )}
            </button>
          );
        })}

        {/* More Tab Button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
            isMoreActive ? 'text-[#FFAE00]' : 'text-[#555B63] hover:text-[#15171A]'
          }`}
        >
          <MoreHorizontal className={`w-5 h-5 mb-0.5 transition-transform ${isMoreActive ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold tracking-tight">More</span>
          {isMoreActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFAE00] mt-0.5 animate-pulse" />
          )}
        </button>
      </nav>

      {/* Slide-up "More" Drawer for Mobile */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40 modal-backdrop-blur flex flex-col justify-end">
          <div className="bg-[#FFFFFF] rounded-t-2xl border-t border-[#D9DDE2] p-4 sm:p-5 max-h-[82vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9DDE2] mb-3">
              <div>
                <span className="text-sm font-extrabold text-[#15171A] uppercase tracking-wide">
                  All App Sections
                </span>
                <p className="text-[11px] text-[#555B63]">Direct navigation to modules</p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-[6px] text-[#555B63] hover:text-[#15171A] bg-[#F6F6F7] border border-[#D9DDE2] active:scale-95 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 pb-6">
              {moreItems.map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-[8px] border text-left transition-all active:scale-[0.98] ${
                      isActive
                        ? 'bg-[#FFF8E7] border-[#FDE68A] text-[#D97706] shadow-xs'
                        : 'bg-[#FFFFFF] border-[#D9DDE2] text-[#15171A] hover:bg-[#F6F6F7]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-[6px] flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-[#FFAE00] text-white' : 'bg-[#F6F6F7] text-[#555B63]'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{item.label}</div>
                      <div className="text-[11px] text-[#555B63] truncate">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Direct Sign Out Action */}
            {onLogout && (
              <div className="pt-3 border-t border-[#ECEEF2] space-y-2">
                {authUser?.email && (
                  <div className="text-[10px] text-center text-[#6F767E] truncate font-mono">
                    Signed in as <span className="font-bold text-[#1A1D1F]">{authUser.email}</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5]/60 text-[#DC2626] font-extrabold text-xs hover:bg-[#FEE2E2] active:scale-[0.98] transition-all shadow-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
