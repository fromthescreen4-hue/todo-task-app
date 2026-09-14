import React from 'react';
import { Plus, Check, Clock, Share2, MoreHorizontal } from 'lucide-react';

export default function KanbanBoard({ 
  tasks, 
  onUpdateTaskStatus, 
  onOpenCreateTaskModal, 
  onEditTask,
  onShareTask 
}) {
  const columns = [
    { id: 'to_do', title: 'To Do', badge: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
    { id: 'in_progress', title: 'In Progress', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    { id: 'in_review', title: 'In Review', badge: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
    { id: 'completed', title: 'Completed', badge: 'bg-teal-500/10 text-teal-600 border-teal-500/20' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-28 animate-fade-in max-w-7xl mx-auto px-4 sm:px-8">
      {columns.map(col => {
        const colTasks = tasks.filter(t => !t.archived && (t.status === col.id || (!t.status && col.id === (t.completed ? 'completed' : 'to_do'))));

        return (
          <div key={col.id} className="pastel-card p-4 flex flex-col min-h-[500px]">
            
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${col.badge}`}>
                  {col.title}
                </span>
                <span className="text-xs font-bold text-slate-400">{colTasks.length}</span>
              </div>
              <button
                onClick={onOpenCreateTaskModal}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {colTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => onEditTask(task)}
                  className="p-3.5 rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer space-y-2 group transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`text-xs font-bold ${task.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                      {task.title}
                    </h4>
                    <button
                      onClick={(e) => { e.stopPropagation(); onShareTask(task); }}
                      className="p-1 text-slate-400 hover:text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {task.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-[10px] text-slate-400">
                    <span className="capitalize px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700 font-semibold">
                      {task.category || 'Work'}
                    </span>

                    {/* Move Column Selector */}
                    <select
                      value={task.status || (task.completed ? 'completed' : 'to_do')}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdateTaskStatus(task.id, e.target.value)}
                      className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-0.5 border border-black/10 dark:border-white/10 text-[10px] focus:outline-none font-semibold"
                    >
                      <option value="to_do">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                </div>
              ))}
            </div>

          </div>
        );
      })}
    </div>
  );
}
