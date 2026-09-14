import React from 'react';
import { 
  X, 
  Flame, 
  Calendar, 
  Clock, 
  Check, 
  Share2, 
  Edit3, 
  Trash2, 
  Bell,
  Sparkles,
  Award
} from 'lucide-react';

export default function HabitDetailModal({ habit, onClose, onEdit, onDelete, onShare }) {
  if (!habit) return null;

  const bgGradient = habit.period === 'morning' 
    ? 'gradient-teal-card' 
    : habit.period === 'evening' 
      ? 'gradient-indigo-card' 
      : 'gradient-peach-card';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#1a1926] border border-black/5 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Large Gradient Header Card */}
        <div className={`${bgGradient} p-6 relative`}>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-white">
              {habit.category || 'Habit'}
            </span>
            <h2 className="text-xl font-black text-white leading-tight">{habit.title}</h2>
            {habit.description && (
              <p className="text-xs opacity-90 text-white/90 line-clamp-2">{habit.description}</p>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Streak & Completion Card */}
          <div className="pastel-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
                <Flame className="w-5 h-5 fill-orange-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Current Streak</div>
                <div className="text-xs text-slate-400">7 Days Consistency</div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-black text-orange-500">🔥 7 Days</div>
            </div>
          </div>

          {/* Weekly Progress Dots */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Weekly Activity
            </label>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-bold">{day}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx < 5 ? 'bg-teal-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {idx < 5 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : day}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reminder & Recurrence Info */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 font-semibold">
                <Clock className="w-4 h-4 text-indigo-500" /> Reminder Time
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{habit.dueTime || '09:00 AM'}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-2 border-t border-black/5 dark:border-white/5">
              <span className="flex items-center gap-1.5 font-semibold">
                <Calendar className="w-4 h-4 text-emerald-500" /> Repeat Schedule
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-100 capitalize">{habit.recurrence || 'Daily'}</span>
            </div>
          </div>

          {/* Bottom Action Controls */}
          <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
            <button
              onClick={() => { onShare(habit); onClose(); }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" /> Share Link
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { onEdit(habit); onClose(); }}
                className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>

              <button
                onClick={() => { onDelete(habit.id); onClose(); }}
                className="px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
