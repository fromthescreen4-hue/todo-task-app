import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'taskpulse_db.json');

// Default Database Data Structure
const DEFAULT_DATA = {
  users: [],
  tasks: [],
  categories: [],
  feedback: []
};

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('[Database Warning] Error loading db file, resetting to clean schema', err);
  }
  return { ...DEFAULT_DATA };
}

function saveDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Database Error] Failed to write database file', err);
  }
}

let dbState = loadDatabase();

export const db = {
  // Users
  findUserByEmail(email) {
    if (!email) return null;
    return dbState.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  findUserById(id) {
    return dbState.users.find(u => u.id === id) || null;
  },

  findUserByResetToken(token) {
    return dbState.users.find(u => u.reset_token === token && u.reset_token_expires > Date.now()) || null;
  },

  findUserByVerificationToken(token) {
    if (!token) return null;
    return dbState.users.find(u => u.verification_token === token) || null;
  },

  createUser(user) {
    dbState.users.push(user);
    saveDatabase(dbState);
    return user;
  },

  updateUser(id, updates) {
    const idx = dbState.users.findIndex(u => u.id === id);
    if (idx >= 0) {
      dbState.users[idx] = { ...dbState.users[idx], ...updates };
      saveDatabase(dbState);
      return dbState.users[idx];
    }
    return null;
  },

  deleteUser(id) {
    dbState.users = dbState.users.filter(u => u.id !== id);
    dbState.tasks = dbState.tasks.filter(t => t.user_id !== id);
    dbState.categories = dbState.categories.filter(c => c.user_id !== id);
    saveDatabase(dbState);
  },

  // Tasks (Enforces User Isolation)
  getTasks(userId) {
    return dbState.tasks.filter(t => t.user_id === userId);
  },

  getTaskById(id, userId) {
    return dbState.tasks.find(t => t.id === id && t.user_id === userId) || null;
  },

  createTask(task) {
    dbState.tasks.unshift(task);
    saveDatabase(dbState);
    return task;
  },

  updateTask(id, userId, updates) {
    const idx = dbState.tasks.findIndex(t => t.id === id && t.user_id === userId);
    if (idx >= 0) {
      dbState.tasks[idx] = { ...dbState.tasks[idx], ...updates };
      saveDatabase(dbState);
      return dbState.tasks[idx];
    }
    return null;
  },

  deleteTask(id, userId) {
    const initialLen = dbState.tasks.length;
    dbState.tasks = dbState.tasks.filter(t => !(t.id === id && t.user_id === userId));
    const deleted = dbState.tasks.length < initialLen;
    if (deleted) saveDatabase(dbState);
    return deleted;
  },

  // Categories
  getCategories(userId) {
    return dbState.categories.filter(c => c.user_id === userId);
  },

  createCategory(category) {
    dbState.categories.push(category);
    saveDatabase(dbState);
    return category;
  },

  // Feedback
  createFeedback(fb) {
    dbState.feedback.unshift(fb);
    saveDatabase(dbState);
    return fb;
  }
};

console.log('[Database] Pure JS Database Engine initialized at:', DB_FILE);
