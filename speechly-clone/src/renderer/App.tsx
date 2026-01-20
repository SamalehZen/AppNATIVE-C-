import React, { useEffect, useState, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';
import { History } from './pages/History';
import { Dictionary } from './pages/Dictionary';
import { Snippets } from './pages/Snippets';
import { Profile } from './pages/Profile';
import { Analytics } from './pages/Analytics';
import { StyleProfile } from './pages/StyleProfile';
import { LockScreen } from './components/LockScreen';
import { useSettings } from './stores/settings';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const { loadSettings, settings } = useSettings();
  const [isLocked, setIsLocked] = useState(false);
  const [checkingLock, setCheckingLock] = useState(true);

  const checkLockStatus = useCallback(async () => {
    try {
      const locked = await window.electronAPI.securityIsLocked();
      setIsLocked(locked);
    } catch (e) {
      console.error('Failed to check lock status:', e);
    } finally {
      setCheckingLock(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    checkLockStatus();
  }, [loadSettings, checkLockStatus]);

  useEffect(() => {
    if (window.electronAPI?.onAppLocked) {
      window.electronAPI.onAppLocked(() => {
        setIsLocked(true);
      });
    }

    if (window.electronAPI?.onAppUnlocked) {
      window.electronAPI.onAppUnlocked(() => {
        setIsLocked(false);
      });
    }

    return () => {
      if (window.electronAPI?.removeAppLockedListener) {
        window.electronAPI.removeAppLockedListener();
      }
      if (window.electronAPI?.removeAppUnlockedListener) {
        window.electronAPI.removeAppUnlockedListener();
      }
    };
  }, []);

  useEffect(() => {
    if (window.electronAPI?.onNavigate) {
      window.electronAPI.onNavigate((path: string) => {
        navigate(path);
      });
    }

    return () => {
      if (window.electronAPI?.removeNavigateListener) {
        window.electronAPI.removeNavigateListener();
      }
    };
  }, [navigate]);

  useEffect(() => {
    if (!settings.geminiApiKey && !useSettings.getState().isLoading) {
      navigate('/settings');
    }
  }, [settings.geminiApiKey, navigate]);

  const handleUnlock = useCallback(() => {
    setIsLocked(false);
  }, []);

  if (checkingLock) {
    return (
      <div className="flex h-screen bg-bg-primary items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
      </div>
    );
  }

  if (isLocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/snippets" element={<Snippets />} />
          <Route path="/style-profile" element={<StyleProfile />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/history" element={<History />} />
          <Route path="/dictionary" element={<Dictionary />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};
