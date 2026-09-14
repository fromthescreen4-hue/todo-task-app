import React, { useState } from 'react';
import { 
  Inbox, 
  Sun, 
  CalendarDays, 
  AlertTriangle, 
  Share2, 
  Archive, 
  Kanban, 
  List, 
  Calendar as CalendarIcon, 
  BarChart3, 
  FolderPlus, 
  Tag, 
  Download,
  CheckSquare,
  Sparkles,
  Settings,
  Plus
} from 'lucide-react';
import { exportTasksToICal } from '../utils/icalGenerator';

export default function Sidebar({ 
  activeFilter, 
  setActiveFilter, 
  activeView, 
  setActiveView, 
  categories, 
  selectedCategory, 
  setSelectedCategory,
  tasks,
  onAddCategory,
  onOpenIntegrationsModal
}) {
  const [newCatName, setNewCatName] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);

  // Calculate task counts
  const todayStr = new Date().toISOString().slice(0, 10);
  const counts = {
    all: tasks.filter(t => !t.archived).length,
    today: tasks.filter(t => !t.archived && t.dueDate === todayStr).length,
    upcoming: tasks.filter(t => !t.archived && t.dueDate > todayStr).length,
    overdue: tasks.filter(t => !t.archived && !t.completed && t.dueDate && t.dueDate < todayStr).length,
    shared: tasks.filter(t => !t.archived && t.isShared).length,
    archived: tasks.filter(t => t.archived).length
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim());
    setNewCatName('');
    setShowAddCat(false);
  };

  return (
    <aside className="w-full lg:w-64 glass-panel border-r border-white/10 flex flex-col p-4 shrink-0 transition-colors">
      
      {/* View Switcher (List, Kanban, Calendar, Analytics) */}
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 px-2">
          View Mode
        </div>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveView('list')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'list' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>

          <button
            onClick={() => setActiveView('kanban')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'kanban' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" /> Kanban
          </button>

          <button
            onClick={() => setActiveView('calendar')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'calendar' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" /> Calendar
          </button>

          <button
            onClick={() => setActiveView('analytics')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'analytics' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Stats
          </button>
        </div>
      </div>

      {/* Smart Views Navigation */}
      <div className="mb-6 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
          Smart Filters
        </div>
        <nav className="space-y-1">
          <NavItem 
            icon={<Inbox className="w-4 h-4 text-indigo-400" />} 
            label="All Tasks" 
            count={counts.all}
            active={activeFilter === 'all' && !selectedCategory} 
            onClick={() => { setActiveFilter('all'); setSelectedCategory(null); }} 
          />
          <NavItem 
            icon={<Sun className="w-4 h-4 text-amber-400" />} 
            label="Today" 
            count={counts.today}
            active={activeFilter === 'today' && !selectedCategory} 
            onClick={() => { setActiveFilter('today'); setSelectedCategory(null); }} 
          />
          <NavItem 
            icon={<CalendarDays className="w-4 h-4 text-emerald-400" />} 
            label="Upcoming" 
            count={counts.upcoming}
            active={activeFilter === 'upcoming' && !selectedCategory} 
            onClick={() => { setActiveFilter('upcoming'); setSelectedCategory(null); }} 
          />
          <NavItem 
            icon={<AlertTriangle className="w-4 h-4 text-rose-400" />} 
            label="Overdue" 
            count={counts.overdue}
            badgeColor="bg-rose-500/20 text-rose-300"
            active={activeFilter === 'overdue' && !selectedCategory} 
            onClick={() => { setActiveFilter('overdue'); setSelectedCategory(null); }} 
          />
          <NavItem 
            icon={<Share2 className="w-4 h-4 text-sky-400" />} 
            label="Shared Events" 
            count={counts.shared}
            active={activeFilter === 'shared' && !selectedCategory} 
            onClick={() => { setActiveFilter('shared'); setSelectedCategory(null); }} 
          />
          <NavItem 
            icon={<Archive className="w-4 h-4 text-slate-400" />} 
            label="Archived" 
            count={counts.archived}
            active={activeFilter === 'archived' && !selectedCategory} 
            onClick={() => { setActiveFilter('archived'); setSelectedCategory(null); }} 
          />
        </nav>
      </div>

      {/* Project Categories */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Lists & Projects
          </span>
          <button 
            onClick={() => setShowAddCat(!showAddCat)}
            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {showAddCat && (
          <form onSubmit={handleCreateCategory} className="mb-2 px-2">
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="List name..."
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-slate-900 text-slate-100 rounded border border-white/10 focus:outline-none focus:border-indigo-500"
              />
              <button type="submit" className="px-2 py-1 text-xs bg-indigo-600 text-white rounded font-medium">
                Add
              </button>
            </div>
          </form>
        )}

        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {categories.map(cat => {
            const catTaskCount = tasks.filter(t => !t.archived && t.category === cat.name).length;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setActiveFilter('all');
                }}
                className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                  selectedCategory === cat.name 
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' 
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                  <span className="truncate">{cat.name}</span>
                </div>
                <span className="text-[10px] text-slate-400">{catTaskCount}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Tools: iCal Export & Webhooks */}
      <div className="pt-3 border-t border-white/10 space-y-1">
        <button
          onClick={() => exportTasksToICal(tasks)}
          className="w-full px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          Export iCal (.ics) Calendar
        </button>

        <button
          onClick={onOpenIntegrationsModal}
          className="w-full px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
        >
          <Settings className="w-4 h-4 text-indigo-400" />
          Webhooks & Integrations
        </button>
      </div>

    </aside>
  );
}

function NavItem({ icon, label, count, active, onClick, badgeColor = "bg-slate-800 text-slate-300" }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
        active 
          ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-white border border-indigo-500/40 shadow-sm' 
          : 'text-slate-300 hover:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {icon}
        <span>{label}</span>
      </div>
      {count > 0 && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
          {count}
        </span>
      )}
    </button>
  );
}
