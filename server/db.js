import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let __dirname = '.';
try {
  if (import.meta && import.meta.url && typeof import.meta.url === 'string' && import.meta.url.startsWith('file:')) {
    const __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
  }
} catch (e) {
  __dirname = '.';
}

const SQLITE_FILE = path.join(__dirname, 'database.sqlite');
const sqliteDb = new Database(SQLITE_FILE);

// Enable PRAGMAs for high concurrency, performance, and relational integrity
sqliteDb.pragma('journal_mode = WAL');
sqliteDb.pragma('foreign_keys = ON');
sqliteDb.pragma('busy_timeout = 5000');

// Initialize Database Tables
sqliteDb.exec(`
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

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    subject TEXT,
    message TEXT,
    appVersion TEXT,
    created_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
  CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
`);

// Auto-migration for schema upgrades (Idempotent & non-destructive)
try {
  const userCols = sqliteDb.pragma('table_info(users)').map(c => c.name);
  if (!userCols.includes('google_id')) {
    sqliteDb.exec('ALTER TABLE users ADD COLUMN google_id TEXT');
  }

  const taskCols = sqliteDb.pragma('table_info(tasks)').map(c => c.name);
  if (!taskCols.includes('updated_at')) {
    sqliteDb.exec('ALTER TABLE tasks ADD COLUMN updated_at TEXT');
  }
  if (!taskCols.includes('version')) {
    sqliteDb.exec('ALTER TABLE tasks ADD COLUMN version INTEGER DEFAULT 1');
  }
} catch (e) {
  console.warn('[DB Migration Warning]', e.message);
}

// Create indices after table migrations
sqliteDb.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
`);

// Formatter Helpers
function formatUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    google_id: row.google_id || null,
    name: row.name,
    email: row.email,
    password_hash: row.password_hash,
    avatar: row.avatar,
    provider: row.provider,
    email_verified: Boolean(row.email_verified),
    verification_token: row.verification_token,
    reset_token: row.reset_token,
    reset_token_expires: row.reset_token_expires,
    theme_preference: row.theme_preference || 'dark',
    role: row.role || 'user',
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_login: row.last_login
  };
}

function formatTask(row) {
  if (!row) return null;
  let parsedSubtasks = [];
  try {
    parsedSubtasks = typeof row.subtasks === 'string' ? JSON.parse(row.subtasks) : (row.subtasks || []);
  } catch (e) {
    parsedSubtasks = [];
  }
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description || '',
    category: row.category || 'Work',
    priority: row.priority || 'medium',
    status: row.status || 'to_do',
    dueDate: row.dueDate || '',
    dueTime: row.dueTime || '09:00',
    recurrence: row.recurrence || 'none',
    completed: Boolean(row.completed),
    archived: Boolean(row.archived),
    subtasks: parsedSubtasks,
    enableEmailReminder: Boolean(row.enableEmailReminder),
    emailNotification: Boolean(row.emailNotification),
    lastNotifiedTime: row.lastNotifiedTime,
    createdAt: row.createdAt || row.created_at,
    updated_at: row.updated_at || row.createdAt || new Date().toISOString(),
    version: row.version || 1
  };
}

// One-time Migration from taskpulse_db.json if present
function migrateJsonDataIfNeeded() {
  const jsonPath = path.join(__dirname, 'taskpulse_db.json');
  if (!fs.existsSync(jsonPath)) return;

  const count = sqliteDb.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  if (count > 0) return;

  try {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(raw);
    console.log('[Migration] Migrating existing data from taskpulse_db.json to SQLite database...');

    const migrateTx = sqliteDb.transaction(() => {
      if (Array.isArray(data.users)) {
        for (const user of data.users) {
          sqliteDb.prepare(`
            INSERT OR IGNORE INTO users (id, name, email, password_hash, avatar, provider, email_verified, verification_token, reset_token, reset_token_expires, theme_preference, role, created_at, updated_at, last_login)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            user.id,
            user.name,
            user.email,
            user.password_hash || null,
            user.avatar || null,
            user.provider || 'email',
            user.email_verified ? 1 : 0,
            user.verification_token || null,
            user.reset_token || null,
            user.reset_token_expires || null,
            user.theme_preference || 'dark',
            user.role || 'user',
            user.created_at || new Date().toISOString(),
            user.updated_at || new Date().toISOString(),
            user.last_login || new Date().toISOString()
          );
        }
      }

      if (Array.isArray(data.tasks)) {
        for (const task of data.tasks) {
          sqliteDb.prepare(`
            INSERT OR IGNORE INTO tasks (id, user_id, title, description, category, priority, status, dueDate, dueTime, recurrence, completed, archived, subtasks, enableEmailReminder, emailNotification, lastNotifiedTime, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            task.id,
            task.user_id,
            task.title,
            task.description || '',
            task.category || 'Work',
            task.priority || 'medium',
            task.status || 'to_do',
            task.dueDate || '',
            task.dueTime || '09:00',
            task.recurrence || 'none',
            task.completed ? 1 : 0,
            task.archived ? 1 : 0,
            JSON.stringify(task.subtasks || []),
            (task.enableEmailReminder || task.emailNotification) ? 1 : 0,
            (task.emailNotification || task.enableEmailReminder) ? 1 : 0,
            task.lastNotifiedTime || null,
            task.createdAt || new Date().toISOString()
          );
        }
      }

      if (Array.isArray(data.categories)) {
        for (const category of data.categories) {
          sqliteDb.prepare(`
            INSERT OR IGNORE INTO categories (id, user_id, name, color)
            VALUES (?, ?, ?, ?)
          `).run(
            category.id,
            category.user_id,
            category.name,
            category.color || '#6366f1'
          );
        }
      }

      if (Array.isArray(data.feedback)) {
        for (const fb of data.feedback) {
          sqliteDb.prepare(`
            INSERT OR IGNORE INTO feedback (id, user_email, subject, message, appVersion, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            fb.id,
            fb.user_email || 'anonymous@user.app',
            fb.subject,
            fb.message,
            fb.appVersion || 'v2.0.0-prod',
            fb.created_at || new Date().toISOString()
          );
        }
      }
    });

    migrateTx();
    console.log('[Migration] Migration from JSON to SQLite completed successfully. Original taskpulse_db.json file left untouched.');
  } catch (err) {
    console.error('[Migration Error] Failed to migrate taskpulse_db.json into SQLite:', err);
  }
}

