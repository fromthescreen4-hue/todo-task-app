import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import TaskScreen from './components/TaskScreen';
import KanbanBoard from './components/KanbanBoard';
import CalendarScreen from './components/CalendarScreen';
import AnalyticsView from './components/AnalyticsView';
import TaskModal from './components/TaskModal';
import ShareModal from './components/ShareModal';
import SharedTaskViewerModal from './components/SharedTaskViewerModal';
import AuthModal from './components/AuthModal';
import CommandPaletteModal from './components/CommandPaletteModal';
import IntegrationsModal from './components/IntegrationsModal';
import FeedbackModal from './components/FeedbackModal';

import SplashScreen from './components/SplashScreen';
import OfflineErrorPage from './components/OfflineErrorPage';
import { storageService } from './services/storageService';
import { notificationService } from './services/notificationService';
import { shareService } from './services/shareService';
import { apiClient } from './services/apiClient';
import { cloudBackupService } from './services/cloudBackupService';

const liveSyncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('dothis_account_live_sync')
  : null;

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  // Network Connectivity State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [reconnectToastMsg, setReconnectToastMsg] = useState('');
  const [errorToastMsg, setErrorToastMsg] = useState('');
  const [isLocalOfflineMode, setIsLocalOfflineMode] = useState(false);

  const showErrorToast = (msg) => {
    setErrorToastMsg(msg || "Couldn't save changes — check your connection");
    setTimeout(() => setErrorToastMsg(''), 5000);
  };

  // State - Persistent User Session State
  const [user, setUser] = useState(() => {
    const cached = storageService.getUser();
    return cached?.isLoggedIn ? cached : { isLoggedIn: false };
  });

  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState(() => storageService.getCategories());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [apiConnected, setApiConnected] = useState(true);

  // Active Tab: 'tasks' | 'kanban' | 'calendar' | 'analytics'
  const [activeTab, setActiveTab] = useState('tasks');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [sharingTask, setSharingTask] = useState(null);
  const [sharedViewerTask, setSharedViewerTask] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Helper to notify multi-tab broadcast sync
  const notifyBroadcastSync = () => {
    try {
      if (liveSyncChannel) {
        liveSyncChannel.postMessage({ type: 'ACCOUNT_TASK_MUTATED', timestamp: Date.now() });
      }
    } catch (e) {}
  };

  // Helper to fetch live database tasks for registered user account
  const fetchAccountTasksFromDB = async () => {
    if (!apiClient.getToken()) return;
    try {
      const userTasks = await apiClient.getTasks();
      if (Array.isArray(userTasks)) {
        setTasks(prev => {
          const dbIds = new Set(userTasks.map(t => t.id));
          const pendingInFlight = prev.filter(t => 
            t._isPending && 
            !dbIds.has(t.id) && 
            (Date.now() - (t._createdAtMs || 0) < 15000)
          );
          return [...pendingInFlight, ...userTasks];
        });
      }
      const userCategories = await apiClient.getCategories();
      if (Array.isArray(userCategories) && userCategories.length > 0) {
        setCategories(userCategories);
      }
    } catch (e) {
      if (e?.isAuthError || e?.status === 401 || e?.status === 403) {
        handleLogout();
      } else {
        console.warn('[Account DB Sync] Unable to fetch live user tasks from database:', e);
      }
    }
  };

  // Network Connectivity Event Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setApiConnected(true);
      setReconnectToastMsg('⚡ Network Connection Restored! Syncing workspace data...');
      setIsOfflineModalOpen(false);
      fetchAccountTasksFromDB();
      setTimeout(() => setReconnectToastMsg(''), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsOfflineModalOpen(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Session Expiration Listener
  useEffect(() => {
    const handleAuthExpired = () => {
      setUser({ isLoggedIn: false });
      setTasks([]);
      setIsAuthModalOpen(true);
    };
    window.addEventListener('dothis_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('dothis_auth_expired', handleAuthExpired);
  }, []);

  // Session Initialization & Database Session Verification
  useEffect(() => {
    async function initSession() {
      const token = apiClient.getToken();
      if (token) {
        try {
          const meData = await apiClient.getMe();
          if (meData?.user) {
            const authUser = { ...meData.user, isLoggedIn: true };
            setUser(authUser);
            if (authUser.theme_preference) {
              setIsDarkMode(authUser.theme_preference === 'dark');
            }
            storageService.saveUser(authUser);
            setApiConnected(true);
            fetchAccountTasksFromDB();
            return;
          }
        } catch (err) {
          console.warn('[Session Verification Failed] Backend token invalid or server unavailable:', err);
        }
      }

      // Do NOT trust cached localStorage session without revalidating against backend getMe()
      apiClient.setToken(null);
      storageService.saveUser({ isLoggedIn: false });
      setUser({ isLoggedIn: false });
      setTasks([]);
      setIsAuthModalOpen(true);
    }

    initSession();
  }, []);

  // Instant Real-Time SSE Push, Polling & Multi-Tab Broadcast Sync Effect
  useEffect(() => {
    if (!user?.isLoggedIn) return;

    fetchAccountTasksFromDB();

    // 1. Instant Real-Time SSE Stream (<100ms Push across all devices logged into account)
    const unsubscribeSSE = apiClient.subscribeToLiveSync((event) => {
      if (
        event.type === 'task.created' ||
        event.type === 'task.updated' ||
        event.type === 'task.deleted' ||
        event.type === 'category.created' ||
        event.type === 'TASKS_MUTATED' ||
        event.type === 'CATEGORIES_MUTATED'
      ) {
        fetchAccountTasksFromDB();
      }
    });

    // 2. Poll SQLite database every 3 seconds for secondary backup sync
    const livePollInterval = setInterval(() => {
      fetchAccountTasksFromDB();
    }, 3000);

    // 3. Tab visibility / Window focus trigger
    const handleFocusSync = () => {
      fetchAccountTasksFromDB();
    };
    window.addEventListener('focus', handleFocusSync);
    document.addEventListener('visibilitychange', handleFocusSync);

    // 4. Multi-tab BroadcastChannel listener
    const handleBroadcastMessage = (event) => {
      if (event.data?.type === 'ACCOUNT_TASK_MUTATED') {
        fetchAccountTasksFromDB();
      }
    };
    if (liveSyncChannel) {
      liveSyncChannel.addEventListener('message', handleBroadcastMessage);
    }

    return () => {
      unsubscribeSSE();
      clearInterval(livePollInterval);
      window.removeEventListener('focus', handleFocusSync);
      document.removeEventListener('visibilitychange', handleFocusSync);
      if (liveSyncChannel) {
        liveSyncChannel.removeEventListener('message', handleBroadcastMessage);
      }
    };
  }, [user?.isLoggedIn]);

  useEffect(() => {
    if (user?.isLoggedIn) {
      storageService.saveCategories(categories);
      storageService.saveUser(user);
    }
  }, [categories, user]);

  // Dark Mode Toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = async () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    const prefStr = nextMode ? 'dark' : 'light';

    if (user?.isLoggedIn) {
      const updatedUser = { ...user, theme_preference: prefStr };
      setUser(updatedUser);
      storageService.saveUser(updatedUser);
      try {
        await apiClient.updateThemePreference(prefStr);
      } catch (err) {
        console.warn('Failed to persist theme preference:', err);
      }
    }
  };

  // Shared Token Listener
  useEffect(() => {
    const shared = shareService.parseShareTokenFromUrl();
    if (shared) {
      setSharedViewerTask(shared);
    }
  }, []);

  // Keyboard Shortcuts (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Background Reminder Scheduler
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      tasks.forEach(task => {
        if (!task.completed && !task.archived && task.dueDate === todayStr && task.dueTime === currentTimeStr) {
          if (!task.lastNotifiedTime || task.lastNotifiedTime !== currentTimeStr) {
            notificationService.sendWebNotification(`Task Due: ${task.title}`, {
              body: task.description || `Scheduled at ${task.dueTime}`
            });

            // ONLY send email notification if task email notification box was ticked
            if (task.enableEmailReminder || task.emailNotification) {
              notificationService.logEmailDispatch(
                user.email,
                `Task Reminder: ${task.title}`,
                'reminder',
                task
              );
            }

            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, lastNotifiedTime: currentTimeStr } : t));
          }
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [tasks, user]);

  // Auth Handlers
  const handleLoginSuccess = async (authUser) => {
    const activeUser = { ...authUser, isLoggedIn: true };
    setUser(activeUser);
    if (authUser.theme_preference) {
      setIsDarkMode(authUser.theme_preference === 'dark');
    }
    storageService.saveUser(activeUser);
    setApiConnected(true);
    setIsAuthModalOpen(false);

    try {
      const userTasks = await apiClient.getTasks();
      if (Array.isArray(userTasks)) {
        setTasks(userTasks);
      }
      const userCats = await apiClient.getCategories();
      if (Array.isArray(userCats) && userCats.length > 0) {
        setCategories(userCats);
      }
    } catch (e) {
      console.warn('[Login Sync] Failed to load database tasks');
    }
    notifyBroadcastSync();
  };

  const handleLogout = () => {
    apiClient.setToken(null);
    storageService.saveUser({ isLoggedIn: false });
    setUser({ isLoggedIn: false });
    setTasks([]);
    setApiConnected(false);
    setIsAuthModalOpen(true);
    notifyBroadcastSync();
  };

  // Instant Database Mutations with Real-time Cloud Auto-Sync
  const handleToggleComplete = async (id) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    const previousTasks = tasks;
    const newCompleted = !target.completed;
    const newStatus = newCompleted ? 'completed' : 'to_do';

    // Consistent Rule: Completing parent task marks all subtasks completed
    const updatedSubtasks = newCompleted 
      ? (target.subtasks || []).map(st => ({ ...st, completed: true }))
      : (target.subtasks || []);

    const updatedTask = {
      ...target,
      completed: newCompleted,
      status: newStatus,
      subtasks: updatedSubtasks
    };

    setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));

    try {
      await apiClient.updateTask(id, updatedTask);
      notifyBroadcastSync();
    } catch (e) {
      if (e?.isAuthError || e?.status === 401 || e?.status === 403) {
        handleLogout();
      } else {
        setTasks(previousTasks);
        showErrorToast(e?.message || "Couldn't update task — check your connection");
      }
    }
  };

  const handleToggleSubtask = async (taskId, subtaskId) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;

    const previousTasks = tasks;
    const updatedSubtasks = (target.subtasks || []).map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    // Consistent Rule: If all subtasks completed -> parent task automatically completes
    const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
    const newCompleted = allCompleted ? true : (target.completed && !allCompleted ? false : target.completed);
    const newStatus = newCompleted ? 'completed' : (updatedSubtasks.some(st => st.completed) ? 'in_progress' : target.status);

    const updatedTask = {
      ...target,
      subtasks: updatedSubtasks,
      completed: newCompleted,
      status: newStatus
    };

    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

    try {
      await apiClient.updateTask(taskId, updatedTask);
      notifyBroadcastSync();
    } catch (e) {
      if (e?.isAuthError || e?.status === 401 || e?.status === 403) {
        handleLogout();
      } else {
        setTasks(previousTasks);
        showErrorToast(e?.message || "Couldn't update subtasks — check your connection");
      }
    }
  };

  const handleSaveTask = async (taskData) => {
    const previousTasks = tasks;
    if (selectedCategory && taskData.category !== selectedCategory) {
      setSelectedCategory(null);
    }
    if (activeFilter === 'archived' && !taskData.archived) {
      setActiveFilter('all');
    }

    const existingIdx = tasks.findIndex(t => t.id === taskData.id);

    if (existingIdx >= 0) {
      try {
        const res = await apiClient.updateTask(taskData.id, taskData);
        if (res?.task) {
          setTasks(prev => prev.map(t => t.id === taskData.id ? res.task : t));
        } else {
          await fetchAccountTasksFromDB();
        }
        notifyBroadcastSync();
      } catch (e) {
        if (e?.isAuthError || e?.status === 401 || e?.status === 403) {
          handleLogout();
        } else {
          setTasks(previousTasks);
          showErrorToast(e?.message || "Couldn't save changes — check your connection");
        }
      }
    } else {
      try {
        const created = await apiClient.createTask(taskData);
        if (created?.id) {
          setTasks(prev => [created, ...prev.filter(t => t.id !== created.id)]);
        } else {
          await fetchAccountTasksFromDB();
        }
        notifyBroadcastSync();
      } catch (e) {
        if (e?.isAuthError || e?.status === 401 || e?.status === 403) {
          handleLogout();
        } else {
          setTasks(previousTasks);
          showErrorToast(e?.message || "Couldn't save task — check your connection");
        }
      }
    }
  };

  const handleDeleteTask = async (id) => {
    const previousTasks = tasks;
    try {
      await apiClient.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      notifyBroadcastSync();
    } catch (e) {
      if (e?.isAuthError || e?.status === 401 || e?.status === 403) {
        handleLogout();
      } else {
        setTasks(previousTasks);
        showErrorToast(e?.message || "Couldn't delete task — check your connection");
      }
    }
  };

  const handleArchiveTask = async (id) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    const previousTasks = tasks;
    const newArchived = !target.archived;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, archived: newArchived } : t));

    try {
      await apiClient.updateTask(id, { ...target, archived: newArchived });
      notifyBroadcastSync();
    } catch (e) {
      if (e?.isAuthError || e?.status === 401 || e?.status === 403) {
        handleLogout();
      } else {
        setTasks(previousTasks);
        showErrorToast(e?.message || "Couldn't archive task — check your connection");
      }
    }
  };

  const handleUpdateTaskStatus = async (id, newStatus) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    const previousTasks = tasks;
    const newCompleted = newStatus === 'completed';
    setTasks(prev => prev.map(t => t.id === id ? { 
      ...t, 
      status: newStatus, 
      completed: newCompleted 
    } : t));

    try {
      await apiClient.updateTask(id, { ...target, status: newStatus, completed: newCompleted });
      notifyBroadcastSync();
    } catch (e) {
      if (e?.isAuthError || e?.status === 401 || e?.status === 403) {
        handleLogout();
      } else {
        setTasks(previousTasks);
        showErrorToast(e?.message || "Couldn't update task status — check your connection");
      }
    }
  };

  const handleImportTask = (newTask) => {
    setTasks(prev => [newTask, ...prev]);
  };

  const handleImportBackup = (newTasks, newCategories) => {
    if (newTasks) setTasks(newTasks);
    if (newCategories) setCategories(newCategories);
  };

  // Enhanced Search Filter
  const filteredTasks = tasks.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q) ||
      t.priority?.toLowerCase().includes(q) ||
      (t.subtasks && t.subtasks.some(st => st.title?.toLowerCase().includes(q)))
    );
  });

  const unreadCount = notificationService.getEmailLogs().length;

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      
      {/* Animated Splash Screen */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Reconnect Toast Banner */}
      {reconnectToastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in border border-emerald-300/30">
          <span>{reconnectToastMsg}</span>
        </div>
      )}

      {/* Error Toast Banner */}
      {errorToastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in border border-rose-300/30">
          <span>⚠️ {errorToastMsg}</span>
        </div>
      )}

      {/* Mandatory Auth Gate: If unauthenticated, render Auth Modal Screen */}
      {!user?.isLoggedIn ? (
        <AuthModal
          isOpen={true}
          onClose={() => {}}
          user={user}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          isMandatory={true}
        />
      ) : (
        <>
          {/* Header Bar */}
          <Header
            user={user}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onOpenEmailSimulator={() => setIsEmailSimOpen(true)}
            onOpenCommandPalette={() => setIsCmdPaletteOpen(true)}
            onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
            onOpenOfflineModal={() => setIsOfflineModalOpen(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            unreadCount={unreadCount}
            isDarkMode={isDarkMode}
            setIsDarkMode={handleToggleDarkMode}
            isOnline={isOnline}
            apiConnected={apiConnected}
          />

          {/* Main Workspace Screens */}
          <main className="flex-1 w-full pt-2">
            {activeTab === 'tasks' && (
              <TaskScreen
                tasks={filteredTasks}
                categories={categories}
                onToggleComplete={handleToggleComplete}
                onToggleSubtask={handleToggleSubtask}
                onEditTask={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
                onDeleteTask={handleDeleteTask}
                onArchiveTask={handleArchiveTask}
                onShareTask={(t) => setSharingTask(t)}
                onOpenCreateTaskModal={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
              />
            )}

            {activeTab === 'kanban' && (
              <KanbanBoard
                tasks={filteredTasks}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onOpenCreateTaskModal={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                onEditTask={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
                onShareTask={(t) => setSharingTask(t)}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarScreen
                tasks={filteredTasks}
                onToggleComplete={handleToggleComplete}
                onOpenCreateTaskModal={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                onEditTask={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
                onImportTask={handleImportTask}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView tasks={tasks} />
            )}
          </main>

          {/* Floating Bottom Navigation */}
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenCreateTaskModal={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
          />

          {/* Modals */}
          <TaskModal
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            onSaveTask={handleSaveTask}
            editingTask={editingTask}
            categories={categories}
            onOpenShare={(t) => setSharingTask(t)}
          />

          <ShareModal
            isOpen={!!sharingTask}
            onClose={() => setSharingTask(null)}
            task={sharingTask}
          />

          <SharedTaskViewerModal
            sharedTask={sharedViewerTask}
            onClose={() => { setSharedViewerTask(null); shareService.clearShareHashFromUrl(); }}
            onImportTask={handleImportTask}
          />

          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            user={user}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
            isMandatory={false}
          />

          <CommandPaletteModal
            isOpen={isCmdPaletteOpen}
            onClose={() => setIsCmdPaletteOpen(false)}
            tasks={tasks}
            onOpenCreateTaskModal={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
            setActiveView={() => {}}
            setActiveFilter={() => {}}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />

          <IntegrationsModal
            isOpen={isIntegrationsOpen}
            onClose={() => setIsIntegrationsOpen(false)}
            user={user}
            onSaveUser={(u) => setUser(u)}
          />

          <FeedbackModal
            isOpen={isFeedbackModalOpen}
            onClose={() => setIsFeedbackModalOpen(false)}
            user={user}
          />

          <OfflineErrorPage
            isOpen={isOfflineModalOpen || (!isOnline && !isLocalOfflineMode)}
            onClose={() => setIsOfflineModalOpen(false)}
            onRetryConnection={() => {
              setIsOnline(true);
              setApiConnected(true);
            }}
            isOffline={!isOnline}
            isApiDown={!apiConnected}
            onContinueOffline={() => {
              setIsLocalOfflineMode(true);
              setIsOfflineModalOpen(false);
            }}
          />
        </>
      )}

    </div>
  );
}
