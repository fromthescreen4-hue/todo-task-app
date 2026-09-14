import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Calendar as CalendarIcon,
  Plus
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { exportTasksToICal } from '../utils/icalGenerator';

export default function CalendarView({ tasks, onEditTask, onOpenCreateTaskModal }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-4">
      
      {/* Calendar Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-100">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <p className="text-xs text-slate-400">Scheduled task deadlines and calendar view</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportTasksToICal(tasks)}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export .ics
          </button>

          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/10">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-2 py-1 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/10 rounded-lg"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-2">
        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, idx) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayTasks = tasks.filter(t => !t.archived && t.dueDate === dayStr);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={idx}
              className={`min-h-[100px] p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                isToday 
                  ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md shadow-indigo-500/10' 
                  : isCurrentMonth 
                    ? 'bg-slate-900/40 border-white/5 hover:border-white/15' 
                    : 'bg-slate-950/20 border-transparent opacity-40'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${isToday ? 'text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full' : 'text-slate-300'}`}>
                  {format(day, 'd')}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-400">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              {/* Day Tasks List */}
              <div className="space-y-1 mt-1 overflow-y-auto max-h-16">
                {dayTasks.slice(0, 3).map(t => (
                  <div
                    key={t.id}
                    onClick={() => onEditTask(t)}
                    className={`px-1.5 py-0.5 rounded text-[10px] truncate cursor-pointer font-medium border ${
                      t.completed 
                        ? 'line-through bg-slate-800/60 text-slate-500 border-white/5' 
                        : t.priority === 'high'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    }`}
                  >
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[9px] text-slate-400 text-center font-semibold">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
