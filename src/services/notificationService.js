const EMAIL_LOG_KEY = 'taskpulse_email_logs_v2';

export const notificationService = {
  // Web Notification API Permission
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      alert('This browser does not support Web Desktop Notifications.');
      return 'unsupported';
    }

    const permission = await Notification.requestPermission();
    return permission;
  },

  // Send Browser Push Notification
  sendWebNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          body: options.body || 'TaskPulse Reminder',
          tag: options.tag || 'taskpulse-notif',
          ...options
        });
        notif.onclick = () => {
          window.focus();
        };
      } catch (e) {
        console.warn('Web notification trigger error', e);
      }
    }
    this.playAudioChime(options.soundType || 'reminder');
  },

  // Synthesize soft audio chimes using Web Audio API
  playAudioChime(type = 'success') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        // High pleasant double-beep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        // Reminder tone
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // Audio context might be restricted before user interaction
    }
  },

  // Outbound Email Simulator Log
  getEmailLogs() {
    try {
      const data = localStorage.getItem(EMAIL_LOG_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  logEmailDispatch(recipientEmail, subject, type, taskDetails = {}) {
    const logs = this.getEmailLogs();
    const newLog = {
      id: 'email_' + Date.now(),
      recipient: recipientEmail,
      subject,
      type, // 'reminder' | 'shared_invite' | 'daily_digest'
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
      taskDetails
    };

    const updated = [newLog, ...logs].slice(0, 20); // keep last 20 emails
    localStorage.setItem(EMAIL_LOG_KEY, JSON.stringify(updated));

    // Webhook simulation dispatch
    this.triggerWebhookIfConfigured(subject, newLog);

    return newLog;
  },

  async triggerWebhookIfConfigured(title, payload) {
    try {
      const user = JSON.parse(localStorage.getItem('taskpulse_user_v2') || '{}');
      if (user.webhookUrl) {
        // Simulated or real fetch dispatch
        console.log(`[Webhook Dispatch] Calling ${user.webhookUrl} with title: "${title}"`, payload);
      }
    } catch (e) {
      console.warn('Webhook dispatch skipped', e);
    }
  }
};
