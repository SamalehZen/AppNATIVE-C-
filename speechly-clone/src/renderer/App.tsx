import React, { useEffect } from 'react';
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
import { useSettings } from './stores/settings';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const { loadSettings, settings } = useSettings();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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
