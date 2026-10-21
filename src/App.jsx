import React, { useState, useEffect } from 'react';
import { getSettings, getAuthUser, saveAuthUser } from './services/db';

// Navigation & Layout
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BottomNav from './components/BottomNav';

// 12 Functional Modules
import Dashboard from './components/Dashboard';
import WorkoutLogger from './components/WorkoutLogger';
import ExerciseLibrary from './components/ExerciseLibrary';
import NutritionTracker from './components/NutritionTracker';
import MovementTracker from './components/MovementTracker';
import WeightLog from './components/WeightLog';
import HabitTracker from './components/HabitTracker';
import ProgressReports from './components/ProgressReports';
import GoalsAndPlans from './components/GoalsAndPlans';
import AdminPanel from './components/AdminPanel';
import Settings from './components/Settings';

// Auth & Onboarding & Legal
import AuthModal from './components/AuthModal';
import GoalSetup from './components/GoalSetup';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsAndConditions from './components/TermsAndConditions';
import SplashScreen from './components/SplashScreen';

export default function App() {
  const [authUser, setAuthUser] = useState(() => {
    try {
      return getAuthUser();
    } catch {
      return null;
    }
  });

  const [settings, setSettings] = useState(() => {
    try {
      return getSettings();
    } catch {
      return null;
    }
  });

  const [activeView, setActiveView] = useState('dashboard');
  const [showSplash, setShowSplash] = useState(true);
  const [hash, setHash] = useState(() => (typeof window !== 'undefined' ? window.location.hash : '#/'));
  const [pathname, setPathname] = useState(() => (typeof window !== 'undefined' ? window.location.pathname : '/'));
  const [pendingExercise, setPendingExercise] = useState(null);

  // Sync hash and pathname routing
  useEffect(() => {
    const handleLocationChange = () => {
      setHash(window.location.hash);
      setPathname(window.location.pathname);
    };
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  function handleLogout() {
    saveAuthUser(null);
    setAuthUser(null);
  }

  function handleStartWithExercise(exercise) {
    setPendingExercise(exercise);
    setActiveView('workouts');
  }

  function handleResetApp() {
    setAuthUser(null);
    setSettings(null);
    setActiveView('dashboard');
  }

  // Standalone Isolated Legal Pages & Dedicated Admin Portal (Separate URL)
  const isAdminRoute = hash === '#/admin' || hash === '#admin' || pathname === '/admin';
  const hasValidAuth = Boolean(authUser && (authUser.id || authUser.uid || authUser.email));

  let content;

  if (hash === '#/privacy') {
    content = <PrivacyPolicy />;
  } else if (hash === '#/terms') {
    content = <TermsAndConditions />;
  } else if (isAdminRoute) {
    content = (
      <AdminPanel
        onExit={() => {
          if (window.location.pathname === '/admin') {
            window.history.pushState(null, '', '/');
            setPathname('/');
          }
          window.location.hash = '#/';
          setHash('#/');
        }}
      />
    );
  } else if (!hasValidAuth) {
    content = <AuthModal onLoginSuccess={(user) => setAuthUser(user)} />;
  } else if (!settings || !settings.onboardingComplete) {
    content = (
      <GoalSetup
        onComplete={(newSettings) => {
          setSettings(newSettings);
          setActiveView('dashboard');
        }}
      />
    );
  } else {
    content = (
      <div className="min-h-screen bg-[#F6F6F7] text-[#15171A]">
        {/* Desktop Left Sidebar */}
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          authUser={authUser}
          onLogout={handleLogout}
        />

        {/* Mobile Top Header: Hidden on home screen (dashboard) */}
        {activeView !== 'dashboard' && (
          <Header
            authUser={authUser}
            onLogout={handleLogout}
            setActiveView={setActiveView}
          />
        )}

        {/* Main Content Viewport */}
        <main className="desktop-main-pad min-h-screen">
          {activeView === 'dashboard' && (
            <Dashboard
              settings={settings}
              onNavigate={setActiveView}
              authUser={authUser}
            />
          )}

          {activeView === 'workouts' && (
            <WorkoutLogger
              settings={settings}
              initialExerciseToAdd={pendingExercise}
            />
          )}

          {activeView === 'library' && (
            <ExerciseLibrary
              onStartWithExercise={handleStartWithExercise}
            />
          )}

          {activeView === 'nutrition' && (
            <NutritionTracker
              settings={settings}
            />
          )}

          {activeView === 'movement' && (
            <MovementTracker
              settings={settings}
              onUpdateSettings={setSettings}
            />
          )}

          {activeView === 'weight' && (
            <WeightLog
              settings={settings}
              onUpdateSettings={setSettings}
            />
          )}

          {activeView === 'habits' && (
            <HabitTracker
              settings={settings}
            />
          )}

          {activeView === 'progress' && (
            <ProgressReports
              settings={settings}
            />
          )}

          {activeView === 'goals' && (
            <GoalsAndPlans
              settings={settings}
              onUpdateSettings={setSettings}
            />
          )}

          {activeView === 'settings' && (
            <Settings
              settings={settings}
              onUpdate={setSettings}
              onResetApp={handleResetApp}
              onReplaySplash={() => setShowSplash(true)}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav
          activeView={activeView}
          setActiveView={setActiveView}
          onLogout={handleLogout}
          authUser={authUser}
        />
      </div>
    );
  }

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      {content}
    </>
  );
}
