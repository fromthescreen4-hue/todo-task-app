import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Check, 
  Clock, 
  Calendar, 
  Share2, 
  Edit3, 
  Trash2, 
  Archive, 
  Plus, 
  Tag, 
  Repeat, 
  Sparkles,
  Inbox,
  Sun,
  CalendarDays,
  AlertTriangle,
  Layers,
  CalendarPlus
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { addToGoogleCalendar } from '../utils/googleCalendar';

export default function TaskScreen({ 
  tasks, 
  categories,
  onToggleComplete, 
  onToggleSubtask, 
  onEditTask, 
  onDeleteTask, 
  onArchiveTask, 
  onShareTask,
  onOpenCreateTaskModal,
  selectedCategory,
  setSelectedCategory,
  activeFilter,
  setActiveFilter
}) {
  const [showSubtasksMap, setShowSubtasksMap] = useState({});

  const handleCheck = (taskId, e) => {
    e.stopPropagation();
    onToggleComplete(taskId);
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
    notificationService.playAudioChime('success');
  };

  // Filter Tasks
  const todayStr = new Date().toISOString().slice(0, 10);

  let filteredTasks = tasks.filter(t => {
    if (selectedCategory && t.category !== selectedCategory) return false;
    if (activeFilter === 'today') return !t.archived && t.dueDate === todayStr;
    if (activeFilter === 'upcoming') return !t.archived && t.dueDate > todayStr;
    if (activeFilter === 'overdue') return !t.archived && !t.completed && t.dueDate && t.dueDate < todayStr;
    if (activeFilter === 'shared') return !t.archived && t.isShared;
    if (activeFilter === 'archived') return t.archived;
    return !t.archived; // 'all'
  });

  // Group by Time of Day
  const morningTasks = filteredTasks.filter(t => t.dueTime < '12:00');
  const afternoonTasks = filteredTasks.filter(t => t.dueTime >= '12:00' && t.dueTime < '18:00');
  const eveningTasks = filteredTasks.filter(t => t.dueTime >= '18:00' || !t.dueTime);

  return (
    <div className="space-y-6 pb-28 animate-fade-in max-w-4xl mx-auto px-4 sm:px-8">
      
      {/* Category List Pills Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            selectedCategory === null 
              ? 'bg-slate-800 text-white shadow-md' 
              : 'pastel-card text-slate-500 hover:text-slate-800'
          }`}
        >
          All Lists ({tasks.filter(t => !t.archived).length})
        </button>

        {categories.map(cat => {
          const count = tasks.filter(t => !t.archived && t.category === cat.name).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                selectedCategory === cat.name 
                  ? 'bg-orange-500 text-white shadow-orange-glow' 
                  : 'pastel-card text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Smart View Filter Pills */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl overflow-x-auto">
        {[
          { id: 'all', label: 'All Tasks', icon: <Inbox className="w-3.5 h-3.5" /> },
          { id: 'today', label: 'Today', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
          { id: 'upcoming', label: 'Upcoming', icon: <CalendarDays className="w-3.5 h-3.5 text-emerald-500" /> },
          { id: 'overdue', label: 'Overdue', icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> },
          { id: 'shared', label: 'Shared', icon: <Share2 className="w-3.5 h-3.5 text-sky-500" /> },
          { id: 'archived', label: 'Archived', icon: <Archive className="w-3.5 h-3.5 text-slate-400" /> }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeFilter === filter.id 
                ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {filter.icon}
            <span>{filter.label}</span>
          </button>
        ))}
      </div>

      {/* Grouped Time-of-Day Cards */}
      <div className="space-y-4">
        
        {/* Morning Section */}
        {morningTasks.length > 0 && (
          <div className="gradient-teal-card p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold opacity-95 border-b border-white/20 pb-2">
              <span className="text-base font-extrabold tracking-tight">🌅 Morning Tasks</span>
              <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{morningTasks.length}</span>
            </div>

            <div className="space-y-2">
              {morningTasks.map(t => (
                <TaskRowItem
                  key={t.id}
                  task={t}
                  isGradientCard={true}
                  onCheck={handleCheck}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onArchive={onArchiveTask}
                  onShare={onShareTask}
                />
              ))}
            </div>
          </div>
        )}

        {/* Afternoon Section */}
        {afternoonTasks.length > 0 && (
          <div className="pastel-card p-5 space-y-3">
            <div className="flex items-center justify-between text-slate-800 dark:text-slate-100 border-b border-black/5 dark:border-white/5 pb-2">
              <span className="text-base font-extrabold tracking-tight">☀️ Afternoon Tasks</span>
              <span className="text-xs font-bold text-slate-400">{afternoonTasks.length}</span>
            </div>

            <div className="space-y-2">
              {afternoonTasks.map(t => (
                <TaskRowItem
                  key={t.id}
                  task={t}
                  isGradientCard={false}
                  onCheck={handleCheck}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onArchive={onArchiveTask}
                  onShare={onShareTask}
                />
              ))}
            </div>
          </div>
        )}

        {/* Evening Section */}
        {eveningTasks.length > 0 && (
          <div className="gradient-indigo-card p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold opacity-95 border-b border-white/20 pb-2">
              <span className="text-base font-extrabold tracking-tight">🌙 Evening Tasks</span>
              <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{eveningTasks.length}</span>
            </div>

            <div className="space-y-2">
              {eveningTasks.map(t => (
                <TaskRowItem
                  key={t.id}
                  task={t}
                  isGradientCard={true}
                  onCheck={handleCheck}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onArchive={onArchiveTask}
                  onShare={onShareTask}
                />
              ))}
            </div>
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="pastel-card p-12 text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">No tasks found</div>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              You're all caught up! Click below to create a new task.
            </p>
            <button
              onClick={onOpenCreateTaskModal}
              className="px-4 py-2 text-xs font-bold rounded-2xl bg-orange-500 hover:bg-orange-600 text-white shadow-orange-glow inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create New Task
            </button>
          </div>
        )}

      </div>

    </div>
  );
}

function TaskRowItem({ task, isGradientCard, onCheck, onEdit, onDelete, onArchive, onShare }) {
  return (
    <div
      onClick={() => onEdit(task)}
      className={`p-3 rounded-2xl transition-all cursor-pointer flex items-start justify-between gap-3 ${
        isGradientCard
          ? 'bg-white/10 hover:bg-white/20 text-white'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-100 border border-black/5 dark:border-white/5'
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <button
          onClick={(e) => onCheck(task.id, e)}
          className={`soft-checkbox mt-0.5 shrink-0 ${
            task.completed 
              ? (isGradientCard ? 'checked-white text-indigo-600' : 'checked-orange') 
              : (isGradientCard ? 'border-white/50' : 'border-slate-300 dark:border-slate-600')
          }`}
        >
          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        <div className="min-w-0">
          <div className={`text-xs font-bold ${task.completed ? 'line-through opacity-60' : ''}`}>
            {task.title}
          </div>

          {task.description && (
            <p className={`text-[11px] line-clamp-1 mt-0.5 ${isGradientCard ? 'opacity-80' : 'text-slate-400'}`}>
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px]">
            {task.priority && (
              <span className={`px-2 py-0.5 rounded-full font-bold border ${
                isGradientCard ? 'bg-white/20 text-white border-white/30' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
              }`}>
                {task.priority}
              </span>
            )}

            {task.category && (
              <span className={`px-2 py-0.5 rounded-full font-semibold ${
                isGradientCard ? 'bg-white/15 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {task.category}
              </span>
            )}

            {task.dueDate && (
              <span className={`flex items-center gap-1 font-semibold ${isGradientCard ? 'opacity-90' : 'text-slate-400'}`}>
                <Clock className="w-3 h-3" /> {task.dueDate} {task.dueTime}
              </span>
            )}

            {task.isShared && (
              <span className={`px-1.5 py-0.5 rounded font-bold ${isGradientCard ? 'bg-white/20' : 'bg-sky-500/10 text-sky-500'}`}>
                🔗 Shared Link
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Task Action Bar */}
      <div className="flex items-center gap-1 opacity-80 hover:opacity-100 shrink-0">
        
        {/* Google Calendar Sync Button */}
        <button
          onClick={(e) => { e.stopPropagation(); addToGoogleCalendar(task); }}
          title="Add to Google Calendar"
          className="p-1 hover:bg-white/20 rounded-lg text-amber-300 hover:text-amber-200"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onShare(task); }}
          title="Share Event Link"
          className="p-1 hover:bg-white/20 rounded-lg"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onArchive(task.id); }}
          title="Archive Task"
          className="p-1 hover:bg-white/20 rounded-lg"
        >
          <Archive className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          title="Delete Task"
          className="p-1 hover:bg-white/20 rounded-lg"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
