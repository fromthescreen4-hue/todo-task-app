import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Kanban, 
  Calendar, 
  BarChart3, 
  Mail, 
  Download, 
  Palette, 
  User, 
  Command, 
  ArrowRight 
} from 'lucide-react';

export default function CommandPaletteModal({ 
  isOpen, 
  onClose, 
  tasks, 
  onOpenCreateTaskModal,
  setActiveView,
  setActiveFilter,
  onOpenAuthModal,
  onOpenEmailSimulator
}) {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');

  const commands = [
    { id: 'c_add', title: 'Create New Task', icon: <Plus className="w-4 h-4 text-indigo-400" />, action: () => { onOpenCreateTaskModal(); onClose(); } },
    { id: 'c_list', title: 'Switch to List View', icon: <Kanban className="w-4 h-4 text-slate-400" />, action: () => { setActiveView('list'); onClose(); } },
    { id: 'c_kanban', title: 'Switch to Kanban Board', icon: <Kanban className="w-4 h-4 text-amber-400" />, action: () => { setActiveView('kanban'); onClose(); } },
    { id: 'c_cal', title: 'Switch to Calendar View', icon: <Calendar className="w-4 h-4 text-emerald-400" />, action: () => { setActiveView('calendar'); onClose(); } },
    { id: 'c_stats', title: 'View Productivity Analytics', icon: <BarChart3 className="w-4 h-4 text-purple-400" />, action: () => { setActiveView('analytics'); onClose(); } },
    { id: 'c_email', title: 'Open Outbound Email Inbox', icon: <Mail className="w-4 h-4 text-sky-400" />, action: () => { onOpenEmailSimulator(); onClose(); } },
    { id: 'c_account', title: 'Open Account & Cloud Sync Settings', icon: <User className="w-4 h-4 text-indigo-400" />, action: () => { onOpenAuthModal(); onClose(); } }
  ];

  const matchingTasks = tasks.filter(t => !t.archived && t.title.toLowerCase().includes(query.toLowerCase()));
  const matchingCommands = commands.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Search Bar */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-indigo-400" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-white/10">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-3 max-h-96 overflow-y-auto space-y-3">
          
          {/* Quick Actions */}
          {matchingCommands.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Actions & Commands
              </div>
              <div className="space-y-1 mt-1">
                {matchingCommands.map(cmd => (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className="w-full px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-indigo-600/20 hover:text-white flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      {cmd.icon}
                      <span className="font-semibold">{cmd.title}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Results */}
          {matchingTasks.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Matching Tasks
              </div>
              <div className="space-y-1 mt-1">
                {matchingTasks.slice(0, 5).map(t => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-xs text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold">{t.title}</span>
                      {t.category && <span className="ml-2 text-[10px] text-indigo-400">[{t.category}]</span>}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{t.dueDate || 'No date'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
