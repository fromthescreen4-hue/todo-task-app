import React from 'react';
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  TrendingUp,
  Footprints,
  Scale,
  Target,
  Droplets,
  BookOpen,
  Settings as SettingsIcon,
  LogOut,
  UserCheck
} from 'lucide-react';

export default function Sidebar({ activeView, setActiveView, authUser, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Home Dashboard', icon: LayoutDashboard },
    { id: 'workouts', label: 'Active Workout', icon: Dumbbell },
    { id: 'library', label: 'Exercise Library', icon: BookOpen },
    { id: 'nutrition', label: 'Nutrition & Foods', icon: Utensils },
    { id: 'movement', label: 'Movement & Steps', icon: Footprints },
    { id: 'weight', label: 'Weight & Body', icon: Scale },
    { id: 'habits', label: 'Water & Habits', icon: Droplets },
    { id: 'progress', label: 'Progress & Reports', icon: TrendingUp },
    { id: 'goals', label: 'Goals & Routine', icon: Target },
    { id: 'settings', label: 'Profile & Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[260px] bg-[#FFFFFF] border-r border-[#D9DDE2] flex-col z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#D9DDE2]">
        <div className="flex items-center gap-3">
          <img
            src="/core-fit-logo.png"
            alt="CORE FIT"
            className="w-10 h-10 object-contain flex-shrink-0"
          />
          <div>
            <span className="text-base font-extrabold tracking-tight text-[#15171A] block uppercase">
              CORE <span className="text-[#FFAE00]">FIT</span>
            </span>
            <span className="text-[10px] uppercase font-semibold text-[#555B63] tracking-wider block">
              Strength From Within
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B939E] px-3 py-1">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-xs font-semibold transition-all duration-150 text-left active:scale-[0.98] ${
                isActive
                  ? 'bg-[#FEF2F2] text-[#FFAE00] border border-[#FCA5A5] shadow-xs'
                  : 'text-[#555B63] hover:text-[#15171A] hover:bg-[#F6F6F7]'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 ${isActive ? 'text-[#FFAE00] scale-105' : 'text-[#555B63]'}`} />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FFAE00] animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-4 border-t border-[#D9DDE2] bg-[#F6F6F7]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-[6px] bg-[#FFFFFF] border border-[#D9DDE2] flex items-center justify-center text-[#15171A] text-xs font-bold">
              <UserCheck className="w-3.5 h-3.5 text-[#555B63]" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-[#15171A] truncate">
                {authUser?.name || 'Athlete'}
              </div>
              <div className="text-[10px] text-[#555B63] truncate">
                {authUser?.email || 'Local Session'}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 rounded-[6px] text-[#555B63] hover:text-[#DC2626] hover:bg-[#FFFFFF] border border-transparent hover:border-[#D9DDE2] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
