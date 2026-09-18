import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Download, 
  Check, 
  Clock, 
  Calendar, 
  MessageSquare, 
  User, 
  Sparkles,
  Send,
  Globe,
  ListChecks,
  ShieldCheck
} from 'lucide-react';
import { notificationService } from '../services/notificationService';

export default function SharedTaskViewerModal({ sharedTask, onClose, onImportTask }) {
  if (!sharedTask) return null;

  const [comments, setComments] = useState(sharedTask.comments || [
    { id: 'c1', author: 'Team Member', text: 'Public task status page active. Track progress below.', time: 'Just now' }
  ]);
  const [commentText, setCommentText] = useState('');
  const [imported, setImported] = useState(false);

  const subtasks = sharedTask.subtasks || [];
  const completedCount = subtasks.filter(st => st.completed).length;
  const progressPercent = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : (sharedTask.completed ? 100 : 0);

  const handleImport = () => {
    onImportTask({
      ...sharedTask,
      id: 'imported_' + Date.now(),
      isShared: true,
      category: sharedTask.category || 'Shared Events'
    });
    setImported(true);
    notificationService.playAudioChime('success');
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setComments([
      ...comments,
      {
        id: 'c_' + Date.now(),
        author: 'Guest Viewer',
        text: commentText.trim(),
        time: 'Just now'
      }
    ]);
    setCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-orange-500/30 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Public Page Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-950/60 via-slate-900 to-indigo-950/60 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30 font-bold">
              ⚡
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400 flex items-center gap-1">
                <Globe className="w-3 h-3" /> Public Task Status Page
              </div>
              <h2 className="text-base font-extrabold text-white">
                {sharedTask.title}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Metadata Card */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {sharedTask.category && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                    {sharedTask.category}
                  </span>
                )}
                {sharedTask.priority && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-500/20 text-orange-300 border border-orange-500/30 uppercase tracking-wider">
                    {sharedTask.priority} priority
                  </span>
                )}
              </div>

              {sharedTask.dueDate && (
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Due: {sharedTask.dueDate} {sharedTask.dueTime || ''}</span>
                </div>
              )}
            </div>

            {sharedTask.description && (
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {sharedTask.description}
              </p>
            )}
          </div>

          {/* Progress Section */}
          <div className="p-4 bg-slate-800/60 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-orange-400" /> Overall Progress
              </span>
              <span className="font-extrabold text-orange-400 text-sm">{progressPercent}%</span>
            </div>

            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 via-rose-500 to-amber-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Subtasks Progress List */}
          {subtasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider">
                  Subtasks Checklist
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {completedCount} of {subtasks.length} completed
                </span>
              </div>

              <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-2xl border border-white/5">
                {subtasks.map(st => (
                  <div key={st.id} className="flex items-center gap-2.5 text-xs py-1 px-2 text-slate-200">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      st.completed 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400 text-white' 
                        : 'border-white/30 bg-slate-900'
                    }`}>
                      {st.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className={st.completed ? 'line-through text-slate-500 font-medium' : 'font-medium'}>
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="p-4 bg-gradient-to-r from-orange-950/40 via-slate-900 to-indigo-950/40 border border-white/10 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified Public View
              </div>
              <div className="text-[10px] text-slate-400">Import task to your workspace to track locally</div>
            </div>
            <button
              onClick={handleImport}
              disabled={imported}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                imported
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white shadow-lg shadow-orange-500/20'
              }`}
            >
              {imported ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              {imported ? 'Imported!' : 'Import Task'}
            </button>
          </div>

          {/* Collaborator Discussion Comments */}
          <div className="pt-2 border-t border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-orange-400" /> Public Activity & Notes
            </h3>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {comments.map(c => (
                <div key={c.id} className="p-2.5 bg-slate-800/60 rounded-xl border border-white/5 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-orange-400">{c.author}</span>
                    <span>{c.time}</span>
                  </div>
                  <p className="text-slate-200">{c.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Leave a note or comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-800 text-slate-100 rounded-xl border border-white/10 focus:outline-none focus:border-orange-500"
              />
              <button type="submit" className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
