const BACKUP_KEY = 'taskpulse_cloud_backup_v2';
const QUEUE_KEY = 'taskpulse_pending_sync_queue';

export const cloudBackupService = {
  getBackupTasks() {
    try {
      const data = localStorage.getItem(BACKUP_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveBackupTasks(tasks) {
    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Backup save error', e);
    }
  },

  getSyncQueue() {
    try {
      const data = localStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  enqueuePendingAction(action) {
    const queue = this.getSyncQueue();
    queue.push({ id: 'action_' + Date.now(), ...action, timestamp: new Date().toISOString() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  clearSyncQueue() {
    localStorage.removeItem(QUEUE_KEY);
  }
};
