import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Clock, 
  Calendar, 
  Check, 
  Plus, 
  Trash2,
  Tag,
  Paperclip,
  Bell,
  Zap
} from 'lucide-react';
import { parseNaturalLanguageTask } from '../utils/naturalLanguageParser';
import { googleCalendarService } from '../services/googleCalendarService';

export default function TaskModal({ 
  isOpen, 
  onClose, 
  onSaveTask, 
  editingTask, 
  categories
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
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
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
  }, [editingTask, isOpen]);

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

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: 'st_' + Date.now(), title: newSubtaskTitle.trim(), completed: false }
    ]);
    setNewSubtaskTitle('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

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
      completed: editingTask ? editingTask.completed : false,
      archived: editingTask ? editingTask.archived : false,
      status: editingTask ? editingTask.status : 'to_do',
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
      enableEmailReminder,
      emailNotification: enableEmailReminder
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-[#1a1926] border border-black/5 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h2>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 'Submit project presentation tomorrow at 4pm'"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl border border-black/5 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-orange-400 font-semibold"
            />

            {nlDetectedInfo && (
              <div className="mt-2 p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-between text-xs animate-fade-in">
                <span className="text-orange-600 dark:text-orange-400 font-medium">
                  Auto-parsed: <strong>"{nlDetectedInfo.cleanTitle}"</strong> on {nlDetectedInfo.dueDate} at {nlDetectedInfo.dueTime}
                </span>
                <button
                  type="button"
                  onClick={applyNlParsed}
                  className="px-2.5 py-1 bg-orange-500 text-white rounded-xl text-xs font-bold"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Description / Context
            </label>
            <textarea
              rows="2"
              placeholder="Add links, context, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl border border-black/5 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-orange-400"
            ></textarea>
          </div>

          {/* Row 2: Category, Priority, Recurrence */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl border border-black/5 dark:border-white/5 font-semibold"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl border border-black/5 dark:border-white/5 font-semibold"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Repeat
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl border border-black/5 dark:border-white/5 font-semibold"
              >
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Row 3: Due Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-orange-500" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl border border-black/5 dark:border-white/5 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-orange-500" /> Reminder Time
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl border border-black/5 dark:border-white/5 font-semibold"
              />
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Subtasks Checklist
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add subtask item..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl border border-black/5"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold"
              >
                Add
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-2xl border border-black/5">
                {subtasks.map(st => (
                  <div key={st.id} className="flex items-center justify-between text-xs py-1 px-2">
                    <span className="text-slate-700 dark:text-slate-200 font-medium">{st.title}</span>
                    <button
                      type="button"
                      onClick={() => setSubtasks(subtasks.filter(s => s.id !== st.id))}
                      className="text-rose-500 hover:opacity-80"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email Notification Toggle */}
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-500" />
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Email & Web Notification Alert</div>
                <div className="text-[10px] text-slate-400">Trigger email log and push alert when reminder is due</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={enableEmailReminder}
              onChange={(e) => setEnableEmailReminder(e.target.checked)}
              className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
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
            ) : <div></div>}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-orange-400 to-rose-400 text-white rounded-2xl shadow-orange-glow flex items-center gap-1.5"
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
