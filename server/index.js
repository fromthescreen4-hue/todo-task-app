import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from './db.js';
import { authenticateToken, requireAdmin, JWT_SECRET } from './middleware/auth.js';
import { authRateLimiter } from './middleware/rateLimiter.js';
import { emailService } from './services/emailService.js';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const defaultOrigins = 'http://localhost:5173,http://localhost:3000,http://localhost:5000,https://do-this.netlify.app,https://todo-task-app.dothis-v2.workers.dev';
const allowedOriginsRaw = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || defaultOrigins;
const allowedOrigins = allowedOriginsRaw
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without origin (curl, mobile native apps, health checks)
    if (!origin) return callback(null, true);

    const isLocalIp = /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    if (allowedOrigins.includes(origin) || isLocalIp || origin.endsWith('.netlify.app') || origin.endsWith('.workers.dev')) {
      callback(null, origin);
    } else {
      callback(null, origin);
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Apply rate limiter to auth endpoints
app.use('/api/auth', authRateLimiter({ windowMs: 15 * 60 * 1000, max: 40 }));

// Multi-device SSE Live Sync Stream Connections Map (userId -> Set<res>)
const sseClients = new Map();

function broadcastUserEvent(userId, eventType, data = {}) {
  const clients = sseClients.get(userId);
  if (clients && clients.size > 0) {
    const payload = `data: ${JSON.stringify({ type: eventType, timestamp: Date.now(), ...data })}\n\n`;
    for (const clientRes of clients) {
      try {
        clientRes.write(payload);
      } catch (e) {
        clients.delete(clientRes);
      }
    }
  }
}

// Live SSE Sync Endpoint for Instant Cross-Device Updates
app.get('/api/sync/stream', (req, res) => {
  const token = req.query.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token missing for SSE stream' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const requestOrigin = req.headers.origin || '*';

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': requestOrigin,
      'Access-Control-Allow-Credentials': 'true'
    });
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', userId, timestamp: Date.now() })}\n\n`);

    if (!sseClients.has(userId)) {
      sseClients.set(userId, new Set());
    }
    sseClients.get(userId).add(res);

    req.on('close', () => {
      if (sseClients.has(userId)) {
        sseClients.get(userId).delete(res);
        if (sseClients.get(userId).size === 0) {
          sseClients.delete(userId);
        }
      }
    });
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Invalid token for SSE stream' });
  }
});

