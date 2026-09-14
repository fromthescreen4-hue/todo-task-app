import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Bell, 
  Send, 
  Check, 
  Calendar, 
  Globe,
  Sparkles
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { realGoogleAuthService } from '../services/realGoogleAuthService';

export default function IntegrationsModal({ isOpen, onClose, user, onSaveUser }) {
  if (!isOpen) return null;

  const [webhookUrl, setWebhookUrl] = useState(user?.webhookUrl || '');
  const [googleClientId, setGoogleClientId] = useState(() => realGoogleAuthService.getClientId());
  const [saved, setSaved] = useState(false);
  const [notifStatus, setNotifStatus] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  const handleRequestPush = async () => {
    const result = await notificationService.requestNotificationPermission();
    setNotifStatus(result);
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveUser({
      ...user,
      webhookUrl: webhookUrl.trim()
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Integrations & Webhooks</h2>
              <p className="text-[11px] text-slate-400">Connect Slack, Email API, Web Push & Calendar</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          {/* Google Calendar Integration Card */}
          <div className="p-4 bg-slate-950/60 border border-orange-500/20 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-xs font-bold text-white">Google OAuth & Calendar Sync</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                OAuth 2.0 Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Connect your official Google Account via Google Identity Services (`accounts.google.com`) for direct Google Calendar synchronization.
            </p>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Google Cloud Console OAuth Client ID (Optional Custom Client ID)
              </label>
              <input
                type="text"
                placeholder="e.g. 1092837491023-...apps.googleusercontent.com"
                value={googleClientId}
                onChange={(e) => {
                  setGoogleClientId(e.target.value);
                  realGoogleAuthService.setClientId(e.target.value);
                }}
                className="w-full px-3 py-1.5 text-xs bg-slate-900 text-slate-100 rounded-xl border border-white/10 font-mono focus:outline-none focus:border-orange-400"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
              <span className="text-slate-400 text-[11px]">Active Account:</span>
              <span className="text-slate-200 font-semibold text-[11px] truncate max-w-[200px]">
                {user?.email || 'google.account@gmail.com'}
              </span>
            </div>
          </div>

          {/* Desktop Push Notification Request */}
          <div className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white">Web Desktop Push</span>
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Status: {notifStatus}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Receive instant native desktop popups when task deadlines and reminders trigger.
            </p>
            {notifStatus !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPush}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Enable Desktop Notifications
              </button>
            )}
          </div>

          {/* Webhook Endpoint Configuration */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-indigo-400" /> Outbound Webhook Endpoint URL
            </label>
            <input
              type="url"
              placeholder="https://hooks.slack.com/services/... or Email API"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800 text-slate-100 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Automated HTTP POST requests will be dispatched to this webhook whenever reminders execute.
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-1.5"
            >
              {saved ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
              {saved ? 'Saved!' : 'Save Integration Settings'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
