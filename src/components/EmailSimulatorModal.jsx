import React, { useState, useEffect } from 'react';
import { Mail, X, RefreshCw, KeyRound, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function EmailSimulatorModal({ isOpen, onClose, onUseToken }) {
  if (!isOpen) return null;

  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/dev/emails');
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmails(data);
      }
    } catch (e) {
      console.warn('Dev email simulator fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-orange-500 to-rose-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Mail className="w-5 h-5" />
            <div>
              <h3 className="font-extrabold text-sm leading-tight">Outbound Dev Email Inbox</h3>
              <p className="text-[10px] opacity-90 font-medium">Real-time simulation of verification & reset emails</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={fetchEmails} 
              disabled={loading}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
              title="Refresh Inbox"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Email List Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {emails.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Mail className="w-10 h-10 mx-auto stroke-1 opacity-40" />
              <p className="text-xs font-semibold">No emails sent yet.</p>
              <p className="text-[11px]">Register an email or click "Forgot Password" to trigger a simulated email.</p>
            </div>
          ) : (
            emails.map((mail) => (
              <div 
                key={mail.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-2 hover:border-orange-300 dark:hover:border-orange-500/40 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    {mail.type === 'email_verification' && <ShieldAlert className="w-4 h-4 text-orange-500" />}
                    {mail.type === 'password_reset' && <KeyRound className="w-4 h-4 text-indigo-500" />}
                    {mail.type === 'welcome' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {mail.subject}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(mail.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  To: <strong className="text-slate-700 dark:text-slate-200">{mail.to}</strong>
                </div>

                {mail.token && (
                  <div className="pt-2 flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <div className="text-[11px] text-slate-600 dark:text-slate-300">
                      Code/Token: <strong className="font-mono text-orange-500 text-xs px-1">{mail.token}</strong>
                    </div>
                    {onUseToken && (
                      <button
                        onClick={() => { onUseToken(mail.token, mail.type); onClose(); }}
                        className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[10px] font-bold transition-colors"
                      >
                        Copy & Apply
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 text-center font-medium">
          In Production, these emails are sent directly via SMTP or Resend API.
        </div>

      </div>
    </div>
  );
}
