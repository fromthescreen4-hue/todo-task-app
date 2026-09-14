import React from 'react';
import { 
  Flame, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  BarChart2, 
  PieChart, 
  TrendingUp, 
  Target,
  Award
} from 'lucide-react';

export default function AnalyticsView({ tasks }) {
  const activeTasks = tasks.filter(t => !t.archived);
  const total = activeTasks.length;
  const completed = activeTasks.filter(t => t.completed).length;
  const pending = total - completed;
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdue = activeTasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Category breakdown
  const categoryCounts = {};
  activeTasks.forEach(t => {
    const cat = t.category || 'Work';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  // Priority breakdown
  const priorityCounts = {
    high: activeTasks.filter(t => t.priority === 'high').length,
    medium: activeTasks.filter(t => t.priority === 'medium').length,
    low: activeTasks.filter(t => t.priority === 'low').length
  };

  return (
    <div className="space-y-6 pb-28 animate-fade-in max-w-4xl mx-auto px-4 sm:px-8">
      
      {/* Header Banner */}
      <div className="gradient-peach-card p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl shadow-inner">
            🔥
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-white">
              Productivity Suite
            </span>
            <h2 className="text-xl font-black text-white mt-1">Execution Momentum</h2>
            <p className="text-xs text-white/90">Keep the momentum going! Track your task completion stats.</p>
          </div>
        </div>

        {/* Completion Gauge Badge */}
        <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30 text-white">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase text-white/80">Total Completion</div>
            <div className="text-2xl font-black text-white">
              {completionRate}%
            </div>
          </div>
          <div className="w-11 h-11 rounded-full border-4 border-white/40 flex items-center justify-center font-bold text-xs text-white">
            {completionRate}%
          </div>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Total Tasks" value={total} subtitle="Active workspace" badgeColor="bg-indigo-500/10 text-indigo-500" />
        <StatCard title="Completed" value={completed} subtitle={`${completionRate}% finish rate`} badgeColor="bg-teal-500/10 text-teal-500" />
        <StatCard title="Pending" value={pending} subtitle="In progress" badgeColor="bg-amber-500/10 text-amber-500" />
        <StatCard title="Overdue" value={overdue} subtitle="Action required" badgeColor="bg-rose-500/10 text-rose-500" />
      </div>

      {/* Category Breakdown & Priority Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Category Distribution */}
        <div className="pastel-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-500" /> Category Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-bold">{Object.keys(categoryCounts).length} Lists</span>
          </div>

          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([catName, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={catName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800 dark:text-slate-200">{catName}</span>
                    <span className="text-slate-400">{count} tasks ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-400 to-rose-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="pastel-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-500" /> Priority Distribution
            </h3>
            <span className="text-xs text-slate-400 font-bold">Execution</span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-rose-500/10 rounded-2xl flex items-center justify-between text-xs font-bold">
              <span className="text-rose-500">High Priority</span>
              <span className="text-slate-800 dark:text-slate-100">{priorityCounts.high}</span>
            </div>

            <div className="p-3 bg-amber-500/10 rounded-2xl flex items-center justify-between text-xs font-bold">
              <span className="text-amber-500">Medium Priority</span>
              <span className="text-slate-800 dark:text-slate-100">{priorityCounts.medium}</span>
            </div>

            <div className="p-3 bg-teal-500/10 rounded-2xl flex items-center justify-between text-xs font-bold">
              <span className="text-teal-600 dark:text-teal-400">Low Priority</span>
              <span className="text-slate-800 dark:text-slate-100">{priorityCounts.low}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

function StatCard({ title, value, subtitle, badgeColor }) {
  return (
    <div className="pastel-card p-4 space-y-1">
      <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${badgeColor}`}>
        {title}
      </div>
      <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{value}</div>
      <div className="text-[10px] text-slate-400">{subtitle}</div>
    </div>
  );
}
