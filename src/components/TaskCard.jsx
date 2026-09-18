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
  ChevronDown, 
  ChevronUp, 
  Paperclip, 
  Tag, 
  Repeat,
  AlertCircle,
  MessageSquare,
  ListChecks
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { googleCalendarService } from '../services/googleCalendarService';

export default function TaskCard({ 
  task, 
  onToggleComplete, 
  onToggleSubtask, 
  onEdit, 
  onDelete, 
  onArchive, 
  onShare 
}) {
  const [isExpandedSubtasks, setIsExpandedSubtasks] = useState(false);

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    const willBeCompleted = !task.completed;
    onToggleComplete(task.id);

    if (willBeCompleted) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      notificationService.playAudioChime('success');
    }
  };

  // Priority color configs
  const priorityConfig = {
    high: { label: 'High', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    medium: { label: 'Medium', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    low: { label: 'Low', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
  };

  // Due date status formatting
  const getDueStatus = () => {
    if (!task.dueDate) return null;
    const today = new Date().toISOString().slice(0, 10);
    if (task.completed) return { text: task.dueDate, color: 'text-slate-400' };
    if (task.dueDate < today) return { text: `Overdue: ${task.dueDate}`, color: 'text-rose-400 font-bold' };
    if (task.dueDate === today) return { text: `Due Today ${task.dueTime || ''}`, color: 'text-amber-400 font-semibold' };
    return { text: `${task.dueDate} ${task.dueTime || ''}`, color: 'text-slate-300' };
  };

  const dueStatus = getDueStatus();
  const subtasks = task.subtasks || [];
  const completedSubtasksCount = subtasks.filter(st => st.completed).length;
  const subtasksProgress = subtasks.length > 0 ? Math.round((completedSubtasksCount / subtasks.length) * 100) : 0;

  // By default, preview first 2 subtasks unless expanded
  const visibleSubtasks = isExpandedSubtasks ? subtasks : subtasks.slice(0, 2);
  const remainingSubtasksCount = subtasks.length - 2;

  return (
    <div className={`glass-panel glass-panel-hover rounded-2xl p-4 transition-all duration-200 ${
      task.completed ? 'opacity-65 border-white/5 bg-slate-900/40' : 'border-white/10'
    }`}>
      
      <div className="flex items-start gap-3">
        
        {/* Custom Main Task Checkbox */}
        <button
          onClick={handleCheckboxClick}
          className={`mt-1 w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
            task.completed 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400 text-white shadow-md shadow-emerald-500/30' 
              : 'border-white/30 hover:border-orange-400 bg-slate-800/60'
          }`}
        >
          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Task Title & Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-sm font-semibold tracking-tight transition-all ${
              task.completed ? 'line-through text-slate-400' : 'text-slate-100'
            }`}>
              {task.title}
            </h3>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  googleCalendarService.openInGoogleCalendar(task);
                }}
                title="Add to Google Calendar"
                className="p-1 hover:bg-orange-500/10 rounded-lg text-slate-400 hover:text-orange-400 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </button>

              <button
                onClick={() => onShare(task)}
                title="Share Task Status Link"
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-sky-400 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onEdit(task)}
                title="Edit Task"
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onArchive(task.id)}
                title={task.archived ? "Unarchive" : "Archive"}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onDelete(task.id)}
                title="Delete Task"
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Badges & Metadata */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
            
            {/* Priority Badge */}
            {task.priority && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityConfig[task.priority]?.color}`}>
                {priorityConfig[task.priority]?.label}
              </span>
            )}

            {/* Category Pill */}
            {task.category && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {task.category}
              </span>
            )}

            {/* Due Date Indicator */}
            {dueStatus && (
              <div className={`flex items-center gap-1 text-[11px] ${dueStatus.color}`}>
                <Clock className="w-3 h-3" />
                <span>{dueStatus.text}</span>
              </div>
            )}

            {/* Recurrence Indicator */}
            {task.recurrence && task.recurrence !== 'none' && (
              <div className="flex items-center gap-1 text-[10px] text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                <Repeat className="w-3 h-3" />
                <span className="capitalize">{task.recurrence}</span>
              </div>
            )}
          </div>

          {/* SUBTASKS HOMEPAGE AREA */}
          {subtasks.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-white/5 space-y-2">
              
              {/* Header: Subtasks Progress Bar & Count */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <ListChecks className="w-3.5 h-3.5 text-orange-400" />
                  <span>Subtasks</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400 font-medium">{completedSubtasksCount} / {subtasks.length}</span>
                  <span className="font-extrabold text-orange-400">{subtasksProgress}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 via-rose-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${subtasksProgress}%` }}
                />
              </div>

              {/* Homepage Quick-Check Subtask Items Preview */}
              <div className="space-y-1 pt-1">
                {visibleSubtasks.map(st => (
                  <div 
                    key={st.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSubtask(task.id, st.id);
                    }}
                    className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer group py-1 px-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                      st.completed 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400 text-white' 
                        : 'border-white/30 group-hover:border-orange-400 bg-slate-800'
                    }`}>
                      {st.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className={`transition-all truncate text-[11px] ${
                      st.completed ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}>
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Expand / Collapse Toggle if subtasks > 2 */}
              {subtasks.length > 2 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpandedSubtasks(!isExpandedSubtasks);
                  }}
                  className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 pt-0.5 hover:underline"
                >
                  {isExpandedSubtasks ? (
                    <>
                      <span>Show less</span>
                      <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      <span>+ {remainingSubtasksCount} more</span>
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
