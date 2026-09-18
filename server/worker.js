import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'c7b949e29f3d1b827e8a946b5a329e41d8a2f5c1e792b0473a8190d65e4f21c8e3901b2a7594d21f86c390b1e4a7d259';

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

// In-Memory Database Store for Cloudflare Worker Isolates
const memoryUsers = new Map();
const memoryTasks = new Map();
const memoryCategories = new Map();

function verifyJwtToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export async function handleWorkerFetch(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Intercept all /api routes BEFORE static assets
  if (pathname.startsWith('/api/') || pathname === '/api') {
    const corsHeaders = getCorsHeaders(request);

    // 1. Handle CORS Preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    try {
      // 2. Health Check Endpoint (GET /api/health) — MUST RETURN JSON HTTP 200
      if (pathname === '/api/health' && request.method === 'GET') {
        return jsonResponse({
          ok: true,
          service: 'todo-task-app-api',
          status: 'ok',
          version: '2.0.0-prod',
          timestamp: new Date().toISOString()
        }, 200, corsHeaders);
      }

      // 3. Google OAuth Endpoint (POST /api/auth/google)
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

        const email = verifiedPayload.email.trim().toLowerCase();
        const googleSub = verifiedPayload.sub;
        const name = verifiedPayload.name || verifiedPayload.given_name || email.split('@')[0];
        const avatar = verifiedPayload.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

        let user = Array.from(memoryUsers.values()).find(u => u.google_id === googleSub || u.email === email);

        if (!user) {
          const userId = crypto.randomUUID();
          const createdAt = new Date().toISOString();
          user = {
            id: userId,
            google_id: googleSub,
            name: name,
            email: email,
            avatar: avatar,
            provider: 'google',
            email_verified: true,
            theme_preference: 'dark',
            role: 'user',
            created_at: createdAt,
            last_login: createdAt
          };
          memoryUsers.set(userId, user);
        }

        const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        return jsonResponse({
          success: true,
          token: jwtToken,
          user: user,
          message: 'Google Account authenticated successfully'
        }, 200, corsHeaders);
      }

      // 4. Email Register (POST /api/auth/register)
      if (pathname === '/api/auth/register' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const { name, email, password } = body;
        if (!name || !email || !password) {
          return jsonResponse({ success: false, error: 'Full name, email address, and password are required' }, 400, corsHeaders);
        }
        const cleanEmail = email.trim().toLowerCase();
        const userId = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        const user = {
          id: userId,
          name: name.trim(),
          email: cleanEmail,
          provider: 'email',
          email_verified: true,
          theme_preference: 'dark',
          role: 'user',
          created_at: createdAt,
          last_login: createdAt
        };
        memoryUsers.set(userId, user);

        const jwtToken = jwt.sign({ id: userId, email: cleanEmail }, JWT_SECRET, { expiresIn: '7d' });
        return jsonResponse({
          success: true,
          token: jwtToken,
          user: user,
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
        let user = Array.from(memoryUsers.values()).find(u => u.email === cleanEmail);
        if (!user) {
          const userId = crypto.randomUUID();
          user = {
            id: userId,
            name: cleanEmail.split('@')[0],
            email: cleanEmail,
            provider: 'email',
            email_verified: true,
            theme_preference: 'dark',
            role: 'user',
            created_at: new Date().toISOString()
          };
          memoryUsers.set(userId, user);
        }
        const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        return jsonResponse({
          success: true,
          token: jwtToken,
          user: user,
          message: 'Signed in successfully'
        }, 200, corsHeaders);
      }

      // 6. User Profile Check (GET /api/auth/me)
      if (pathname === '/api/auth/me' && request.method === 'GET') {
        const decoded = verifyJwtToken(request.headers.get('Authorization'));
        if (!decoded) return jsonResponse({ success: false, error: 'Unauthorized' }, 401, corsHeaders);
        const user = memoryUsers.get(decoded.id) || { id: decoded.id, email: decoded.email, isLoggedIn: true };
        return jsonResponse({ success: true, user }, 200, corsHeaders);
      }

      // 7. Get Tasks (GET /api/tasks)
      if (pathname === '/api/tasks' && request.method === 'GET') {
        const decoded = verifyJwtToken(request.headers.get('Authorization'));
        if (!decoded) return jsonResponse({ success: false, error: 'Unauthorized' }, 401, corsHeaders);
        const userTasks = Array.from(memoryTasks.values()).filter(t => t.user_id === decoded.id);
        return jsonResponse(userTasks, 200, corsHeaders);
      }

      // 8. Create Task (POST /api/tasks)
      if (pathname === '/api/tasks' && request.method === 'POST') {
        const decoded = verifyJwtToken(request.headers.get('Authorization'));
        if (!decoded) return jsonResponse({ success: false, error: 'Unauthorized' }, 401, corsHeaders);
        const body = await request.json().catch(() => ({}));
        const taskId = body.id || crypto.randomUUID();
        const newTask = {
          ...body,
          id: taskId,
          user_id: decoded.id,
          createdAt: new Date().toISOString()
        };
        memoryTasks.set(taskId, newTask);
        return jsonResponse(newTask, 201, corsHeaders);
      }

      // 9. Update Task (PUT / PATCH /api/tasks/:id)
      if (pathname.startsWith('/api/tasks/') && (request.method === 'PUT' || request.method === 'PATCH')) {
        const decoded = verifyJwtToken(request.headers.get('Authorization'));
        if (!decoded) return jsonResponse({ success: false, error: 'Unauthorized' }, 401, corsHeaders);
        const taskId = pathname.replace('/api/tasks/', '');
        const existing = memoryTasks.get(taskId);
        const body = await request.json().catch(() => ({}));
        const updated = { ...existing, ...body, user_id: decoded.id, id: taskId };
        memoryTasks.set(taskId, updated);
        return jsonResponse({ success: true, task: updated }, 200, corsHeaders);
      }

      // 10. Reset User Tasks (DELETE /api/tasks/reset)
      if (pathname === '/api/tasks/reset' && (request.method === 'DELETE' || request.method === 'POST')) {
        const decoded = verifyJwtToken(request.headers.get('Authorization'));
        if (!decoded) return jsonResponse({ success: false, error: 'Unauthorized' }, 401, corsHeaders);
        for (const [id, task] of memoryTasks.entries()) {
          if (task.user_id === decoded.id) {
            memoryTasks.delete(id);
          }
        }
        return jsonResponse({ success: true, message: 'All user tasks reset cleanly' }, 200, corsHeaders);
      }

      // 11. Delete Task (DELETE /api/tasks/:id)
      if (pathname.startsWith('/api/tasks/') && request.method === 'DELETE') {
        const decoded = verifyJwtToken(request.headers.get('Authorization'));
        if (!decoded) return jsonResponse({ success: false, error: 'Unauthorized' }, 401, corsHeaders);
        const taskId = pathname.replace('/api/tasks/', '');
        memoryTasks.delete(taskId);
        return jsonResponse({ success: true, message: 'Task deleted' }, 200, corsHeaders);
      }

      // Catch-all: Any unmatched /api/* route ALWAYS returns JSON 404 (NEVER index.html)
      return jsonResponse({
        success: false,
        error: 'API route not found'
      }, 404, corsHeaders);

    } catch (err) {
      return jsonResponse({
        success: false,
        error: err.message || 'Server error'
      }, 500, corsHeaders);
    }
  }

  // Delegate non-API requests to static frontend assets (dist/index.html)
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
