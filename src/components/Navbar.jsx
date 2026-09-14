import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Mic, 
  MicOff, 
  Bell, 
  Palette, 
  User, 
  Zap, 
  Command, 
  Calendar, 
  Mail,
  CheckCircle2,
  Share2
} from 'lucide-react';

export default function Navbar({ 
  searchQuery, 
  setSearchQuery, 
  onOpenCreateTaskModal, 
  onOpenCommandPalette,
  onOpenAuthModal,
  onOpenEmailSimulator,
  activeTheme,
  setActiveTheme,
  user,
  unreadCount,
  isListeningVoice,
  toggleVoiceInput
}) {
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const themes = [
    { id: 'dark', name: 'Dark Glass', color: '#6366f1' },
    { id: 'light', name: 'Light Clean', color: '#4f46e5' },
    { id: 'neon', name: 'Cyberpunk Neon', color: '#ec4899' },
    { id: 'emerald', name: 'Emerald Forest', color: '#10b981' },
    { id: 'midnight', name: 'Midnight Blue', color: '#38bdf8' }
  ];

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-white/10 px-4 lg:px-8 py-3 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <img 
            src="/dothis-logo.png" 
            alt="DO THIS Logo" 
            className="h-9 w-auto object-contain" 
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-800 dark:text-white">
                DO THIS
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-orange-500/20 text-orange-500 border border-orange-500/30 rounded-full">
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Task & Google Calendar Suite</p>
          </div>
        </div>

        {/* Global Search & Quick Actions */}
        <div className="flex-1 max-w-xl hidden md:flex items-center gap-2">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, tags, categories... (Ctrl + K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-2 text-sm bg-slate-900/60 text-slate-100 placeholder-slate-400 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <button
              onClick={onOpenCommandPalette}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md border border-white/10 flex items-center gap-1 transition-colors"
            >
              <Command className="w-3 h-3" /> K
            </button>
          </div>

          {/* Voice Input Button */}
          <button
            onClick={toggleVoiceInput}
            title={isListeningVoice ? "Stop Voice Dictation" : "Voice Input (Speech-to-Text)"}
            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
              isListeningVoice 
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse' 
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-white/10'
            }`}
          >
            {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Create Task Button */}
          <button
            onClick={onOpenCreateTaskModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>

          {/* Theme Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              title="Change UI Theme"
              className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors"
            >
              <Palette className="w-4 h-4" />
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-48 py-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 animate-fade-in">
                <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-white/5 mb-1">
                  Select Theme
                </div>
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTheme(t.id);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between hover:bg-white/5 transition-colors ${
                      activeTheme === t.id ? 'text-indigo-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: t.color }}></span>
                      {t.name}
                    </div>
                    {activeTheme === t.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Outbound Email & Notifications Log Button */}
          <button
            onClick={onOpenEmailSimulator}
            title="Outbound Email & Notification Inbox"
            className="relative p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors"
          >
            <Mail className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Account / Profile Button */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-6 h-6 rounded-full object-cover border border-indigo-400" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.[0] || 'U'}
              </div>
            )}
            <span className="text-xs font-medium max-w-[100px] truncate hidden lg:inline">
              {user?.name || 'Account'}
            </span>
          </button>

        </div>
      </div>
    </header>
  );
}
