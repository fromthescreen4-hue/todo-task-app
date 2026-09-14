import React, { useState } from 'react';
import { 
  X, 
  MessageSquarePlus, 
  Send, 
  CheckCircle2, 
  Bug, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

export default function FeedbackModal({ isOpen, onClose, user }) {
  if (!isOpen) return null;

  const [type, setType] = useState('bug'); // 'bug' or 'feature'
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      await apiClient.sendFeedback(
        `[${type.toUpperCase()}] ${subject.trim()}`,
        message.trim(),
        user?.email || null
      );
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSubject('');
        setMessage('');
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#1a1926] border border-black/5 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Send Feedback & Report Issues
              </h2>
              <span className="text-[10px] text-slate-400 font-semibold">Build: v2.0.0-prod</span>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs font-semibold text-rose-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('bug')}
              className={`py-2 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                type === 'bug' 
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-500 shadow-sm' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-black/5'
              }`}
            >
              <Bug className="w-3.5 h-3.5" /> Report a Bug
            </button>

            <button
              type="button"
              onClick={() => setType('feature')}
              className={`py-2 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                type === 'feature' 
                  ? 'bg-orange-500/10 border-orange-500/40 text-orange-500 shadow-sm' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-black/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Feature Suggestion
            </button>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Subject Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 'Issue completing subtasks' or 'Idea for calendar'"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl border border-black/5 dark:border-white/5 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Details */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows="3"
              placeholder="Please describe what happened or what improvement you would like to see..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl border border-black/5 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-orange-400"
            ></textarea>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-orange-400 to-rose-400 text-white rounded-2xl shadow-orange-glow flex items-center gap-1.5"
            >
              {success ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {loading ? 'Submitting...' : success ? 'Feedback Sent!' : 'Submit Feedback'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