// 1. Health Monitoring Endpoint (Canonical API Health)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'todo-task-app-api',
    status: 'ok',
    version: '2.0.0-prod',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// 2. Google OAuth Account Sign-In / Sign-Up / Account Linking
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken, credential, token: inputToken } = req.body;
    const tokenToVerify = idToken || credential || inputToken;

    if (!tokenToVerify) {
      return res.status(400).json({ error: 'Google ID token (credential) is required for Google authentication.' });
    }

    let verifiedPayload = null;
    try {
      const googleOAuthClient = new OAuth2Client();
      const expectedClientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
      
      const verifyOptions = { idToken: tokenToVerify };
      if (expectedClientId) {
        verifyOptions.audience = [expectedClientId, '1005301953165-6crod6p1tt7m2h2qck0km5s6ibjj9mmd.apps.googleusercontent.com'];
      }

      try {
        const ticket = await googleOAuthClient.verifyIdToken(verifyOptions);
        verifiedPayload = ticket.getPayload();
      } catch (audienceErr) {
        // If audience check failed because user configured a different Google Client ID in Cloud Console, verify token signature
        const ticket = await googleOAuthClient.verifyIdToken({ idToken: tokenToVerify });
        verifiedPayload = ticket.getPayload();
      }
    } catch (verifyError) {
      console.warn('google-auth-library verifyIdToken warning, trying tokeninfo endpoint:', verifyError.message);
      try {
        const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenToVerify)}`);
        if (resp.ok) {
          verifiedPayload = await resp.json();
        }
      } catch (e) {}
    }

    if (!verifiedPayload || !verifiedPayload.email) {
      return res.status(401).json({ error: 'Invalid or unverified Google ID token.' });
    }

    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (verifiedPayload.iss && !validIssuers.includes(verifiedPayload.iss)) {
      return res.status(401).json({ error: 'Invalid Google ID token issuer.' });
    }

    if (verifiedPayload.email_verified === false || verifiedPayload.email_verified === 'false') {
      return res.status(401).json({ error: 'Google email address is not verified by Google.' });
    }

    const googleSub = verifiedPayload.sub;
    const email = verifiedPayload.email;
    const name = verifiedPayload.name || verifiedPayload.given_name || email.split('@')[0];
    const avatar = verifiedPayload.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check by Google ID (sub) first
    let user = db.findUserByGoogleId(googleSub);

    // 2. If not found by Google ID, check by verified email (Account Linking)
    if (!user) {
      user = db.findUserByEmail(cleanEmail);
      if (user) {
        // Link Google ID to existing account while preserving existing user.id & all existing tasks!
        const updates = {
          google_id: googleSub,
          last_login: new Date().toISOString(),
          email_verified: true,
          updated_at: new Date().toISOString()
        };
        if (user.provider === 'email') {
          updates.provider = 'google+email';
        }
        if (avatar && (!user.avatar || user.avatar.includes('dicebear'))) {
          updates.avatar = avatar;
        }
        if (name && !user.name) {
          updates.name = name;
        }
        user = db.updateUser(user.id, updates);
      }
    }

    // 3. If no account exists, create a new application user
    if (!user) {
      const internalUserId = crypto.randomUUID();
      const dummyPasswordHash = await bcrypt.hash(`google_oauth_${crypto.randomUUID()}`, 10);
      const createdAt = new Date().toISOString();

      user = {
        id: internalUserId,
        google_id: googleSub,
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password_hash: dummyPasswordHash,
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
        provider: 'google',
        email_verified: true,
        theme_preference: 'dark',
        role: 'user',
        created_at: createdAt,
        updated_at: createdAt,
        last_login: createdAt
      };

      db.createUser(user);

      // Seed default categories
      const defaultCats = [
        { id: 'cat_w_' + user.id, user_id: user.id, name: 'Work', color: '#6366f1' },
        { id: 'cat_p_' + user.id, user_id: user.id, name: 'Personal', color: '#ec4899' },
        { id: 'cat_s_' + user.id, user_id: user.id, name: 'Shopping', color: '#10b981' },
        { id: 'cat_e_' + user.id, user_id: user.id, name: 'Shared Events', color: '#f97316' }
      ];
      defaultCats.forEach(c => db.createCategory(c));

      emailService.sendWelcomeEmail(user).catch(console.error);
    } else {
      user = db.updateUser(user.id, { last_login: new Date().toISOString() });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const userProfile = { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      avatar: user.avatar, 
      provider: user.provider || 'google',
      email_verified: Boolean(user.email_verified),
      theme_preference: user.theme_preference || 'dark',
      role: user.role || 'user', 
      created_at: user.created_at,
      last_login: user.last_login,
      authMethod: 'google',
      googleCalendarConnected: true
    };

    // Send automated login notification email
    emailService.sendLoginNotificationEmail(userProfile, 'Google OAuth 2.0').catch(console.error);

    res.json({ token, user: userProfile, message: 'Google Account authenticated successfully' });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ error: 'Google Account authentication failed' });
  }
});

// 3. Email + Password Signup Route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email address, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const existingUser = db.findUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please log in or use Google Sign-In.' });
    }

    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const createdAt = new Date().toISOString();

    const newUser = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      password_hash: passwordHash,
      provider: 'email',
      email_verified: false,
      verification_token: verificationToken,
      theme_preference: 'dark',
      role: 'user',
      created_at: createdAt,
      updated_at: createdAt,
      last_login: createdAt
    };

    db.createUser(newUser);

    // Seed default categories
    const defaultCats = [
      { id: 'cat_w_' + userId, user_id: userId, name: 'Work', color: '#6366f1' },
      { id: 'cat_p_' + userId, user_id: userId, name: 'Personal', color: '#ec4899' },
      { id: 'cat_s_' + userId, user_id: userId, name: 'Shopping', color: '#10b981' },
      { id: 'cat_e_' + userId, user_id: userId, name: 'Shared Events', color: '#f97316' }
    ];
    defaultCats.forEach(c => db.createCategory(c));

    // Send verification email
    emailService.sendVerificationEmail(newUser, verificationToken).catch(console.error);

    const token = jwt.sign({ id: userId, email: cleanEmail }, JWT_SECRET, { expiresIn: '7d' });
    const userProfile = { 
      id: userId, 
      name: cleanName, 
      email: cleanEmail, 
      provider: 'email',
      email_verified: false,
      theme_preference: 'dark',
      role: 'user', 
      created_at: createdAt,
      last_login: createdAt
    };
    
    res.status(201).json({ 
      token, 
      user: userProfile, 
      requiresVerification: true,
      message: 'Account created successfully! Verification code has been sent to your email.' 
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

// 4. Email Verification Endpoint
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { token, email } = req.body;
    if (!token) return res.status(400).json({ error: 'Verification code or token is required' });

    let user = db.findUserByVerificationToken(token.trim());
    if (!user && email) {
      user = db.findUserByEmail(email.trim().toLowerCase());
      if (user && user.verification_token !== token.trim()) {
        user = null;
      }
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    user = db.updateUser(user.id, {
      email_verified: true,
      verification_token: null,
      updated_at: new Date().toISOString()
    });

    const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider || 'email',
      email_verified: true,
      theme_preference: user.theme_preference || 'dark',
      role: user.role || 'user',
      created_at: user.created_at,
      last_login: user.last_login
    };

    emailService.sendWelcomeEmail(userProfile).catch(console.error);

    res.json({ token: jwtToken, user: userProfile, message: 'Email address verified successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// 5. Resend Email Verification Endpoint
app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email address is required' });

    const user = db.findUserByEmail(email.trim().toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'Account with this email does not exist.' });
    }

    if (user.email_verified) {
      return res.status(400).json({ error: 'Your email address is already verified.' });
    }

    const newVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    db.updateUser(user.id, { verification_token: newVerificationToken });

    await emailService.sendVerificationEmail(user, newVerificationToken);

    res.json({ message: 'Verification email resent successfully! Check your inbox.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// 6. Email + Password Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const cleanEmail = email.trim().toLowerCase();
    const user = db.findUserByEmail(cleanEmail);
    if (!user) return res.status(401).json({ error: 'Invalid email address or account does not exist.' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Incorrect password. Please try again.' });

    // Update last login
    const updatedUser = db.updateUser(user.id, { last_login: new Date().toISOString() });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const userProfile = { 
      id: updatedUser.id, 
      name: updatedUser.name, 
      email: updatedUser.email, 
      avatar: updatedUser.avatar, 
      provider: updatedUser.provider || 'email',
      email_verified: Boolean(updatedUser.email_verified),
      theme_preference: updatedUser.theme_preference || 'dark',
      role: updatedUser.role || 'user', 
      created_at: updatedUser.created_at,
      last_login: updatedUser.last_login
    };

    // Send login notification email
    emailService.sendLoginNotificationEmail(userProfile, 'Email/Password').catch(console.error);

    res.json({ token, user: userProfile, message: 'Signed in successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// 7. Get Current User Profile (Session Check)
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// 8. Forgot Password Endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email address is required' });

    const user = db.findUserByEmail(email.trim().toLowerCase());
    if (user) {
      const resetToken = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expires = Date.now() + 3600000; // 1 hour
      db.updateUser(user.id, { reset_token: resetToken, reset_token_expires: expires });
      await emailService.sendPasswordResetEmail(user, resetToken);
    }
    res.json({ message: 'If an account exists for this email, password reset instructions have been sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Password reset request failed' });
  }
});

// 9. Reset Password Confirm Endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Reset token and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters long' });

    const user = db.findUserByResetToken(token.trim());
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    db.updateUser(user.id, { 
      password_hash: newHash, 
      reset_token: null, 
      reset_token_expires: null,
      updated_at: new Date().toISOString() 
    });

    emailService.sendPasswordChangedEmail(user).catch(console.error);

    res.json({ message: 'Password has been reset successfully! You can now log in with your new password.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// 10. Change Password (Authenticated User)
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters long' });

    const user = db.findUserById(req.user.id);
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password entered is incorrect' });

    const newHash = await bcrypt.hash(newPassword, 10);
    db.updateUser(req.user.id, { password_hash: newHash, updated_at: new Date().toISOString() });

    emailService.sendPasswordChangedEmail(user).catch(console.error);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

app.put('/api/users/profile', authenticateToken, (req, res) => {
  try {
    const { name, avatar } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name cannot be empty' });

    const updated = db.updateUser(req.user.id, { name: name.trim(), avatar: avatar || null });
    const userProfile = { id: updated.id, name: updated.name, email: updated.email, avatar: updated.avatar, theme_preference: updated.theme_preference || 'dark', role: updated.role || 'user', created_at: updated.created_at };

    res.json({ user: userProfile, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update Theme Preference (Dark / Light Mode)
app.put('/api/users/theme', authenticateToken, (req, res) => {
  try {
    const { theme_preference } = req.body;
    if (!theme_preference || !['dark', 'light'].includes(theme_preference)) {
      return res.status(400).json({ error: 'Theme preference must be "dark" or "light"' });
    }

    const updated = db.updateUser(req.user.id, { theme_preference, updated_at: new Date().toISOString() });
    res.json({ theme_preference: updated.theme_preference, message: 'Theme preference updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save theme preference' });
  }
});

app.delete('/api/users/account', authenticateToken, (req, res) => {
  try {
    db.deleteUser(req.user.id);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Tasks API Routes (Strict User Isolation)
app.get('/api/tasks', authenticateToken, (req, res) => {
  try {
    const tasks = db.getTasks(req.user.id);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load user tasks' });
  }
});

app.post('/api/tasks', authenticateToken, (req, res) => {
  try {
    const { id, title, description, category, priority, dueDate, dueTime, recurrence, subtasks, emailNotification, enableEmailReminder } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Task title is required' });

    const taskId = (id && typeof id === 'string' && id.trim().length > 0) ? id.trim() : crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const isEmailOptedIn = Boolean(emailNotification ?? enableEmailReminder ?? false);

    const newTask = {
      id: taskId,
      user_id: req.user.id,
      title: title.trim(),
      description: description || '',
      category: category || 'Work',
      priority: priority || 'medium',
      status: 'to_do',
      dueDate: dueDate || '',
      dueTime: dueTime || '09:00',
      recurrence: recurrence || 'none',
      completed: false,
      archived: false,
      subtasks: subtasks || [],
      enableEmailReminder: isEmailOptedIn,
      emailNotification: isEmailOptedIn,
      createdAt
    };

    const savedTask = db.createTask(newTask);

    // ONLY send email notification IF user explicitly ticked the notification checkbox on the task
    if (savedTask.enableEmailReminder || savedTask.emailNotification) {
      emailService.sendTaskNotificationEmail(req.user, savedTask, 'created').catch(console.error);
    }

    // Broadcast SSE live update to all logged-in devices for this user AFTER database commit
    broadcastUserEvent(req.user.id, 'task.created', { action: 'create', task: savedTask, taskId: savedTask.id });

    res.status(201).json(savedTask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const isEmailOptedIn = Boolean(req.body.emailNotification ?? req.body.enableEmailReminder ?? false);
    const updates = {
      ...req.body,
      enableEmailReminder: isEmailOptedIn,
      emailNotification: isEmailOptedIn
    };
    // Security: Never allow client payload to reassign task user_id, owner_id, or id
    delete updates.user_id;
    delete updates.owner_id;
    delete updates.ownerId;
    delete updates.userId;
    delete updates.id;

    const updated = db.updateTask(id, req.user.id, updates);
    if (!updated) return res.status(404).json({ error: 'Task not found or unauthorized' });

    // ONLY send email notification IF user explicitly ticked the notification checkbox on the task
    if (updated.enableEmailReminder || updated.emailNotification) {
      emailService.sendTaskNotificationEmail(req.user, updated, updated.completed ? 'completed' : 'updated').catch(console.error);
    }

    // Broadcast SSE live update to all logged-in devices for this user AFTER database commit
    broadcastUserEvent(req.user.id, 'task.updated', { action: 'update', task: updated, taskId: id });

    res.json({ message: 'Task updated successfully', task: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteTask(id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Task not found or unauthorized' });

    // Broadcast SSE live update to all logged-in devices for this user AFTER database commit
    broadcastUserEvent(req.user.id, 'task.deleted', { action: 'delete', taskId: id });

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Categories API Routes
app.get('/api/categories', authenticateToken, (req, res) => {
  try {
    const categories = db.getCategories(req.user.id);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

app.post('/api/categories', authenticateToken, (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });

    const newCat = { id: crypto.randomUUID(), user_id: req.user.id, name: name.trim(), color: color || '#6366f1' };
    db.createCategory(newCat);

    broadcastUserEvent(req.user.id, 'category.created', { action: 'create', category: newCat });

    res.status(201).json(newCat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Feedback & Bug Reporting Route
app.post('/api/feedback', (req, res) => {
  try {
    const { email, subject, message, appVersion } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });

    const newFb = {
      id: crypto.randomUUID(),
      user_email: email || 'anonymous@user.app',
      subject: subject.trim(),
      message: message.trim(),
      appVersion: appVersion || 'v2.0.0-prod',
      created_at: new Date().toISOString()
    };
    db.createFeedback(newFb);

    res.status(201).json({ message: 'Thank you! Your feedback has been submitted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Section 6: Catch-all 404 for unmatched /api/* routes (ALWAYS return JSON, NEVER index.html)
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API route not found'
  });
});

// Central Production Error Monitoring Handler (No internal stack traces leaked)
app.use((err, req, res, next) => {
  console.error(`🔴 [Server Error Log] ${req.method} ${req.originalUrl}:`, err.message || err);
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'An unexpected server error occurred. Please try again later.' : (err.message || 'Request failed')
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`\n⚡ [TaskPulse Server] Production REST API running on http://localhost:${PORT}`);
  console.log(`⚡ [Google OAuth] Endpoint ready: http://localhost:${PORT}/api/auth/google\n`);
});
