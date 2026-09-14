import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Mic, 
  MicOff, 
  Clock, 
  Calendar, 
  Check, 
  Plus, 
  Trash2,
  Smile,
  BookOpen,
  Coffee,
  Activity,
  Heart,
  Music,
  Zap
} from 'lucide-react';
import { parseNaturalLanguageTask } from '../utils/naturalLanguageParser';

export default function AddHabitModal({ 
  isOpen, 
  onClose, 
  onSaveHabit, 
  editingHabit, 
  categories,
  isListeningVoice,
  toggleVoiceInput,
  voiceText
}) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [period, setPeriod] = useState('morning'); // morning, afternoon, evening
  const [category, setCategory] = useState('Personal');
  const [colorScheme, setColorScheme] = useState('teal'); // teal, indigo, coral, peach, purple
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('08:00');
  const [recurrence, setRecurrence] = useState('daily');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [nlDetectedInfo, setNlDetectedInfo] = useState(null);

  useEffect(() => {
    if (editingHabit) {
      setTitle(editingHabit.title || '');
      setDescription(editingHabit.description || '');
      setPeriod(editingHabit.period || 'morning');
      setCategory(editingHabit.category || 'Personal');
      setColorScheme(editingHabit.colorScheme || 'teal');
      setDueDate(editingHabit.dueDate || new Date().toISOString().slice(0, 10));
      setDueTime(editingHabit.dueTime || '08:00');
      setRecurrence(editingHabit.recurrence || 'daily');
      setSubtasks(editingHabit.subtasks || []);
    } else {
      setTitle('');
      setDescription('');
      setPeriod('morning');
      setCategory('Personal');
      setColorScheme('teal');
      setDueDate(new Date().toISOString().slice(0, 10));
      setDueTime('08:00');
      setRecurrence('daily');
      setSubtasks([]);
    }
  }, [editingHabit, isOpen]);

  useEffect(() => {
    if (voiceText && isOpen) {
      setTitle(voiceText);
      handleTitleChange(voiceText);
    }
  }, [voiceText]);

  const handleTitleChange = (val) => {
    setTitle(val);
    if (!editingHabit && val.length > 5) {
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

    onSaveHabit({
      id: editingHabit ? editingHabit.id : 'habit_' + Date.now(),
      title: title.trim(),
      description: description.trim(),
      period,
      category,
      colorScheme,
      dueDate,
      dueTime,
      recurrence,
      subtasks,
      completed: editingHabit ? editingHabit.completed : false,
      archived: editingHabit ? editingHabit.archived : false,
      createdAt: editingHabit ? editingHabit.createdAt : new Date().toISOString()
    });
    onClose();
  };

  const colors = [
    { id: 'teal', label: 'Mint Teal', class: 'bg-teal-500' },
    { id: 'indigo', label: 'Periwinkle', class: 'bg-indigo-500' },
    { id: 'coral', label: 'Coral Pink', class: 'bg-rose-500' },
    { id: 'peach', label: 'Peach Sunset', class: 'bg-amber-500' },
    { id: 'purple', label: 'Soft Purple', class: 'bg-purple-500' }
  ];

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
              {editingHabit ? 'Edit Habit' : 'Create New Habit'}
            </h2>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Title & Voice Dictation */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Habit Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. 'Read 15 mins every morning at 8am'"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full pl-4 pr-12 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl border border-black/5 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-orange-400 font-semibold"
              />
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl border transition-all ${
                  isListeningVoice 
                    ? 'bg-rose-500 text-white border-rose-400 animate-pulse' 
                    : 'bg-white dark:bg-slate-700 text-slate-400 border-black/5'
                }`}
              >
                {isListeningVoice ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            </div>

            {nlDetectedInfo && (
              <div className="mt-2 p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-between text-xs animate-fade-in">
                <span className="text-orange-600 dark:text-orange-400 font-medium">
                  Auto-parsed: <strong>"{nlDetectedInfo.cleanTitle}"</strong> at {nlDetectedInfo.dueTime}
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

          {/* Time of Day Section (Morning, Afternoon, Evening) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Time of Day Group
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'morning', label: '🌅 Morning' },
                { id: 'afternoon', label: '☀️ Afternoon' },
                { id: 'evening', label: '🌙 Evening' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`py-2 text-xs font-bold rounded-2xl border transition-all ${
                    period === p.id 
                      ? 'bg-orange-500 text-white border-orange-500 shadow-md' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-black/5'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pastel Color Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Habit Color Theme
            </label>
            <div className="flex items-center gap-3">
              {colors.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColorScheme(c.id)}
                  className={`w-8 h-8 rounded-full ${c.class} flex items-center justify-center transition-transform ${
                    colorScheme === c.id ? 'scale-125 ring-4 ring-orange-400/30' : 'hover:scale-110'
                  }`}
                >
                  {colorScheme === c.id && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Row: Reminder Time & Recurrence */}
          <div className="grid grid-cols-2 gap-3">
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

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-orange-500" /> Repeat Schedule
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl border border-black/5 dark:border-white/5 font-semibold"
              >
                <option value="daily">Daily Habit</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Subtasks / Checklist Items */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Subtasks / Steps
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add a step..."
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

          {/* Footer Submit Button */}
          <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-end gap-2">
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
              <Check className="w-4 h-4 stroke-[3]" /> Save Habit
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
