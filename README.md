# DO THIS — Production Task & Cloud Sync Suite

**DO THIS** is a modern, high-performance multi-device productivity application built with React, Vite, Tailwind CSS, Express, and SQLite database storage (`better-sqlite3`).

---

## 🔒 Production Security & Architecture

```text
Google / Identity Provider
          ↓
Cryptographically Signed ID Token
          ↓
Server Verification (google-auth-library OAuth2Client.verifyIdToken)
          ↓
Canonical Application User (users.google_id link)
          ↓
Internal Application User ID (users.id)
          ↓
Session JWT (Authorization: Bearer <token>)
          ↓
Authenticated REST API (Express + PRAGMA foreign_keys = ON)
          ↓
SQLite Database (database.sqlite with WAL mode)
          ↓
Strict Task Ownership (WHERE user_id = authenticated user.id)
```

---

## 🌟 Key Architectural Guarantees

1. **Cryptographic Google Token Verification**:
   - Google authentication uses official Google Identity Services (GIS) ID token credentials.
   - `POST /api/auth/google` verifies the ID token server-side using `google-auth-library` (`OAuth2Client.verifyIdToken`).
   - Unverified identity claims, raw emails, or client-crafted payloads are rejected with `HTTP 401`.

2. **Canonical Account Linking & Internal Identity**:
   - The system maintains a distinct separation between external Google `sub` identity (`users.google_id`) and internal application user ID (`users.id`).
   - When a user logs in with Google using a verified email matching an existing account, the Google identity (`google_id`) is linked to their existing application account.
   - **Internal `users.id` is preserved**, keeping all pre-existing tasks, categories, and workspace data intact under `tasks.user_id = user.id`.

3. **Strict Server-Side Task Ownership Isolation**:
   - `POST /api/tasks` assigns `task.user_id = req.user.id` from the verified server JWT. Any client-supplied `user_id` or `owner_id` fields are stripped.
   - `GET /api/tasks` queries SQLite `WHERE user_id = req.user.id`.
   - `PUT /api/tasks/:id` and `DELETE /api/tasks/:id` enforce `WHERE id = ? AND user_id = req.user.id`, preventing cross-user task modification or deletion.

4. **Database as Single Source of Truth**:
   - All tasks are stored in SQLite (`server/database.sqlite`) with WAL mode (`journal_mode = WAL`), foreign keys enabled (`PRAGMA foreign_keys = ON`), and busy timeout protection (`PRAGMA busy_timeout = 5000`).
   - Tasks are synced across devices in real time via Server-Sent Events (`/api/sync/stream`) and background polling.

5. **Multi-Origin CORS Protection**:
   - Configurable `ALLOWED_ORIGINS` environment variable handles comma-separated frontend origins. Offending origins are logged server-side on rejection.

---

## 🛠️ Local Setup & Development

### 1. Prerequisites
- Node.js 18 or higher installed on your system.

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure `.env` contains your allowed origins and strong JWT secret:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:5000,https://do-this.netlify.app
JWT_SECRET=your_super_secret_random_key_32chars_min
PORT=5000
VITE_GOOGLE_CLIENT_ID=1005301953165-6crod6p1tt7m2h2qck0km5s6ibjj9mmd.apps.googleusercontent.com
```

### 4. Running Dev Servers
```bash
# Terminal 1: Start Express API Backend (Port 5000)
npm run server

# Terminal 2: Start Vite Frontend (Port 3000)
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🧪 Testing & Verification

### Automated Hardening & Isolation Test Suite
Run the automated test suite to verify database migrations, Google account linking, JWT verification, and cross-user task isolation:
```bash
node scripts/test-hardening.js
```

### Production Build
```bash
npm run build
```

---

## 📄 Database Schema & Auto-Migration

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  google_id TEXT UNIQUE,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  avatar TEXT,
  provider TEXT,
  email_verified INTEGER DEFAULT 0,
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expires INTEGER,
  theme_preference TEXT DEFAULT 'dark',
  role TEXT DEFAULT 'user',
  created_at TEXT,
  updated_at TEXT,
  last_login TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT,
  status TEXT,
  dueDate TEXT,
  dueTime TEXT,
  recurrence TEXT,
  completed INTEGER DEFAULT 0,
  archived INTEGER DEFAULT 0,
  subtasks TEXT,
  enableEmailReminder INTEGER DEFAULT 0,
  emailNotification INTEGER DEFAULT 0,
  lastNotifiedTime TEXT,
  createdAt TEXT,
  updated_at TEXT,
  version INTEGER DEFAULT 1,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
```

---

## 🚀 Production Google OAuth Setup Requirements

In Google Cloud Console under **APIs & Services > Credentials > OAuth 2.0 Client IDs**:

1. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `http://localhost:5000`
   - `https://do-this.netlify.app` (and your production frontend domain)
2. Ensure `ALLOWED_ORIGINS` in production server environment matches all frontend origins.
