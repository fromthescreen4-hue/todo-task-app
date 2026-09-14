/**
 * Shared Link Service
 * Generates and parses encoded task/event sharing links.
 */
export const shareService = {
  // Generate encoded share URL for a task
  generateShareLink(task, permission = 'view') {
    const payload = {
      id: task.id,
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || '',
      dueTime: task.dueTime || '',
      priority: task.priority || 'medium',
      category: task.category || 'Shared Events',
      subtasks: task.subtasks || [],
      sharedBy: 'Alex Morgan',
      permission, // 'view' or 'edit'
      createdAt: new Date().toISOString()
    };

    const encoded = encodeURIComponent(btoa(JSON.stringify(payload)));
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#share=${encoded}`;
  },

  // Parse share token from URL hash (e.g. #share=eyJ...)
  parseShareTokenFromUrl() {
    try {
      const hash = window.location.hash;
      if (!hash || !hash.includes('#share=')) return null;

      const rawToken = hash.split('#share=')[1];
      if (!rawToken) return null;

      const decodedJson = atob(decodeURIComponent(rawToken));
      const sharedTask = JSON.parse(decodedJson);
      return sharedTask;
    } catch (err) {
      console.error('Failed to parse shared task URL token', err);
      return null;
    }
  },

  clearShareHashFromUrl() {
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } else {
      window.location.hash = '';
    }
  }
};
