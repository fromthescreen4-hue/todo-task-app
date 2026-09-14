import React from 'react';
import { 
  Search, 
  Mail, 
  Command, 
  Sparkles,
  Zap,
  Moon,
  Sun,
  MessageSquarePlus
} from 'lucide-react';
import { format } from 'date-fns';

export default function Header({ 
  user, 
  onOpenAuthModal, 
  onOpenEmailSimulator, 
  onOpenCommandPalette,
  onOpenFeedbackModal,
  searchQuery,
  setSearchQuery,
  unreadCount,
  isDarkMode,
  setIsDarkMode
}) {
  const today = new Date();
  const dayNumber = format(today, 'd');
  const dayName = format(today, 'EEEE');
  const monthYear = format(today, 'MMMM yyyy');

  return (
    <header className="pt-6 pb-4 px-4 sm:px-8 max-w-4xl mx-auto w-full transition-all">
      <div className="flex items-center justify-between gap-4">
        
        {/* Brand & Date Display */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 bg-white dark:bg-[#1a1926] p-2 pr-3.5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
            <img 
              src="/dothis-logo.png" 
              alt="DO THIS Logo" 
              className="h-8 sm:h-9 w-auto object-contain" 
            />
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-800 dark:text-white hidden xs:inline">
              DO THIS
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-sans">
              {dayNumber}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">
                {dayName}
              </div>
              <div className="text-[10px] sm:text-xs font-medium text-slate-400">
                {monthYear}
              </div>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          
          {/* Feedback & Report Problem Button */}
          <button
            onClick={onOpenFeedbackModal}
            title="Report a Problem / Send Feedback"
            className="p-2.5 rounded-2xl pastel-card text-slate-500 dark:text-slate-300 hover:text-orange-500 transition-colors"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>

          {/* Dark/Light Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="Toggle Dark Mode"
            className="p-2.5 rounded-2xl pastel-card text-slate-500 dark:text-slate-300 hover:text-slate-800 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* User Profile Avatar with Google Badge */}
          <button
            onClick={onOpenAuthModal}
            title={user?.email ? `Signed in as ${user.name || user.email} (${user?.authMethod === 'google' ? 'Google Account' : 'Email Account'})` : 'User Profile'}
            className="relative w-10 h-10 rounded-full p-0.5 border-2 border-orange-400 shadow-md hover:scale-105 transition-transform shrink-0"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-400 to-rose-400 text-white font-bold text-xs flex items-center justify-center">
                {user?.name?.[0] || 'U'}
              </div>
            )}

            {/* Google Account Badge */}
            {(user?.authMethod === 'google' || user?.googleCalendarConnected) && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 flex items-center justify-center shadow-sm">
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
            )}
          </button>

        </div>

      </div>

      {/* Global Search Bar */}
      <div className="mt-4 relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search tasks, subtasks, categories... (Ctrl + K)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-24 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#1a1926] text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition-all font-medium"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onOpenCommandPalette}
            className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 px-2 py-1 rounded-lg border border-black/5 flex items-center gap-1"
          >
            <Command className="w-3 h-3" /> K
          </button>
        </div>
      </div>
    </header>
  );
}
