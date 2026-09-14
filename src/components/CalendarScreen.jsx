import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Upload,
  Check, 
  Calendar as CalendarIcon,
  Clock,
  Plus,
  RefreshCw,
  ExternalLink,
  Grid,
  ListFilter,
  Sparkles,
  Layers
} from 'lucide-react';
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek as startOfWeekMonth, 
  endOfWeek as endOfWeekMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { exportTasksToICal } from '../utils/icalGenerator';
import { googleCalendarService } from '../services/googleCalendarService';

export default function CalendarScreen({ tasks, onToggleComplete, onOpenCreateTaskModal, onEditTask, onImportTask }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month' | 'day_schedule'
  const [syncState, setSyncState] = useState(() => googleCalendarService.getSyncState());
  const [syncMessage, setSyncMessage] = useState('');

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayTasks = tasks.filter(t => !t.archived && t.dueDate === selectedDateStr);

  // Week calculation
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  // Month calculation
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeekMonth(monthStart);
  const endDate = endOfWeekMonth(monthEnd);
  const monthDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Hourly time slots for Day Schedule (06:00 to 23:00)
  const hours = Array.from({ length: 18 }).map((_, i) => i + 6);

  // Trigger Google Calendar batch sync
  const handleBatchSync = () => {
    const res = googleCalendarService.batchSyncToGoogleCalendar(tasks);
    setSyncState(googleCalendarService.getSyncState());
    setSyncMessage(`Synced ${res.syncedCount} tasks to Google Calendar!`);
    setTimeout(() => setSyncMessage(''), 2500);
  };

  // Open Google Calendar event link for task
  const handleOpenGCal = (e, task) => {
    e.stopPropagation();
    googleCalendarService.openInGoogleCalendar(task);
    setSyncState(googleCalendarService.getSyncState());
  };

  // Handle iCal import
  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const imported = googleCalendarService.parseGoogleCalendarICS(content);
      if (imported.length > 0) {
        imported.forEach(t => onImportTask && onImportTask(t));
        setSyncMessage(`Successfully imported ${imported.length} Google Calendar events!`);
        setTimeout(() => setSyncMessage(''), 3000);
      } else {
        setSyncMessage('No valid calendar events found in file.');
        setTimeout(() => setSyncMessage(''), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-28 animate-fade-in max-w-4xl mx-auto px-4 sm:px-8">
      
      {/* Google Calendar Sync Live Status Bar */}
      <div className="pastel-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-400/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-orange-400/40 shadow-sm flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Google Calendar Live Sync
              </h3>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                ● Connected
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {syncState.syncedCount} task events linked to Google Calendar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBatchSync}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 border border-orange-400/40 rounded-xl shadow-sm hover:scale-105 transition-transform flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sync All
          </button>

          <label className="px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-black/5 dark:border-white/10 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Import .ics
            <input type="file" accept=".ics" onChange={handleImportFile} className="hidden" />
          </label>

          <button
            onClick={() => exportTasksToICal(tasks)}
            className="px-3 py-1.5 text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export .ics
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Calendar Navigation & View Selector Bar */}
      <div className="pastel-card p-5 space-y-4">
        
        {/* Month & View Mode Switcher Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
              {format(selectedDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-2 py-0.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 rounded-lg"
              >
                Today
              </button>
              <button
                onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'week' 
                  ? 'bg-gradient-to-r from-orange-400 to-rose-400 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> Week Strip
            </button>

            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'month' 
                  ? 'bg-gradient-to-r from-orange-400 to-rose-400 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Month Grid
            </button>

            <button
              onClick={() => setViewMode('day_schedule')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'day_schedule' 
                  ? 'bg-gradient-to-r from-orange-400 to-rose-400 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Hourly Schedule
            </button>
          </div>

        </div>

        {/* View 1: WEEK STRIP */}
        {viewMode === 'week' && (
          <div className="grid grid-cols-7 gap-1 text-center pt-2">
            {weekDays.map((day, idx) => {
              const isSelected = isSameDay(day, selectedDate);
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayTasksList = tasks.filter(t => !t.archived && t.dueDate === dateStr);
              const hasTasks = dayTasksList.length > 0;
              const hasCompleted = dayTasksList.some(t => t.completed);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className="flex flex-col items-center gap-1.5 cursor-pointer py-1"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {format(day, 'EEE')}
                  </span>

                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs relative transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-r from-orange-400 to-rose-400 text-white shadow-orange-glow scale-110' 
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {format(day, 'd')}

                    {hasTasks && !isSelected && (
                      <span className={`absolute -top-0.5 right-0.5 w-2 h-2 rounded-full ${hasCompleted ? 'bg-emerald-500' : 'bg-orange-400'}`}></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View 2: MONTH GRID */}
        {viewMode === 'month' && (
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {monthDays.map((day, idx) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayTasksList = tasks.filter(t => !t.archived && t.dueDate === dayStr);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[70px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-orange-400 bg-orange-500/10 shadow-md'
                        : isToday 
                          ? 'bg-orange-500/15 border-orange-400/50' 
                          : isCurrentMonth 
                            ? 'bg-white dark:bg-slate-900/60 border-black/5 dark:border-white/5 hover:border-orange-300' 
                            : 'bg-slate-100/50 dark:bg-slate-950/20 border-transparent opacity-40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-bold ${isToday ? 'text-orange-500 bg-orange-500/20 px-1.5 py-0.5 rounded-full' : 'text-slate-700 dark:text-slate-300'}`}>
                        {format(day, 'd')}
                      </span>
                      {dayTasksList.length > 0 && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {dayTasksList.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mt-1 overflow-hidden">
                      {dayTasksList.slice(0, 2).map(t => (
                        <div
                          key={t.id}
                          className={`px-1 py-0.5 rounded text-[9px] truncate font-semibold ${
                            t.completed 
                              ? 'line-through bg-slate-100 dark:bg-slate-800 text-slate-400' 
                              : 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900/40'
                          }`}
                        >
                          {t.title}
                        </div>
                      ))}
                      {dayTasksList.length > 2 && (
                        <div className="text-[8px] font-bold text-slate-400 text-center">
                          +{dayTasksList.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* View 3: HOURLY SCHEDULE VIEW or SELECTED DATE TASKS */}
      {viewMode === 'day_schedule' ? (
        <div className="pastel-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Hourly Timeline for {format(selectedDate, 'MMM d, yyyy')}
              </h3>
              <p className="text-xs text-slate-400">Click any hour slot to schedule a task directly</p>
            </div>
            <button
              onClick={onOpenCreateTaskModal}
              className="px-3 py-1.5 text-xs font-bold bg-orange-500 text-white rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {hours.map(hour => {
              const hourStr = `${String(hour).padStart(2, '0')}:00`;
              const hourTasks = dayTasks.filter(t => t.dueTime && t.dueTime.startsWith(String(hour).padStart(2, '0')));

              return (
                <div key={hour} className="flex gap-4 group">
                  <div className="w-14 text-xs font-bold text-slate-400 shrink-0 py-2">
                    {format(new Date().setHours(hour, 0), 'ha')}
                  </div>

                  <div className="flex-1 min-h-[48px] p-2 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-black/10 dark:border-white/10 rounded-2xl group-hover:border-orange-400 transition-colors relative flex flex-col justify-center">
                    {hourTasks.length > 0 ? (
                      <div className="space-y-1.5">
                        {hourTasks.map(t => (
                          <div
                            key={t.id}
                            onClick={() => onEditTask(t)}
                            className="p-2.5 bg-white dark:bg-slate-900 border border-orange-400/30 rounded-xl flex items-center justify-between shadow-sm hover:scale-[1.01] transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <button
                                onClick={(e) => { e.stopPropagation(); onToggleComplete(t.id); }}
                                className={`soft-checkbox ${t.completed ? 'checked-orange' : 'border-slate-300'}`}
                              >
                                {t.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>

                              <div>
                                <h4 className={`text-xs font-bold ${t.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                  {t.title}
                                </h4>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                  <span>{t.category || 'General'}</span>
                                  <span>• {t.dueTime}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={(e) => handleOpenGCal(e, t)}
                              className="px-2.5 py-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-400/30 rounded-lg hover:bg-orange-500 hover:text-white transition-colors flex items-center gap-1"
                              title="Add to Google Calendar"
                            >
                              <ExternalLink className="w-3 h-3" /> GCal
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={onOpenCreateTaskModal}
                        className="text-[11px] font-semibold text-slate-400 hover:text-orange-500 text-left transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                      >
                        <Plus className="w-3.5 h-3.5" /> Schedule task at {format(new Date().setHours(hour, 0), 'ha')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Selected Date Tasks List */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Tasks for {format(selectedDate, 'MMM d, yyyy')}
              </h3>
              <p className="text-xs text-slate-400">
                {dayTasks.filter(t => t.completed).length} of {dayTasks.length} completed
              </p>
            </div>

            <button
              onClick={onOpenCreateTaskModal}
              className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>

          {/* Task Cards for Selected Day */}
          {dayTasks.length > 0 ? (
            <div className="space-y-3">
              {dayTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => onEditTask(t)}
                  className="pastel-card p-4 flex items-center justify-between cursor-pointer hover:shadow-pastel-hover transition-all"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleComplete(t.id); }}
                      className={`soft-checkbox ${t.completed ? 'checked-orange' : 'border-slate-300'}`}
                    >
                      {t.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div>
                      <h4 className={`text-xs font-bold ${t.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                        {t.title}
                      </h4>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{t.category || 'General'}</span>
                        {t.dueTime && <span>• {t.dueTime}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleOpenGCal(e, t)}
                      className="px-2.5 py-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-400/30 rounded-lg hover:bg-orange-500 hover:text-white transition-colors flex items-center gap-1"
                      title="Open in Google Calendar"
                    >
                      <ExternalLink className="w-3 h-3" /> GCal
                    </button>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {t.completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="pastel-card p-10 text-center space-y-2">
              <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300">No tasks scheduled for this day</div>
              <button
                onClick={onOpenCreateTaskModal}
                className="text-xs font-bold text-orange-500 hover:underline"
              >
                + Create task for {format(selectedDate, 'MMM d')}
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
