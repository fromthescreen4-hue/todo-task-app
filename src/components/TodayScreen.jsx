import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Check, 
  Clock, 
  MoreVertical, 
  Share2, 
  Flame, 
  Plus, 
  Sparkles,
  BookOpen,
  Coffee,
  Activity,
  Heart,
  Music,
  Smile,
  ChevronRight
} from 'lucide-react';
import { notificationService } from '../services/notificationService';

export default function TodayScreen({ 
  tasks, 
  onToggleComplete, 
  onToggleSubtask, 
  onEditTask, 
  onDeleteTask, 
  onShareTask,
  onOpenAddHabitModal,
  onOpenHabitDetail
}) {
  const [activeSection, setActiveSection] = useState('all');

  // Quick "Clock In" habit cards data matching reference image style
  const clockInHabits = [
    { id: 'h_reading', name: 'Reading', streak: '7 days', icon: <BookOpen className="w-5 h-5 text-pink-500" />, bg: 'from-pink-400 to-rose-400' },
    { id: 'h_movie', name: 'Movie', streak: '2 days', icon: <Music className="w-5 h-5 text-indigo-500" />, bg: 'from-indigo-400 to-purple-500' },
    { id: 'h_breakfast', name: 'Breakfast', streak: '7 days', icon: <Coffee className="w-5 h-5 text-amber-500" />, bg: 'from-amber-400 to-orange-400' },
    { id: 'h_movement', name: 'Movement', streak: '5 days', icon: <Activity className="w-5 h-5 text-emerald-500" />, bg: 'from-emerald-400 to-teal-500' }
  ];

  // Group tasks by period of day
  const morningTasks = tasks.filter(t => !t.archived && (t.period === 'morning' || t.dueTime < '12:00'));
  const afternoonTasks = tasks.filter(t => !t.archived && (t.period === 'afternoon' || (t.dueTime >= '12:00' && t.dueTime < '18:00')));
  const eveningTasks = tasks.filter(t => !t.archived && (t.period === 'evening' || t.dueTime >= '18:00' || !t.dueTime));

  const handleCheck = (taskId, e) => {
    e.stopPropagation();
    onToggleComplete(taskId);
    confetti({ particleCount: 40, spread: 55, origin: { y: 0.7 } });
    notificationService.playAudioChime('success');
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in max-w-4xl mx-auto px-4 sm:px-8">
      
      {/* Today Progress Overview Bar */}
      <div className="pastel-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-400 to-rose-400 flex items-center justify-center text-white font-black text-sm shadow-md">
            {Math.round((tasks.filter(t => !t.archived && t.completed).length / (tasks.filter(t => !t.archived).length || 1)) * 100)}%
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Daily Habit Goal</h3>
            <p className="text-xs text-slate-400">
              {tasks.filter(t => !t.archived && t.completed).length} of {tasks.filter(t => !t.archived).length} tasks completed today
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAddHabitModal}
          className="px-3.5 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-orange-glow flex items-center gap-1 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Habit
        </button>
      </div>

      {/* Clock In / Quick Habit Cards Strip (Matching Reference Right Phone Screen) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Clock in</h2>
          <span className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer">View all</span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {clockInHabits.map(h => (
            <div
              key={h.id}
              onClick={() => onOpenAddHabitModal()}
              className={`min-w-[130px] p-4 rounded-3xl bg-gradient-to-br ${h.bg} text-white shadow-lg cursor-pointer hover:scale-105 transition-transform flex flex-col justify-between h-32 relative overflow-hidden`}
            >
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                {h.icon}
              </div>

              <div>
                <div className="text-sm font-black tracking-tight">{h.name}</div>
                <div className="text-[10px] opacity-80 font-medium">{h.streak}</div>
              </div>

              {/* Small Floating Plus Button inside Card */}
              <div className="absolute right-3 bottom-3 w-6 h-6 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grouped Time-of-Day Cards (Matching Reference Left Phone Screen) */}
      <div className="space-y-4">
        
        {/* Morning Section Card (Teal Gradient Header Card in Reference) */}
        <div className="gradient-teal-card p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold opacity-95 border-b border-white/20 pb-2">
            <span className="text-base font-extrabold tracking-tight">In the morning</span>
            <span className="text-[11px]">Today</span>
          </div>

          <div className="space-y-2">
            {morningTasks.length > 0 ? (
              morningTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => onOpenHabitDetail(t)}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => handleCheck(t.id, e)}
                      className={`soft-checkbox ${t.completed ? 'checked-white text-teal-600' : 'border-white/50'}`}
                    >
                      {t.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <div>
                      <div className={`text-xs font-bold ${t.completed ? 'line-through opacity-70' : ''}`}>
                        {t.title}
                      </div>
                      <div className="text-[10px] opacity-80">{t.dueTime || '08:00 AM'}</div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); onShareTask(t); }}
                    className="p-1 hover:bg-white/20 rounded-lg"
                  >
                    <Share2 className="w-3.5 h-3.5 opacity-80" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-xs opacity-80 py-2 text-center">No morning habits scheduled</div>
            )}
          </div>
        </div>

        {/* Afternoon / After Work Section Card (White Card in Reference) */}
        <div className="pastel-card p-5 space-y-3">
          <div className="flex items-center justify-between text-slate-800 dark:text-slate-100 border-b border-black/5 dark:border-white/5 pb-2">
            <span className="text-base font-extrabold tracking-tight">After work</span>
            <span className="text-xs text-slate-400 font-medium">Today</span>
          </div>

          <div className="space-y-2">
            {afternoonTasks.length > 0 ? (
              afternoonTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => onOpenHabitDetail(t)}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => handleCheck(t.id, e)}
                      className={`soft-checkbox ${t.completed ? 'checked-orange' : 'border-slate-300 dark:border-slate-600'}`}
                    >
                      {t.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <div>
                      <div className={`text-xs font-bold ${t.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                        {t.title}
                      </div>
                      <div className="text-[10px] text-slate-400">{t.dueTime || '02:00 PM'}</div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); onShareTask(t); }}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-2 text-center">No afternoon habits scheduled</div>
            )}
          </div>
        </div>

        {/* Evening / Going to bed Section Card (Periwinkle Blue Card in Reference) */}
        <div className="gradient-indigo-card p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold opacity-95 border-b border-white/20 pb-2">
            <span className="text-base font-extrabold tracking-tight">Going to bed</span>
            <span className="text-[11px]">Today</span>
          </div>

          <div className="space-y-2">
            {eveningTasks.length > 0 ? (
              eveningTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => onOpenHabitDetail(t)}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => handleCheck(t.id, e)}
                      className={`soft-checkbox ${t.completed ? 'checked-white text-indigo-600' : 'border-white/50'}`}
                    >
                      {t.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <div>
                      <div className={`text-xs font-bold ${t.completed ? 'line-through opacity-70' : ''}`}>
                        {t.title}
                      </div>
                      <div className="text-[10px] opacity-80">{t.dueTime || '09:00 PM'}</div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); onShareTask(t); }}
                    className="p-1 hover:bg-white/20 rounded-lg"
                  >
                    <Share2 className="w-3.5 h-3.5 opacity-80" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-xs opacity-80 py-2 text-center">No evening habits scheduled</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
