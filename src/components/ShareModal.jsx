import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Globe, 
  Lock, 
  QrCode, 
  Mail, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { shareService } from '../services/shareService';
import { notificationService } from '../services/notificationService';

export default function ShareModal({ isOpen, onClose, task }) {
  if (!isOpen || !task) return null;

  const [permission, setPermission] = useState('view'); // 'view' or 'edit'
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const shareUrl = shareService.generateShareLink(task, permission);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    notificationService.playAudioChime('success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendEmailInvite = (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    notificationService.logEmailDispatch(
      emailInput.trim(),
      `Shared Event Invite: "${task.title}"`,
      'shared_invite',
      task
    );

    setEmailSent(true);
    setEmailInput('');
    setTimeout(() => setEmailSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Share Event / Task Link</h2>
              <p className="text-[11px] text-slate-400">Anyone with link can view & import</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Shared Task Title */}
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center">
              📌
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-200 truncate">{task.title}</div>
              <div className="text-[10px] text-slate-400">
                {task.dueDate ? `Scheduled for ${task.dueDate}` : 'No due date'}
              </div>
            </div>
          </div>

          {/* Access Permission Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Link Permissions
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPermission('view')}
                className={`p-3 rounded-xl text-left border transition-all flex items-center gap-2.5 ${
                  permission === 'view'
                    ? 'bg-sky-500/20 border-sky-500/50 text-white shadow-md'
                    : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-white/5'
                }`}
              >
                <Globe className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="text-xs font-bold">Public View Only</div>
                  <div className="text-[10px] opacity-75">View & import task</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPermission('edit')}
                className={`p-3 rounded-xl text-left border transition-all flex items-center gap-2.5 ${
                  permission === 'edit'
                    ? 'bg-purple-500/20 border-purple-500/50 text-white shadow-md'
                    : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-white/5'
                }`}
              >
                <Lock className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-xs font-bold">Collaborative</div>
                  <div className="text-[10px] opacity-75">Editable subtasks</div>
                </div>
              </button>
            </div>
          </div>

          {/* Share Link Input Box */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Copy Link URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3 py-2 text-xs bg-slate-950 text-sky-300 rounded-xl border border-white/10 font-mono truncate focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Direct Email Invite Form */}
          <div className="pt-3 border-t border-white/10">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-indigo-400" /> Send Email Invitation Directly
            </label>
            <form onSubmit={handleSendEmailInvite} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="colleague@company.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-800 text-slate-100 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
              >
                Send Invite
              </button>
            </form>
            {emailSent && (
              <p className="text-xs text-emerald-400 font-semibold mt-1.5 flex items-center gap-1 animate-fade-in">
                <Check className="w-3.5 h-3.5" /> Email invite dispatched to simulator inbox!
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
