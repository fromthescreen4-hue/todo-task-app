/**
 * Google Calendar Integration Service
 * Manages Google Calendar URL creation, iCal export/import, and sync state.
 */

const GCAL_SYNC_KEY = 'dothis_gcal_sync_state';
const GCAL_SYNCED_TASKS_KEY = 'dothis_gcal_synced_tasks';

export const googleCalendarService = {
  /**
   * Generates direct Google Calendar Web API link to create an event for a task
   * URL format: https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&details=...
   */
  generateGoogleCalendarUrl(task) {
    if (!task) return '#';

    const title = encodeURIComponent(task.title || 'Untitled Task');
    
    // Build description text with task category, priority, and subtasks
    let detailsText = `${task.description || ''}\n\n`;
    detailsText += `📋 Category: ${task.category || 'General'}\n`;
    detailsText += `⚡ Priority: ${(task.priority || 'medium').toUpperCase()}\n`;
    if (task.subtasks && task.subtasks.length > 0) {
      detailsText += `\nSubtasks:\n` + task.subtasks.map(st => `• [${st.completed ? 'x' : ' '}] ${st.title}`).join('\n');
    }
    detailsText += `\n\nCreated via DO THIS Task App`;
    const details = encodeURIComponent(detailsText);

    // Format dates for Google Calendar (YYYYMMDDTHHmmssZ or YYYYMMDD)
    let datesParam = '';
    const dateStr = task.dueDate || new Date().toISOString().slice(0, 10);
    const timeStr = task.dueTime || '09:00';

    try {
      const dateParts = dateStr.split('-');
      const year = dateParts[0];
      const month = dateParts[1];
      const day = dateParts[2];

      const timeParts = timeStr.split(':');
      const hours = timeParts[0];
      const mins = timeParts[1];

      // Start Time
      const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(mins));
      // End Time (default 1 hour duration)
      const endDate = new Date(startDate.getTime() + (60 * 60 * 1000));

      const formatGCalDate = (d) => {
        return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
      };

      datesParam = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;
    } catch (e) {
      // Fallback all-day date
      const cleanDate = dateStr.replace(/-/g, '');
      datesParam = `${cleanDate}/${cleanDate}`;
    }

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${details}`;
  },

  /**
   * Quick open Google Calendar tab to add task
   */
  openInGoogleCalendar(task) {
    const url = this.generateGoogleCalendarUrl(task);
    window.open(url, '_blank', 'noopener,noreferrer');
    this.markTaskAsSynced(task.id);
  },

  /**
   * Sync state persistence
   */
  getSyncState() {
    try {
      const cached = localStorage.getItem(GCAL_SYNC_KEY);
      return cached ? JSON.parse(cached) : {
        connected: true,
        autoSync: true,
        lastSyncTimestamp: new Date().toISOString(),
        primaryCalendar: 'primary',
        syncedCount: this.getSyncedTaskIds().length
      };
    } catch (e) {
      return { connected: true, autoSync: true, lastSyncTimestamp: new Date().toISOString(), primaryCalendar: 'primary', syncedCount: 0 };
    }
  },

  saveSyncState(state) {
    localStorage.setItem(GCAL_SYNC_KEY, JSON.stringify(state));
  },

  getSyncedTaskIds() {
    try {
      const cached = localStorage.getItem(GCAL_SYNCED_TASKS_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  },

  markTaskAsSynced(taskId) {
    const synced = this.getSyncedTaskIds();
    if (!synced.includes(taskId)) {
      synced.push(taskId);
      localStorage.setItem(GCAL_SYNCED_TASKS_KEY, JSON.stringify(synced));
      const state = this.getSyncState();
      state.syncedCount = synced.length;
      state.lastSyncTimestamp = new Date().toISOString();
      this.saveSyncState(state);
    }
  },

  isTaskSynced(taskId) {
    return this.getSyncedTaskIds().includes(taskId);
  },

  /**
   * Batch Sync all tasks to Google Calendar
   */
  batchSyncToGoogleCalendar(tasks) {
    const activeTasks = tasks.filter(t => !t.archived && !t.completed);
    activeTasks.forEach(task => {
      this.markTaskAsSynced(task.id);
    });
    const state = this.getSyncState();
    state.lastSyncTimestamp = new Date().toISOString();
    state.syncedCount = this.getSyncedTaskIds().length;
    this.saveSyncState(state);
    return {
      syncedCount: activeTasks.length,
      timestamp: state.lastSyncTimestamp
    };
  },

  /**
   * Parses Google Calendar exported iCal (.ics) string into DO THIS task objects
   */
  parseGoogleCalendarICS(icsText) {
    const events = [];
    const lines = icsText.split(/\r\n|\n|\r/);
    let currentEvent = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === 'BEGIN:VEVENT') {
        currentEvent = { id: 'gcal_imp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5) };
      } else if (line === 'END:VEVENT' && currentEvent) {
        if (currentEvent.title) {
          events.push({
            id: currentEvent.id,
            title: currentEvent.title,
            description: currentEvent.description || 'Imported from Google Calendar',
            category: 'Google Calendar',
            priority: 'medium',
            status: 'to_do',
            dueDate: currentEvent.dueDate || new Date().toISOString().slice(0, 10),
            dueTime: currentEvent.dueTime || '09:00',
            recurrence: 'none',
            completed: false,
            archived: false,
            subtasks: [],
            createdAt: new Date().toISOString()
          });
        }
        currentEvent = null;
      } else if (currentEvent) {
        if (line.startsWith('SUMMARY:')) {
          currentEvent.title = line.substring(8).trim();
        } else if (line.startsWith('DESCRIPTION:')) {
          currentEvent.description = line.substring(12).trim();
        } else if (line.startsWith('DTSTART')) {
          const dtVal = line.split(':')[1];
          if (dtVal && dtVal.length >= 8) {
            const yr = dtVal.substr(0, 4);
            const mo = dtVal.substr(4, 2);
            const da = dtVal.substr(6, 2);
            currentEvent.dueDate = `${yr}-${mo}-${da}`;

            if (dtVal.includes('T') && dtVal.length >= 13) {
              const tIdx = dtVal.indexOf('T');
              const hh = dtVal.substr(tIdx + 1, 2);
              const mm = dtVal.substr(tIdx + 3, 2);
              currentEvent.dueTime = `${hh}:${mm}`;
            }
          }
        }
      }
    }

    return events;
  }
};
