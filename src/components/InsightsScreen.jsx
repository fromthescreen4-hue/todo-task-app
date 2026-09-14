import React from 'react';
import { 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Award, 
  BarChart2, 
  Target,
  Sparkles
} from 'lucide-react';

export default function InsightsScreen({ tasks }) {
  const activeTasks = tasks.filter(t => !t.archived);
  const totalCount = activeTasks.length;
  const completedCount = activeTasks.filter(t => t.completed).length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Best performing & missed habits
  const completedHabits = activeTasks.filter(t => t.completed);
  const missedHabits = activeTasks.filter(t => !t.completed);

  return (
    <div className="space-y-6 pb-24 animate-fade-in max-w-4xl mx-auto px-4 sm:px-8">
      
      {/* Header Streak Card */}
      <div className="gradient-peach-card p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl shadow-inner">
            🔥
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-white">
              Habit Momentum
            </span>
            <h2 className="text-xl font-black text-white mt-1">7 Days Streak!</h2>
            <p className="text-xs text-white/90">Consistency is building your success habit.</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-black text-white">{completionPct}%</div>
          <div className="text-[10px] text-white/80 font-bold">Overall Rate</div>
        </div>
      </div>

      {/* Completion Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="pastel-card p-4 text-center space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Habits</div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalCount}</div>
        </div>

        <div className="pastel-card p-4 text-center space-y-1">
          <div className="text-xs font-bold text-teal-500 uppercase">Completed</div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400">{completedCount}</div>
        </div>

        <div className="pastel-card p-4 text-center space-y-1">
          <div className="text-xs font-bold text-orange-500 uppercase">Streak</div>
          <div className="text-2xl font-black text-orange-500">7 Days</div>
        </div>

        <div className="pastel-card p-4 text-center space-y-1">
          <div className="text-xs font-bold text-indigo-500 uppercase">Best Month</div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">92%</div>
        </div>
      </div>

      {/* Weekly Progress Bar Chart (Clean & Visually Clean) */}
      <div className="pastel-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Weekly Consistency</h3>
            <p className="text-xs text-slate-400">Daily habit completion performance</p>
          </div>
          <span className="text-xs font-bold text-teal-600 bg-teal-500/10 px-2.5 py-1 rounded-xl">
            +14% vs last week
          </span>
        </div>

        {/* Weekly Bar Chart */}
        <div className="grid grid-cols-7 gap-2 items-end h-32 pt-4">
          {[
            { day: 'Mon', pct: 85 },
            { day: 'Tue', pct: 100 },
            { day: 'Wed', pct: 70 },
            { day: 'Thu', pct: 90 },
            { day: 'Fri', pct: 100 },
            { day: 'Sat', pct: 60 },
            { day: 'Sun', pct: 80 }
          ].map((bar, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-[10px] font-bold text-slate-400">{bar.pct}%</span>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl h-full flex items-end p-1">
                <div 
                  className="w-full bg-gradient-to-t from-teal-500 to-emerald-400 rounded-xl transition-all duration-500"
                  style={{ height: `${bar.pct}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-bold text-slate-500">{bar.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Best-Performing & Missed Habits Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Best Performing Habits */}
        <div className="pastel-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-extrabold text-xs uppercase tracking-wider">
            <Award className="w-4 h-4" /> Top Performing Habits
          </div>

          <div className="space-y-2">
            {completedHabits.slice(0, 3).map(h => (
              <div key={h.id} className="p-3 bg-teal-500/10 rounded-2xl flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-100">{h.title}</span>
                <span className="text-[10px] font-bold text-teal-600">100% Done</span>
              </div>
            ))}
            {completedHabits.length === 0 && (
              <div className="text-xs text-slate-400 py-2">Complete habits to see top performers</div>
            )}
          </div>
        </div>

        {/* Missed Habits */}
        <div className="pastel-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-500 font-extrabold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" /> Needs Attention
          </div>

          <div className="space-y-2">
            {missedHabits.slice(0, 3).map(h => (
              <div key={h.id} className="p-3 bg-rose-500/10 rounded-2xl flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-100">{h.title}</span>
                <span className="text-[10px] font-bold text-rose-500">Pending</span>
              </div>
            ))}
            {missedHabits.length === 0 && (
              <div className="text-xs text-slate-400 py-2">All habits are completed!</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
