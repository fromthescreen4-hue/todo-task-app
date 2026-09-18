import { db } from './db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { JWT_SECRET } from './middleware/auth.js';

const ALLOWED_ORIGINS = [
  'https://do-this.netlify.app',
  'https://todo-task-app.dothis-v2.workers.dev',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000'
];

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith('.netlify.app') ||
    origin.endsWith('.workers.dev') ||
    /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

  const matchedOrigin = isAllowed ? origin : 'https://do-this.netlify.app';

  return {
    'Access-Control-Allow-Origin': matchedOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
    'Content-Type': 'application/json'
  };
}

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

function verifyJwtToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (e) {
    return null;
  }
}

export async function handleWorkerFetch(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Check if this is an API route request
  if (pathname.startsWith('/api/') || pathname === '/api') {
    const corsHeaders = getCorsHeaders(request);

    // 1. Handle OPTIONS Preflight Requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    try {
      // 2. Health Check Endpoint (GET /api/health)
      if (pathname === '/api/health' && request.method === 'GET') {
        return jsonResponse({
          ok: true,
          service: 'todo-task-app-api',
          status: 'ok',
          version: '2.0.0-prod',
          timestamp: new Date().toISOString()
        }, 200, corsHeaders);
      }

      // 3. Google OAuth Authentication (POST /api/auth/google)
      if (pathname === '/api/auth/google' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const tokenToVerify = body.idToken || body.credential || body.token;

        if (!tokenToVerify) {
          return jsonResponse({ success: false, error: 'Google ID token (credential) is required' }, 400, corsHeaders);
        }

        let verifiedPayload = null;
        try {
          const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenToVerify)}`);
          if (resp.ok) {
            verifiedPayload = await resp.json();
          }
        } catch (e) {}

        if (!verifiedPayload || !verifiedPayload.email) {
          return jsonResponse({ success: false, error: 'Invalid or unverified Google ID token.' }, 401, corsHeaders);
        }

        const googleSub = verifiedPayload.sub;
        const email = verifiedPayload.email;
        const cleanEmail = email.trim().toLowerCase();
        const name = verifiedPayload.name || verifiedPayload.given_name || cleanEmail.split('@')[0];
        const avatar = verifiedPayload.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`;

        let user = db.findUserByGoogleId(googleSub);
        if (!user) {
          user = db.findUserByEmail(cleanEmail);
          if (user) {
            user = db.updateUser(user.id, {
              google_id: googleSub,
              email_verified: true,
              last_login: new Date().toISOString()
            });
          }
        }

        if (!user) {
          const internalUserId = crypto.randomUUID();
          const dummyPasswordHash = await bcrypt.hash(`google_oauth_${crypto.randomUUID()}`, 10);
          const createdAt = new Date().toISOString();

          user = {
            id: internalUserId,
            google_id: googleSub,
            name: name,
            email: cleanEmail,
            password_hash: dummyPasswordHash,
            avatar: avatar,
            provider: 'google',
            email_verified: true,
            theme_preference: 'dark',
            role: 'user',
            created_at: createdAt,
            updated_at: createdAt,
            last_login: createdAt
          };
          db.createUser(user);

          const defaultCats = [
            { id: 'cat_w_' + user.id, user_id: user.id, name: 'Work', color: '#6366f1' },
            { id: 'cat_p_' + user.id, user_id: user.id, name: 'Personal', color: '#ec4899' },
            { id: 'cat_s_' + user.id, user_id: user.id, name: 'Shopping', color: '#10b981' },
            { id: 'cat_e_' + user.id, user_id: user.id, name: 'Shared Events', color: '#f97316' }
          ];
          defaultCats.forEach(c => db.createCategory(c));
        } else {
          user = db.updateUser(user.id, { last_login: new Date().toISOString() });
        }

        const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
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
          last_login: user.last_login
        };

        return jsonResponse({
          success: true,
          token: jwtToken,
          user: userProfile,
          message: 'Google Account authenticated successfully'
        }, 200, corsHeaders);
      }

      // 4. Email Register (POST /api/auth/register)
      if (pathname === '/api/auth/register' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const { name, email, password, confirmPassword } = body;
        if (!name || !email || !password) {
          return jsonResponse({ success: false, error: 'Full name, email address, and password are required' }, 400, corsHeaders);
        }
        const cleanEmail = email.trim().toLowerCase();
        if (password.length < 6) {
          return jsonResponse({ success: false, error: 'Password must be at least 6 characters long' }, 400, corsHeaders);
        }
        if (confirmPassword && password !== confirmPassword) {
          return jsonResponse({ success: false, error: 'Passwords do not match' }, 400, corsHeaders);
        }
        const existing = db.findUserByEmail(cleanEmail);
        if (existing) {
          return jsonResponse({ success: false, error: 'An account with this email address already exists.' }, 409, corsHeaders);
        }

        const userId = crypto.randomUUID();
        const passwordHash = await bcrypt.hash(password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const createdAt = new Date().toISOString();

        const newUser = {
          id: userId,
          name: name.trim(),
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

        const defaultCats = [
          { id: 'cat_w_' + userId, user_id: userId, name: 'Work', color: '#6366f1' },
          { id: 'cat_p_' + userId, user_id: userId, name: 'Personal', color: '#ec4899' },
          { id: 'cat_s_' + userId, user_id: userId, name: 'Shopping', color: '#10b981' },
          { id: 'cat_e_' + userId, user_id: userId, name: 'Shared Events', color: '#f97316' }
        ];
        defaultCats.forEach(c => db.createCategory(c));

        const jwtToken = jwt.sign({ id: userId, email: cleanEmail }, JWT_SECRET, { expiresIn: '7d' });
        const userProfile = {
          id: userId,
          name: name.trim(),
          email: cleanEmail,
          provider: 'email',
          email_verified: false,
          theme_preference: 'dark',
          role: 'user',
          created_at: createdAt,
          last_login: createdAt
        };

        return jsonResponse({
          success: true,
          token: jwtToken,
          user: userProfile,
          requiresVerification: true,
          message: 'Account created successfully!'
        }, 201, corsHeaders);
      }

      // 5. Email Login (POST /api/auth/login)
      if (pathname === '/api/auth/login' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const { email, password } = body;
        if (!email || !password) {
          return jsonResponse({ success: false, error: 'Email and password are required' }, 400, corsHeaders);
        }
        const cleanEmail = email.trim().toLowerCase();
        const user = db.findUserByEmail(cleanEmail);
        if (!user) {
          return jsonResponse({ success: false, error: 'Invalid email address or account does not exist.' }, 401, corsHeaders);
        }
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
          return jsonResponse({ success: false, error: 'Incorrect password. Please try again.' }, 401, corsHeaders);
        }
        const updated = db.updateUser(user.id, { last_login: new Date().toISOString() });
        const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        const userProfile = {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          avatar: updated.avatar,
          provider: updated.provider || 'email',
          email_verified: Boolean(updated.email_verified),
          theme_preference: updated.theme_preference || 'dark',
          role: updated.role || 'user',
          created_at: updated.created_at,
          last_login: updated.last_login
        };
        return jsonResponse({
          success: true,
          token: jwtToken,
          user: userProfile,
          message: 'Signed in successfully'
        }, 200, corsHeaders);
      }

      // 6. Current User Check (GET /api/auth/me)
      if (pathname === '/api/auth/me' && request.method === 'GET') {
        const decoded = verifyJwtToken(request.headers.get('Authorization'));
        if (!decoded) {
          return jsonResponse({ success: false, error: 'Unauthorized or invalid token' }, 401, corsHeaders);
        }
        const user = db.findUserById(decoded.id);
        if (!user) {
          return jsonResponse({ success: false, error: 'User account not found' }, 404, corsHeaders);
        }
        return jsonResponse({ success: true, user }, 200, corsHeaders);
      }

      // 7. Get User Tasks (GET /api/tasks)
      if (pathname === '/api/tasks' && request.method === 'GET') {
        const decoded = verifyJwtToken(request.headers.get('Authorization'));
        if (!decoded) {
          return jsonResponse({ success: false, error: 'Unauthorized' }, 401, corsHeaders);
        }
        const tasks = db.getTasks(decoded.id);
        return jsonResponse(tasks, 200, corsHeaders);
      }

      // 8. Create Task (POST /api/tasks)
      if (pathname === '/api/tasks' && request.method === 'POST') {
        const decoded = verifyJwtToken(request.headers.get('Authorization'));
        if (!decoded) {
          return jsonResponse({ success: false, error: 'Unauthorized' }, 401, corsHeaders);
        }
        const body = await request.json().catch(() => ({}));
        if (!body.title || !body.title.trim()) {
          return jsonResponse({ success: false, error: 'Task title is required' }, 400, corsHeaders);
        }
        const newTask = {
          ...body,
          id: (body.id && typeof body.id === 'string' && body.id.trim().length > 0) ? body.id.trim() : crypto.randomUUID(),
          user_id: decoded.id,
          title: body.title.trim(),
          createdAt: new Date().toISOString()
        };
        const saved = db.createTask(newTask);
        return jsonResponse(saved, 201, corsHeaders);
      }

      // 9. Update Task (PUT /api/tasks/:id)
      if (pathname.startsWith('/api/tasks/') && request.method === 'PUT') {
        const decoded = verifyJwtToken(request.headers.get('Authorization'));
        if (!decoded) {
          return jsonResponse({ success: false, error: 'Unauthorized' }, 401, corsHeaders);
        }
        const taskId = pathname.replace('/api/tasks/', '');
        const body = await request.json().catch(() => ({}));
        delete body.user_id;
        delete body.id;
        const updated = db.updateTask(taskId, decoded.id, body);
        if (!updated) {
          return jsonResponse({ success: false, error: 'Task not found or unauthorized' }, 404, corsHeaders);
        }
        return jsonResponse({ success: true, message: 'Task updated successfully', task: updated }, 200, corsHeaders);
      }

      // 10. Delete Task (DELETE /api/tasks/:id)
      if (pathname.startsWith('/api/tasks/') && request.method === 'DELETE') {
        const decoded = verifyJwtToken(request.headers.get('Authorization'));
        if (!decoded) {
          return jsonResponse({ success: false, error: 'Unauthorized' }, 401, corsHeaders);
        }
        const taskId = pathname.replace('/api/tasks/', '');
        const deleted = db.deleteTask(taskId, decoded.id);
        if (!deleted) {
          return jsonResponse({ success: false, error: 'Task not found or unauthorized' }, 404, corsHeaders);
        }
        return jsonResponse({ success: true, message: 'Task deleted successfully' }, 200, corsHeaders);
      }

      // 11. Categories (GET /api/categories & POST /api/categories)
      if (pathname === '/api/categories' && request.method === 'GET') {
        const decoded = verifyJwtToken(request.headers.get('Authorization'));
        if (!decoded) return jsonResponse({ success: false, error: 'Unauthorized' }, 401, corsHeaders);
        return jsonResponse(db.getCategories(decoded.id), 200, corsHeaders);
      }
      if (pathname === '/api/categories' && request.method === 'POST') {
        const decoded = verifyJwtToken(request.headers.get('Authorization'));
        if (!decoded) return jsonResponse({ success: false, error: 'Unauthorized' }, 401, corsHeaders);
        const body = await request.json().catch(() => ({}));
        if (!body.name || !body.name.trim()) return jsonResponse({ success: false, error: 'Name is required' }, 400, corsHeaders);
        const newCat = { id: crypto.randomUUID(), user_id: decoded.id, name: body.name.trim(), color: body.color || '#6366f1' };
        db.createCategory(newCat);
        return jsonResponse(newCat, 201, corsHeaders);
      }

      // Catch-all Section 6: Any unmatched /api/* route ALWAYS returns JSON 404 (NEVER index.html)
      return jsonResponse({
        success: false,
        error: 'API route not found'
      }, 404, corsHeaders);

    } catch (err) {
      return jsonResponse({
        success: false,
        error: err.message || 'An unexpected server error occurred'
      }, 500, corsHeaders);
    }
  }

  // Non-API requests (static SPA frontend)
  if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
    return env.ASSETS.fetch(request);
  }

  return new Response('Not Found', { status: 404 });
}

export default {
  async fetch(request, env, ctx) {
    return handleWorkerFetch(request, env);
  }
};
