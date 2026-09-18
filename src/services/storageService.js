// LocalStorage Keys
const STORAGE_KEYS = {
  TASKS: 'taskpulse_tasks_v2',
  CATEGORIES: 'taskpulse_categories_v2',
  USER: 'taskpulse_user_v2',
  SETTINGS: 'taskpulse_settings_v2',
  NOTIFICATIONS: 'taskpulse_notifications_v2',
  ARCHIVED: 'taskpulse_archived_v2'
};

const DEFAULT_USER = {
  isLoggedIn: false
};

const DEFAULT_CATEGORIES = [
  { id: 'cat_work', name: 'Work', color: '#6366f1', icon: 'Briefcase' },
  { id: 'cat_personal', name: 'Personal', color: '#ec4899', icon: 'User' },
  { id: 'cat_shopping', name: 'Shopping', color: '#10b981', icon: 'ShoppingCart' },
  { id: 'cat_fitness', name: 'Fitness & Health', color: '#f59e0b', icon: 'Activity' },
  { id: 'cat_events', name: 'Shared Events', color: '#38bdf8', icon: 'Calendar' }
];

export const TASK_STORAGE_VERSION = 'database-v2';

const DEFAULT_TASKS = [];

export const storageService = {
  purgeLegacyTaskCache() {
    try {
      localStorage.removeItem(STORAGE_KEYS.TASKS);
      localStorage.removeItem(STORAGE_KEYS.ARCHIVED);
      localStorage.removeItem('dothis_tasks_v1');
      localStorage.removeItem('dothis_tasks_cache');
      localStorage.setItem('dothis_storage_version', TASK_STORAGE_VERSION);
    } catch (err) {}
  },

  getTasks() {
    this.purgeLegacyTaskCache();
    return [];
  },

  saveTasks() {
    this.purgeLegacyTaskCache();
  },

  getCategories() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategories(categories) {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (err) {
      console.error('Failed to save categories', err);
    }
  },

  getUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  },

  saveUser(user) {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (err) {
      console.error('Failed to save user profile', err);
    }
  },

  exportBackupJSON(tasks, categories) {
    const payload = {
      app: 'TaskPulse',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      tasks,
      categories
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TaskPulse_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
