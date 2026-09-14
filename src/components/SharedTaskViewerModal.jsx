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
  Send
} from 'lucide-react';
import { notificationService } from '../services/notificationService';

export default function SharedTaskViewerModal({ sharedTask, onClose, onImportTask }) {
  if (!sharedTask) return null;

  const [comments, setComments] = useState(sharedTask.comments || [
    { id: 'c1', author: 'Alex Morgan', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', text: 'Hey! Here is the shared event checklist.', time: 'Just now' }
  ]);
  const [commentText, setCommentText] = useState('');
  const [imported, setImported] = useState(false);

  const handleImport = () => {
    onImportTask({
      ...sharedTask,
      id: 'imported_' + Date.now(),
      isShared: true,
      category: 'Shared Events'
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
        author: 'Guest Collaborator',
        avatar: null,
        text: commentText.trim(),
        time: 'Just now'
      }
    ]);
    setCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-900/60 via-indigo-900/60 to-purple-900/60 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
              <Share2 className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                Shared Event Link
              </span>
              <h2 className="text-base font-extrabold text-white">
                {sharedTask.title}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Public Read Only Status Banner */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <div>
                <div className="font-extrabold text-amber-300 text-xs">Public Event • Read Only Mode</div>
                <div className="text-[10px] text-amber-200/80">You can view live status and details publicly. Editing is restricted to the event creator.</div>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              Read Only
            </span>
          </div>

          {/* Main Info Box */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
            {sharedTask.description && (
              <p className="text-xs text-slate-300 leading-relaxed">
                {sharedTask.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 text-xs text-slate-400 pt-2 border-t border-white/5">
              {sharedTask.dueDate && (
                <div className="flex items-center gap-1 text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{sharedTask.dueDate} {sharedTask.dueTime}</span>
                </div>
              )}

              <div className="flex items-center gap-1 text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                <User className="w-3.5 h-3.5" />
                <span>Shared by {sharedTask.sharedBy || 'Team Member'}</span>
              </div>
            </div>
          </div>

          {/* Subtasks Checklist Preview */}
          {sharedTask.subtasks && sharedTask.subtasks.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Event Subtasks Checklist
              </h3>
              <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-white/5">
                {sharedTask.subtasks.map(st => (
                  <div key={st.id} className="flex items-center gap-2 text-xs text-slate-200">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      st.completed ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-white/30'
                    }`}>
                      {st.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className={st.completed ? 'line-through text-slate-500' : ''}>
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import to My Workspace Action */}
          <div className="p-4 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Import Event to My Board</div>
              <div className="text-[10px] text-slate-300">Add this shared task into your personal TaskPulse board</div>
            </div>
            <button
              onClick={handleImport}
              disabled={imported}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                imported
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25'
              }`}
            >
              {imported ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              {imported ? 'Imported!' : 'Import Task'}
            </button>
          </div>

          {/* Comments Discussion Section */}
          <div className="pt-3 border-t border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Collaborator Comments
            </h3>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {comments.map(c => (
                <div key={c.id} className="p-2.5 bg-slate-800/60 rounded-xl border border-white/5 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-indigo-300">{c.author}</span>
                    <span>{c.time}</span>
                  </div>
                  <p className="text-slate-200">{c.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-800 text-slate-100 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500"
              />
              <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
