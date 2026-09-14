// Store recent sent emails in memory for dev simulation/debugging
const sentEmailLogs = [];

export const emailService = {
  getSentEmailLogs() {
    return sentEmailLogs.slice(0, 20);
  },

  async sendEmail({ to, subject, html, text, type = 'general', token = null }) {
    const isProdEmailConfigured = Boolean(process.env.EMAIL_HOST || process.env.RESEND_API_KEY);
    const emailLogEntry = {
      to,
      subject,
      type,
      timestamp: new Date().toISOString()
    };

    sentEmailLogs.unshift(emailLogEntry);
    if (sentEmailLogs.length > 50) sentEmailLogs.pop();

    if (isProdEmailConfigured) {
      try {
        console.log(`[Email Dispatch] Sending email via Provider to ${to}: "${subject}"`);
        if (process.env.RESEND_API_KEY) {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || 'DoThis App <notifications@dothis.app>',
              to,
              subject,
              html
            })
          });
          const data = await res.json();
          return { success: true, data };
        }
      } catch (err) {
        console.error('[Email Dispatch Error]', err);
      }
    }

    // Dev / Demo Fallback Logger
    console.log('\n================ Outbound Email Simulated ================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Token: ${token || 'N/A'}`);
    console.log(`Body Snippet: ${text || 'HTML Template rendered'}`);
    console.log('==========================================================\n');

    return { success: true, simulated: true, log: emailLogEntry };
  },

  async sendVerificationEmail(user, token) {
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}#verify-email=${token}`;
    return this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address — DoThis App',
      type: 'email_verification',
      token,
      text: `Hello ${user.name}, please verify your email address by opening: ${verifyUrl} or entering code: ${token}`,
      html: `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 24px; color: #1e1e2d; background: #ffffff; border-radius: 20px; border: 1px solid #f1f5f9; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #f97316; margin-top: 0;">Verify Your Email Address ✉️</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Thank you for signing up for <strong>DoThis</strong>! Please click the button below to verify your email address and activate your account:</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${verifyUrl}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #ff7052, #f97316); color: #ffffff; font-weight: bold; text-decoration: none; border-radius: 14px; font-size: 14px;">Verify Email Address</a>
          </div>
          <p style="font-size: 12px; color: #64748b;">Or enter this verification code directly in the app: <strong style="color: #ff7052; font-family: monospace; font-size: 14px;">${token}</strong></p>
        </div>
      `
    });
  },

  async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to DoThis — Productive Task Suite',
      type: 'welcome',
      text: `Hello ${user.name}, welcome to DoThis! Your workspace is ready.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e1e2d; background: #ffffff; border-radius: 16px; border: 1px solid #f1f5f9;">
          <h2 style="color: #f97316;">Welcome to DoThis, ${user.name}! 🚀</h2>
          <p>Your account (<strong>${user.email}</strong>) is now active and ready for cross-device sync.</p>
          <p>Start organizing your tasks, schedule, and Google Calendar events seamlessly.</p>
        </div>
      `
    });
  },

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}#reset-token=${resetToken}`;
    return this.sendEmail({
      to: user.email,
      subject: 'DoThis — Password Reset Request',
      type: 'password_reset',
      token: resetToken,
      text: `Hello ${user.name}, click the link to set a new password: ${resetUrl} (Code: ${resetToken})`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #1e1e2d; background: #ffffff; border-radius: 20px; border: 1px solid #f1f5f9; max-width: 480px; margin: 0 auto;">
          <h3 style="color: #6366f1; margin-top: 0;">Password Reset Request</h3>
          <p>Hello ${user.name},</p>
          <p>We received a request to reset your password. Use the verification code below or click the link to create a new password (valid for 1 hour):</p>
          <div style="margin: 20px 0; padding: 14px; background: #f8fafc; border-radius: 12px; font-family: monospace; font-size: 16px; font-weight: bold; color: #6366f1; text-align: center; letter-spacing: 2px;">
            ${resetToken}
          </div>
          <p style="font-size: 12px; color: #64748b;">Link: <a href="${resetUrl}">${resetUrl}</a></p>
        </div>
      `
    });
  },

  async sendLoginNotificationEmail(user, authMethod = 'Google OAuth') {
    const timeStr = new Date().toLocaleString();
    return this.sendEmail({
      to: user.email,
      subject: `Security Alert: New Sign-in to your DoThis account`,
      type: 'login_notification',
      text: `Hello ${user.name}, a new login was detected on your DoThis account via ${authMethod} at ${timeStr}.`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #1e1e2d; background: #ffffff; border-radius: 20px; border: 1px solid #f1f5f9; max-width: 480px; margin: 0 auto;">
          <h3 style="color: #f97316; margin-top: 0;">New Account Login Detected 🔑</h3>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>A new sign-in was detected for your account (<strong>${user.email}</strong>):</p>
          <ul style="font-size: 13px; color: #475569; padding-left: 20px;">
            <li><strong>Authentication Provider:</strong> ${authMethod}</li>
            <li><strong>Timestamp:</strong> ${timeStr}</li>
            <li><strong>Security Status:</strong> Account Authenticated</li>
          </ul>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">If this was you, no action is needed. Your tasks and schedule are synced across devices.</p>
        </div>
      `
    });
  },

  async sendTaskNotificationEmail(user, task, action = 'created') {
    const actionLabel = action === 'created' ? 'Created' : action === 'completed' ? 'Completed' : 'Updated';
    return this.sendEmail({
      to: user.email,
      subject: `Task ${actionLabel}: "${task.title}"`,
      type: 'task_notification',
      text: `Hello ${user.name}, your task "${task.title}" has been ${actionLabel.toLowerCase()} in your DoThis workspace.`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #1e1e2d; background: #ffffff; border-radius: 20px; border: 1px solid #f1f5f9; max-width: 480px; margin: 0 auto;">
          <h3 style="color: #6366f1; margin-top: 0;">Task Notification: ${actionLabel} 📝</h3>
          <p>Hello <strong>${user.name}</strong>,</p>
          <div style="padding: 16px; background: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; margin: 16px 0;">
            <div style="font-weight: font-bold; font-size: 15px; color: #1e293b;">${task.title}</div>
            ${task.description ? `<p style="font-size: 12px; color: #64748b; margin: 6px 0 0 0;">${task.description}</p>` : ''}
            <div style="font-size: 11px; color: #94a3b8; margin-top: 10px; display: flex; gap: 10px;">
              <span>Category: <strong>${task.category || 'Work'}</strong></span> • 
              <span>Priority: <strong style="text-transform: uppercase;">${task.priority || 'medium'}</strong></span>
            </div>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">Automated notification from your DoThis Workspace.</p>
        </div>
      `
    });
  },

  async sendPasswordChangedEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: 'Security Alert: Your DoThis Password Was Updated',
      type: 'security_alert',
      text: `Hello ${user.name}, your password for DoThis was updated successfully.`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #1e1e2d; background: #ffffff; border-radius: 20px; border: 1px solid #f1f5f9; max-width: 480px; margin: 0 auto;">
          <h3 style="color: #10b981; margin-top: 0;">Password Successfully Updated 🛡️</h3>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>The password for your <strong>DoThis</strong> account (<strong>${user.email}</strong>) has been changed successfully.</p>
          <p style="font-size: 12px; color: #94a3b8;">If you did not perform this action, please reset your password immediately.</p>
        </div>
      `
    });
  },

  async sendPromotionalActivityEmail(user, title = 'Weekly Workspace Summary & Productivity Boost', textSnippet = 'Check out your recent progress and scheduled tasks for this week.') {
    return this.sendEmail({
      to: user.email,
      subject: `DoThis Updates: ${title}`,
      type: 'promotional_activity',
      text: `Hello ${user.name}, ${textSnippet}`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #1e1e2d; background: #ffffff; border-radius: 20px; border: 1px solid #f1f5f9; max-width: 480px; margin: 0 auto;">
          <h3 style="color: #f97316; margin-top: 0;">⚡ ${title}</h3>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p style="font-size: 13px; color: #475569; leading-height: 1.6;">${textSnippet}</p>
          <div style="margin: 20px 0; padding: 14px; background: #fff7ed; border-radius: 14px; border: 1px solid #ffedd5; font-size: 12px; color: #c2410c;">
            <strong>Pro Tip:</strong> Keep your Google Calendar sync enabled to receive real-time schedule alerts on all your devices.
          </div>
          <p style="font-size: 12px; color: #94a3b8;">Sent to registered email <strong>${user.email}</strong> • DoThis Productivity Suite.</p>
        </div>
      `
    });
  }
};

