import React, { useState } from 'react';
import TaskCard from './TaskCard';
import { 
  Filter, 
  ArrowUpDown, 
  CheckCircle2, 
  Trash2, 
  Archive, 
  Sparkles, 
  Plus,
  Layers
} from 'lucide-react';

export default function TaskList({ 
  tasks, 
  onToggleComplete, 
  onToggleSubtask, 
  onEditTask, 
  onDeleteTask, 
  onArchiveTask, 
  onShareTask,
  onOpenCreateTaskModal,
  activeFilterTitle
}) {
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, completed
  const [priorityFilter, setPriorityFilter] = useState('all'); // all, high, medium, low
  const [sortBy, setSortBy] = useState('dueDate'); // dueDate, priority, title, createdAt
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);

  // Filter tasks
  let filteredTasks = tasks.filter(t => {
    if (statusFilter === 'active' && t.completed) return false;
    if (statusFilter === 'completed' && !t.completed) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  // Sort tasks
  filteredTasks.sort((a, b) => {
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (sortBy === 'priority') {
      const pMap = { high: 1, medium: 2, low: 3 };
      return (pMap[a.priority] || 4) - (pMap[b.priority] || 4);
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'createdAt') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    return 0;
  });

  // Bulk actions
  const handleBulkComplete = () => {
    selectedTaskIds.forEach(id => onToggleComplete(id));
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedTaskIds.length} selected tasks?`)) {
      selectedTaskIds.forEach(id => onDeleteTask(id));
      setSelectedTaskIds([]);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header & Controls Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        <div>
          <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
            <span>{activeFilterTitle || 'All Tasks'}</span>
            <span className="px-2 py-0.5 text-xs font-bold bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-full">
              {filteredTasks.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400">Manage, organize and share your execution list</p>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          
          {/* Status Tabs */}
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-white/10 text-xs">
            {['all', 'active', 'completed'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                  statusFilter === st 
                    ? 'bg-indigo-600 text-white font-semibold shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-900/80 text-slate-200 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-900/80 text-slate-200 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="title">Sort Alphabetically</option>
            <option value="createdAt">Sort by Creation</option>
          </select>

        </div>
      </div>

      {/* Task Cards Container */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onToggleSubtask={onToggleSubtask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onArchive={onArchiveTask}
              onShare={onShareTask}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200">No tasks found</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              You're all caught up! Click below to create a new task or adjust your active filters.
            </p>
          </div>
          <button
            onClick={onOpenCreateTaskModal}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 flex items-center gap-2 hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Create New Task
          </button>
        </div>
      )}

    </div>
  );
}
