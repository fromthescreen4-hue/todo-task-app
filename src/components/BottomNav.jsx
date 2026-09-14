import React from 'react';
import { 
  CheckSquare, 
  Kanban, 
  Calendar, 
  Plus, 
  BarChart3, 
  User,
  Sparkles
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, onOpenCreateTaskModal }) {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md">
      <div className="floating-bottom-nav px-6 py-3 flex items-center justify-between shadow-2xl">
        
        {/* Tasks List Tab */}
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'tasks' 
              ? 'text-orange-500 font-bold scale-110' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px]">Tasks</span>
        </button>

        {/* Kanban Board Tab */}
        <button
          onClick={() => setActiveTab('kanban')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'kanban' 
              ? 'text-orange-500 font-bold scale-110' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Kanban className="w-5 h-5" />
          <span className="text-[10px]">Kanban</span>
        </button>

        {/* Central Floating Orange Add Button */}
        <button
          onClick={onOpenCreateTaskModal}
          className="fab-orange-btn w-12 h-12 rounded-full text-white flex items-center justify-center -mt-6 shadow-xl"
          title="Create New Task or Event"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Calendar Tab */}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'calendar' 
              ? 'text-orange-500 font-bold scale-110' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Calendar</span>
        </button>

        {/* Analytics Tab */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'analytics' 
              ? 'text-orange-500 font-bold scale-110' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px]">Analytics</span>
        </button>

      </div>
    </div>
  );
}
