import { storageService } from './storageService';
import { cloudBackupService } from './cloudBackupService';

export function getApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) {
    const raw = import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '');
    return raw.endsWith('/api') ? raw : `${raw}/api`;
  }
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    // On dev server running locally on custom port (e.g. 5173, 3000, 4173)
    if (port === '5173' || port === '3000' || port === '4173') {
      return `${protocol}//${hostname}:5000/api`;
    }
  }
  // Canonical Production API URL for both Netlify (do-this.netlify.app) and Cloudflare Worker (todo-task-app.dothis-v2.workers.dev)
  return 'https://todo-task-app.dothis-v2.workers.dev/api';
}

const API_BASE = getApiBaseUrl();
const TOKEN_KEY = 'taskpulse_jwt_token';

export const apiClient = {
  getToken() {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? raw.trim() : null;
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token.trim());
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = `${API_BASE}${cleanEndpoint}`;

    try {
      const res = await fetch(fullUrl, { ...options, headers });
      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();

      // Section 14 — Safely verify Content-Type & body before parsing JSON
      const isJson = contentType.includes('application/json') || (text.trim().startsWith('{') || text.trim().startsWith('['));

      if (!isJson) {
        if (import.meta.env.DEV) {
          console.error(`[API Router Error] ${res.status} from ${fullUrl}. Unexpected non-JSON response.`);
        }
        const htmlErr = new Error('Backend returned an unexpected HTML response.');
        htmlErr.isHtmlResponse = true;
        htmlErr.status = res.status;
        htmlErr.apiUrl = API_BASE;
        throw htmlErr;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        if (import.meta.env.DEV) {
          console.error(`[API JSON Parse Error] ${res.status} from ${fullUrl}`);
        }
        const parseErr = new Error('Backend returned an unexpected HTML response.');
        parseErr.isHtmlResponse = true;
        parseErr.status = res.status;
        throw parseErr;
      }

      if (res.status === 401 || res.status === 403) {
        this.setToken(null);
        localStorage.removeItem('taskpulse_user_v2');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('dothis_auth_expired'));
        }
        const authErr = new Error(data.error || 'Session expired or unauthorized. Please sign in again.');
        authErr.isAuthError = true;
        authErr.status = res.status;
        throw authErr;
      }

      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && (err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed'))) {
        if (import.meta.env.DEV) {
          console.error(`[API Network Error] Server endpoint ${fullUrl} unreachable.`);
        }
        const networkErr = new Error(`Failed to fetch: Unable to reach backend API (${API_BASE}). Please check your connection.`);
        networkErr.isNetworkError = true;
        networkErr.apiUrl = API_BASE;
        throw networkErr;
      }
      throw err;
    }
  },

  // SSE Live Sync Stream Subscription helper
  subscribeToLiveSync(onMessage) {
    const token = this.getToken();
    if (!token) return () => {};

    try {
      const streamUrl = `${API_BASE}/sync/stream?token=${encodeURIComponent(token)}`;
      const eventSource = new EventSource(streamUrl);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) onMessage(data);
        } catch (e) {}
      };

      return () => {
        eventSource.close();
      };
    } catch (e) {
      return () => {};
    }
  },

  // Auth Methods
  async loginWithGoogle(googleProfile) {
    const idToken = typeof googleProfile === 'string' ? googleProfile : (googleProfile?.idToken || googleProfile?.credential || googleProfile?.token);
    const body = idToken ? { idToken } : googleProfile;

    const data = await this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    if (data.token) this.setToken(data.token);
    return data;
  },

  async register(name, email, password, confirmPassword) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirmPassword })
    });
    if (data.token) this.setToken(data.token);
    return data;
  },

  async verifyEmail(token, email = null) {
    const data = await this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token, email })
    });
    if (data.token) this.setToken(data.token);
    return data;
  },

  async resendVerification(email) {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) this.setToken(data.token);
    return data;
  },

  async getMe() {
    return this.request('/auth/me');
  },

  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async resetPassword(token, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
  },

  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  async updateProfile(name, avatar) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, avatar })
    });
  },

  async updateThemePreference(themePreference) {
    return this.request('/users/theme', {
      method: 'PUT',
      body: JSON.stringify({ theme_preference: themePreference })
    });
  },

  async deleteAccount() {
    const res = await this.request('/users/account', { method: 'DELETE' });
    this.setToken(null);
    return res;
  },

  // Tasks Methods
  async getTasks() {
    return this.request('/tasks');
  },

  async createTask(taskData) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  },

  async updateTask(id, taskData) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    });
  },

  async deleteTask(id) {
    return this.request(`/tasks/${id}`, { method: 'DELETE' });
  },

  async resetUserTasks() {
    return this.request('/tasks/reset', { method: 'DELETE' });
  },

  // Categories Methods
  async getCategories() {
    return this.request('/categories');
  },

  async createCategory(name, color) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, color })
    });
  },

  // Feedback Method
  async sendFeedback(subject, message, email = null) {
    return this.request('/feedback', {
      method: 'POST',
      body: JSON.stringify({ subject, message, email, appVersion: 'v2.0.0-prod' })
    });
  }
};
