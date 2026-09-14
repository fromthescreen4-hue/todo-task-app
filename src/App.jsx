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
import { storageService } from './services/storageService';
import { notificationService } from './services/notificationService';
import { shareService } from './services/shareService';
import { apiClient } from './services/apiClient';
import { cloudBackupService } from './services/cloudBackupService';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  // State - Persistent User Session State
  const [user, setUser] = useState(() => {
    const cached = storageService.getUser();
    return cached?.isLoggedIn ? cached : { isLoggedIn: false };
  });

  const [tasks, setTasks] = useState(() => storageService.getTasks());
  const [categories, setCategories] = useState(() => storageService.getCategories());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);

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

  // Session Initialization & Refresh Persistence
  useEffect(() => {
    async function initSession() {
      // 1. Check cached session in LocalStorage
      const cached = storageService.getUser();
      if (cached && cached.isLoggedIn) {
        setUser(cached);
        if (cached.theme_preference) {
          setIsDarkMode(cached.theme_preference === 'dark');
        }
        setApiConnected(true);
        const storedTasks = storageService.getTasks();
        if (Array.isArray(storedTasks)) setTasks(storedTasks);
        return;
      }

      // 2. Check API token
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
            return;
          }
        } catch (err) {
          console.warn('[Cloud Sync Warning] Using cached local session.');
        }
      }

      // If no active session exists -> Mandatory Auth Gate
      setUser({ isLoggedIn: false });
      setIsAuthModalOpen(true);
    }

    initSession();
  }, []);

  // Save State to LocalStorage Backup
  useEffect(() => {
    if (user?.isLoggedIn) {
      storageService.saveTasks(tasks);
      cloudBackupService.saveBackupTasks(tasks);
    }
  }, [tasks, user]);

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
      if (Array.isArray(userTasks) && userTasks.length > 0) {
        setTasks(userTasks);
        cloudBackupService.saveBackupTasks(userTasks);
      }
    } catch (e) {
      console.warn('Using local backup storage');
    }
  };

  const handleLogout = () => {
    apiClient.setToken(null);
    storageService.saveUser({ isLoggedIn: false });
    setUser({ isLoggedIn: false });
    setApiConnected(false);
    setIsAuthModalOpen(true);
  };

  // Task Actions with Real-time Cloud Auto-Sync & Backup Failover
  const handleToggleComplete = async (id) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    const newCompleted = !target.completed;
    const newStatus = newCompleted ? 'completed' : 'to_do';

    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted, status: newStatus } : t));

    try {
      await apiClient.updateTask(id, { ...target, completed: newCompleted, status: newStatus });
    } catch (e) {
      cloudBackupService.enqueuePendingAction({ type: 'updateTask', id, data: { completed: newCompleted, status: newStatus } });
    }
  };

  const handleToggleSubtask = (taskId, subtaskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const updatedSubtasks = (t.subtasks || []).map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );
      return { ...t, subtasks: updatedSubtasks };
    }));
  };

  const handleSaveTask = async (taskData) => {
    const existingIdx = tasks.findIndex(t => t.id === taskData.id);
    if (existingIdx >= 0) {
      setTasks(prev => prev.map((t, idx) => idx === existingIdx ? taskData : t));
      try {
        await apiClient.updateTask(taskData.id, taskData);
      } catch (e) {
        cloudBackupService.enqueuePendingAction({ type: 'updateTask', id: taskData.id, data: taskData });
      }
    } else {
      setTasks(prev => [taskData, ...prev]);
      try {
        const created = await apiClient.createTask(taskData);
        if (created?.id) {
          setTasks(prev => prev.map(t => t.id === taskData.id ? created : t));
        }
      } catch (e) {
        cloudBackupService.enqueuePendingAction({ type: 'createTask', data: taskData });
      }
    }
  };

  const handleDeleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await apiClient.deleteTask(id);
    } catch (e) {
      cloudBackupService.enqueuePendingAction({ type: 'deleteTask', id });
    }
  };

  const handleArchiveTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, archived: !t.archived } : t));
  };

  const handleUpdateTaskStatus = async (id, newStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { 
      ...t, 
      status: newStatus, 
      completed: newStatus === 'completed' 
    } : t));

    try {
      await apiClient.updateTask(id, { status: newStatus, completed: newStatus === 'completed' });
    } catch (e) {
      cloudBackupService.enqueuePendingAction({ type: 'updateTask', id, data: { status: newStatus } });
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
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            unreadCount={unreadCount}
            isDarkMode={isDarkMode}
            setIsDarkMode={handleToggleDarkMode}
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
        </>
      )}

    </div>
  );
}
