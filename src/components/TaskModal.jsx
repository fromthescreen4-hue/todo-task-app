import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Clock, 
  Calendar, 
  Check, 
  Plus, 
  Trash2,
  Edit3,
  Tag,
  Bell,
  Zap,
  Share2,
  ListChecks
} from 'lucide-react';
import { parseNaturalLanguageTask } from '../utils/naturalLanguageParser';
import { googleCalendarService } from '../services/googleCalendarService';

export default function TaskModal({ 
  isOpen, 
  onClose, 
  onSaveTask, 
  editingTask, 
  categories,
  onOpenShare
}) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Work');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('09:00');
  const [recurrence, setRecurrence] = useState('none');
  const [subtasks, setSubtasks] = useState([]);

  // Subtask Add UX state
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const addSubtaskInputRef = useRef(null);

  // Subtask Edit Inline state
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');
  const editSubtaskInputRef = useRef(null);

  const [enableEmailReminder, setEnableEmailReminder] = useState(false);
  const [nlDetectedInfo, setNlDetectedInfo] = useState(null);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || '');
      setDescription(editingTask.description || '');
      setCategory(editingTask.category || 'Work');
      setPriority(editingTask.priority || 'medium');
      setDueDate(editingTask.dueDate || new Date().toISOString().slice(0, 10));
      setDueTime(editingTask.dueTime || '09:00');
      setRecurrence(editingTask.recurrence || 'none');
      setSubtasks(editingTask.subtasks || []);
      setEnableEmailReminder(editingTask.enableEmailReminder ?? editingTask.emailNotification ?? false);
    } else {
      setTitle('');
      setDescription('');
      setCategory(categories[0]?.name || 'Work');
      setPriority('medium');
      setDueDate(new Date().toISOString().slice(0, 10));
      setDueTime('09:00');
      setRecurrence('none');
      setSubtasks([]);
      setEnableEmailReminder(false);
    }
    setIsAddingSubtask(false);
    setNewSubtaskTitle('');
    setEditingSubtaskId(null);
  }, [editingTask, isOpen]);

  // Focus add input when inline add mode opens
  useEffect(() => {
    if (isAddingSubtask && addSubtaskInputRef.current) {
      addSubtaskInputRef.current.focus();
    }
  }, [isAddingSubtask]);

  // Focus edit input when editing subtask
  useEffect(() => {
    if (editingSubtaskId && editSubtaskInputRef.current) {
      editSubtaskInputRef.current.focus();
    }
  }, [editingSubtaskId]);

  const handleTitleChange = (val) => {
    setTitle(val);
    if (!editingTask && val.length > 5) {
      const parsed = parseNaturalLanguageTask(val);
      if (parsed.detected) {
        setNlDetectedInfo(parsed);
      } else {
        setNlDetectedInfo(null);
      }
    } else {
      setNlDetectedInfo(null);
    }
  };

  const applyNlParsed = () => {
    if (nlDetectedInfo) {
      setTitle(nlDetectedInfo.cleanTitle);
      if (nlDetectedInfo.dueDate) setDueDate(nlDetectedInfo.dueDate);
      if (nlDetectedInfo.dueTime) setDueTime(nlDetectedInfo.dueTime);
      setNlDetectedInfo(null);
    }
  };

  // Subtask Handlers
  const handleConfirmAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    const newSt = { id: 'st_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), title: trimmed, completed: false };
    setSubtasks(prev => [...prev, newSt]);
    setNewSubtaskTitle('');
    // Keep focus so user can add multiple subtasks consecutively!
    if (addSubtaskInputRef.current) {
      addSubtaskInputRef.current.focus();
    }
  };

  const handleAddSubtaskKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmAddSubtask();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsAddingSubtask(false);
      setNewSubtaskTitle('');
    }
  };

  const handleToggleSubtaskInModal = (stId) => {
    setSubtasks(prev => prev.map(s => s.id === stId ? { ...s, completed: !s.completed } : s));
  };

  const handleStartEditSubtask = (st) => {
    setEditingSubtaskId(st.id);
    setEditingSubtaskTitle(st.title);
  };

  const handleSaveEditSubtask = (stId) => {
    const trimmed = editingSubtaskTitle.trim();
    if (trimmed) {
      setSubtasks(prev => prev.map(s => s.id === stId ? { ...s, title: trimmed } : s));
    }
    setEditingSubtaskId(null);
    setEditingSubtaskTitle('');
  };

  const handleEditSubtaskKeyDown = (e, stId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEditSubtask(stId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingSubtaskId(null);
      setEditingSubtaskTitle('');
    }
  };

  const handleDeleteSubtaskInModal = (stId) => {
    setSubtasks(prev => prev.filter(s => s.id !== stId));
  };

  // Progress Calculation
  const completedSubtasksCount = subtasks.filter(s => s.completed).length;
  const subtasksProgressPercent = subtasks.length > 0 ? Math.round((completedSubtasksCount / subtasks.length) * 100) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Consistency Rule: If all subtasks are complete, task is marked complete
    const allSubtasksDone = subtasks.length > 0 && subtasks.every(s => s.completed);
    const isCompleted = editingTask 
      ? (allSubtasksDone ? true : editingTask.completed)
      : allSubtasksDone;

    onSaveTask({
      id: editingTask ? editingTask.id : 'task_' + Date.now(),
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      dueDate,
      dueTime,
      recurrence,
      subtasks,
      completed: isCompleted,
      archived: editingTask ? editingTask.archived : false,
      status: isCompleted ? 'completed' : (editingTask ? editingTask.status : 'to_do'),
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
      enableEmailReminder,
      emailNotification: enableEmailReminder
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-[#1a1926] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h2>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body with Clear Information Hierarchy */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          
          {/* SECTION 1: TASK DETAILS */}
          <div className="space-y-3">
            <div className="text-[11px] font-extrabold text-orange-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>Task Details</span>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Task title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={150}
                placeholder="e.g. 'Submit project presentation tomorrow at 4pm'"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-orange-400 font-semibold"
              />

              {nlDetectedInfo && (
                <div className="mt-2 p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-between text-xs animate-fade-in">
                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                    Auto-parsed: <strong>"{nlDetectedInfo.cleanTitle}"</strong> on {nlDetectedInfo.dueDate} at {nlDetectedInfo.dueTime}
                  </span>
                  <button
                    type="button"
                    onClick={applyNlParsed}
                    className="px-2.5 py-1 bg-orange-500 text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-90"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Description / context
              </label>
              <textarea
                rows="2"
                maxLength={500}
                placeholder="Add links, context, or notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-orange-400"
              ></textarea>
            </div>

            {/* Category, Priority, Repeat Row */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-700/80 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-700/80 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Repeat
                </label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-700/80 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            {/* Due Date & Reminder Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-orange-500" /> Due date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-700/80 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-500" /> Reminder
                </label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-700/80 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-white/5 pt-2" />

          {/* SECTION 2: SUBTASKS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-orange-500 uppercase tracking-wider">
                <ListChecks className="w-3.5 h-3.5" />
                <span>Subtasks</span>
              </div>
              
              {subtasks.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Progress: <strong className="text-slate-700 dark:text-slate-200">{completedSubtasksCount} / {subtasks.length} completed</strong>
                  </span>
                  <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded-full text-[10px] font-bold">
                    {subtasksProgressPercent}%
                  </span>
                </div>
              )}
            </div>

            {/* Subtask Progress Bar */}
            {subtasks.length > 0 && (
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 via-rose-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${subtasksProgressPercent}%` }}
                />
              </div>
            )}

            {/* Subtask List */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/50">
                {subtasks.map(st => (
                  <div key={st.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group">
                    
                    {/* Inline Edit Input or Title */}
                    {editingSubtaskId === st.id ? (
                      <div className="flex-1 flex items-center gap-2 mr-2">
                        <input
                          ref={editSubtaskInputRef}
                          type="text"
                          maxLength={100}
                          value={editingSubtaskTitle}
                          onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => handleEditSubtaskKeyDown(e, st.id)}
                          className="flex-1 px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-orange-400 rounded-lg text-slate-800 dark:text-slate-100 font-medium focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditSubtask(st.id)}
                          className="p-1 bg-orange-500 text-white rounded-md text-[10px] font-bold hover:bg-orange-600"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => handleToggleSubtaskInModal(st.id)}
                        className="flex-1 flex items-center gap-2.5 cursor-pointer min-w-0"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          st.completed 
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-500 text-white' 
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}>
                          {st.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={`font-medium transition-all truncate ${
                          st.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'
                        }`}>
                          {st.title}
                        </span>
                      </div>
                    )}

                    {/* Inline Edit & Delete Controls */}
                    {editingSubtaskId !== st.id && (
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleStartEditSubtask(st)}
                          title="Edit Subtask"
                          className="p-1 text-slate-400 hover:text-orange-500 hover:bg-slate-200 dark:hover:bg-slate-700/60 rounded-md"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubtaskInModal(st.id)}
                          title="Delete Subtask"
                          className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700/60 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}

            {/* Subtask Add UX */}
            {isAddingSubtask ? (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-orange-400/60 flex items-center gap-2 animate-fade-in">
                <div className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600 shrink-0" />
                <input
                  ref={addSubtaskInputRef}
                  type="text"
                  maxLength={100}
                  placeholder="Enter subtask title..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={handleAddSubtaskKeyDown}
                  className="flex-1 text-xs bg-transparent text-slate-800 dark:text-slate-100 font-medium focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleConfirmAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  className="px-3 py-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSubtask(false);
                    setNewSubtaskTitle('');
                  }}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingSubtask(true)}
                className="px-3 py-2 text-xs font-bold text-orange-500 hover:text-orange-600 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 rounded-2xl transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add subtask
              </button>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-white/5 pt-2" />

          {/* SECTION 3: NOTIFICATIONS */}
          <div className="space-y-2">
            <div className="text-[11px] font-extrabold text-orange-500 uppercase tracking-wider">
              Notifications
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-orange-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Email & Web Notification</div>
                  <div className="text-[10px] text-slate-400">Trigger email alert when reminder is due</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableEmailReminder}
                onChange={(e) => setEnableEmailReminder(e.target.checked)}
                className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* SECTION 4: SHARING */}
          {editingTask && (
            <div className="space-y-2">
              <div className="text-[11px] font-extrabold text-orange-500 uppercase tracking-wider">
                Sharing
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onOpenShare) {
                    onOpenShare(editingTask);
                  }
                }}
                className="w-full py-2.5 px-4 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-600 dark:text-sky-300 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" /> Share Task Status Link
              </button>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            {editingTask ? (
              <button
                type="button"
                onClick={() => googleCalendarService.openInGoogleCalendar({
                  ...editingTask,
                  title: title || editingTask.title,
                  description: description || editingTask.description,
                  category,
                  dueDate,
                  dueTime
                })}
                className="px-3 py-2 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-400/30 rounded-2xl hover:bg-orange-500 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Sync to Google Calendar
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 hover:opacity-95 text-white rounded-2xl shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" /> Save Task
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
