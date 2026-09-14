import { storageService } from './storageService';
import { cloudBackupService } from './cloudBackupService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'taskpulse_jwt_token';

export const apiClient = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
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

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        throw new Error(`API endpoint ${API_BASE}${endpoint} returned HTML instead of JSON. Ensure backend API server is running on http://localhost:5000.`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        console.warn(`[Cloud Backup Failover] Primary API endpoint ${API_BASE}${endpoint} unreachable.`);
      }
      throw err;
    }
  },

  // Auth Methods
  async loginWithGoogle(googleProfile) {
    try {
      const data = await this.request('/auth/google', {
        method: 'POST',
        body: JSON.stringify(googleProfile)
      });
      this.setToken(data.token);
      return data;
    } catch (err) {
      console.warn('[Google Auth Offline Failover] API backend unavailable. Creating local session.');
      const offlineToken = `google_token_${Date.now()}`;
      this.setToken(offlineToken);
      return {
        token: offlineToken,
        user: {
          id: googleProfile.googleId || `usr_${Date.now()}`,
          name: googleProfile.name || googleProfile.email?.split('@')[0] || 'User',
          email: googleProfile.email,
          avatar: googleProfile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${googleProfile.email}`,
          role: 'user',
          created_at: new Date().toISOString()
        },
        message: 'Signed in with local failover session'
      };
    }
  },

  async register(name, email, password, confirmPassword) {
    try {
      const data = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, confirmPassword })
      });
      if (data.token) this.setToken(data.token);
      return data;
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        throw err;
      }
      console.warn('[Offline Failover] Registering user in local offline storage mode.');
      const localToken = `token_${Date.now()}`;
      this.setToken(localToken);
      return {
        token: localToken,
        user: { id: `usr_${Date.now()}`, name, email, provider: 'email', email_verified: false, role: 'user', created_at: new Date().toISOString() },
        requiresVerification: true
      };
    }
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
    try {
      const data = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data.token) this.setToken(data.token);
      return data;
    } catch (err) {
      if (err.message && (err.message.includes('Invalid') || err.message.includes('Incorrect') || err.message.includes('verify'))) {
        throw err;
      }
      console.warn('[Offline Failover] Logging in user in local offline storage mode.');
      const localToken = `token_${Date.now()}`;
      this.setToken(localToken);
      return {
        token: localToken,
        user: { id: `usr_${Date.now()}`, name: email.split('@')[0], email, provider: 'email', email_verified: true, role: 'user', created_at: new Date().toISOString() }
      };
    }
  },

  async getMe() {
    try {
      return await this.request('/auth/me');
    } catch (err) {
      console.warn('[Offline Failover] API server offline. Using local cached session.');
      const token = this.getToken();
      if (!token) return null;
      
      // Load actual cached user from localStorage
      try {
        const cachedUser = JSON.parse(localStorage.getItem('taskpulse_user_v2'));
        if (cachedUser && cachedUser.email) {
          return { user: cachedUser };
        }
      } catch (e) {}

      return null;
    }
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