migrateJsonDataIfNeeded();

export const db = {
  // Users
  findUserByEmail(email) {
    if (!email) return null;
    const row = sqliteDb.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
    return formatUser(row);
  },

  findUserById(id) {
    if (!id) return null;
    const row = sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return formatUser(row);
  },

  findUserByGoogleId(googleId) {
    if (!googleId) return null;
    const row = sqliteDb.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
    return formatUser(row);
  },

  findUserByResetToken(token) {
    if (!token) return null;
    const row = sqliteDb.prepare('SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?').get(token, Date.now());
    return formatUser(row);
  },

  findUserByVerificationToken(token) {
    if (!token) return null;
    const row = sqliteDb.prepare('SELECT * FROM users WHERE verification_token = ?').get(token);
    return formatUser(row);
  },

  createUser(user) {
    sqliteDb.prepare(`
      INSERT INTO users (id, google_id, name, email, password_hash, avatar, provider, email_verified, verification_token, reset_token, reset_token_expires, theme_preference, role, created_at, updated_at, last_login)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.id,
      user.google_id || null,
      user.name,
      user.email,
      user.password_hash || null,
      user.avatar || null,
      user.provider || 'email',
      user.email_verified ? 1 : 0,
      user.verification_token || null,
      user.reset_token || null,
      user.reset_token_expires || null,
      user.theme_preference || 'dark',
      user.role || 'user',
      user.created_at || new Date().toISOString(),
      user.updated_at || new Date().toISOString(),
      user.last_login || new Date().toISOString()
    );
    return this.findUserById(user.id);
  },

  updateUser(id, updates) {
    const current = this.findUserById(id);
    if (!current) return null;
    const merged = { ...current, ...updates };
    sqliteDb.prepare(`
      UPDATE users SET
        google_id = ?, name = ?, email = ?, password_hash = ?, avatar = ?, provider = ?,
        email_verified = ?, verification_token = ?, reset_token = ?, reset_token_expires = ?,
        theme_preference = ?, role = ?, updated_at = ?, last_login = ?
      WHERE id = ?
    `).run(
      merged.google_id || null,
      merged.name,
      merged.email,
      merged.password_hash || null,
      merged.avatar || null,
      merged.provider || 'email',
      merged.email_verified ? 1 : 0,
      merged.verification_token || null,
      merged.reset_token || null,
      merged.reset_token_expires || null,
      merged.theme_preference || 'dark',
      merged.role || 'user',
      merged.updated_at || new Date().toISOString(),
      merged.last_login || new Date().toISOString(),
      id
    );
    return this.findUserById(id);
  },

  deleteUser(id) {
    const deleteTx = sqliteDb.transaction((userId) => {
      sqliteDb.prepare('DELETE FROM users WHERE id = ?').run(userId);
      sqliteDb.prepare('DELETE FROM tasks WHERE user_id = ?').run(userId);
      sqliteDb.prepare('DELETE FROM categories WHERE user_id = ?').run(userId);
    });
    deleteTx(id);
  },

  // Tasks
  getTasks(userId) {
    const rows = sqliteDb.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY createdAt DESC').all(userId);
    return rows.map(formatTask);
  },

  getTaskById(id, userId) {
    const row = sqliteDb.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, userId);
    return formatTask(row);
  },

  createTask(task) {
    const now = new Date().toISOString();
    const version = task.version || 1;
    sqliteDb.prepare(`
      INSERT OR REPLACE INTO tasks (id, user_id, title, description, category, priority, status, dueDate, dueTime, recurrence, completed, archived, subtasks, enableEmailReminder, emailNotification, lastNotifiedTime, createdAt, updated_at, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      task.id,
      task.user_id,
      task.title,
      task.description || '',
      task.category || 'Work',
      task.priority || 'medium',
      task.status || 'to_do',
      task.dueDate || '',
      task.dueTime || '09:00',
      task.recurrence || 'none',
      task.completed ? 1 : 0,
      task.archived ? 1 : 0,
      JSON.stringify(task.subtasks || []),
      (task.enableEmailReminder || task.emailNotification) ? 1 : 0,
      (task.emailNotification || task.enableEmailReminder) ? 1 : 0,
      task.lastNotifiedTime || null,
      task.createdAt || now,
      task.updated_at || now,
      version
    );
    return this.getTaskById(task.id, task.user_id);
  },

  updateTask(id, userId, updates) {
    const current = this.getTaskById(id, userId);
    if (!current) return null;

    const now = new Date().toISOString();
    const nextVersion = (current.version || 1) + 1;
    const merged = { ...current, ...updates, updated_at: now, version: nextVersion };

    sqliteDb.prepare(`
      UPDATE tasks SET
        title = ?, description = ?, category = ?, priority = ?, status = ?,
        dueDate = ?, dueTime = ?, recurrence = ?, completed = ?, archived = ?,
        subtasks = ?, enableEmailReminder = ?, emailNotification = ?, lastNotifiedTime = ?,
        updated_at = ?, version = ?
      WHERE id = ? AND user_id = ?
    `).run(
      merged.title,
      merged.description || '',
      merged.category || 'Work',
      merged.priority || 'medium',
      merged.status || 'to_do',
      merged.dueDate || '',
      merged.dueTime || '09:00',
      merged.recurrence || 'none',
      merged.completed ? 1 : 0,
      merged.archived ? 1 : 0,
      JSON.stringify(merged.subtasks || []),
      (merged.enableEmailReminder || merged.emailNotification) ? 1 : 0,
      (merged.emailNotification || merged.enableEmailReminder) ? 1 : 0,
      merged.lastNotifiedTime || null,
      merged.updated_at,
      merged.version,
      id,
      userId
    );
    return this.getTaskById(id, userId);
  },

  deleteTask(id, userId) {
    const result = sqliteDb.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(id, userId);
    return result.changes > 0;
  },

  clearUserTasks(userId) {
    const result = sqliteDb.prepare('DELETE FROM tasks WHERE user_id = ?').run(userId);
    return result.changes;
  },

  // Categories
  getCategories(userId) {
    return sqliteDb.prepare('SELECT id, user_id, name, color FROM categories WHERE user_id = ?').all(userId);
  },

  createCategory(category) {
    sqliteDb.prepare(`
      INSERT INTO categories (id, user_id, name, color)
      VALUES (?, ?, ?, ?)
    `).run(
      category.id,
      category.user_id,
      category.name,
      category.color || '#6366f1'
    );
    return category;
  },

  // Feedback
  createFeedback(fb) {
    sqliteDb.prepare(`
      INSERT INTO feedback (id, user_email, subject, message, appVersion, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      fb.id,
      fb.user_email || 'anonymous@user.app',
      fb.subject,
      fb.message,
      fb.appVersion || 'v2.0.0-prod',
      fb.created_at || new Date().toISOString()
    );
    return fb;
  }
};

console.log('[Database] SQLite Database Engine initialized at:', SQLITE_FILE);
