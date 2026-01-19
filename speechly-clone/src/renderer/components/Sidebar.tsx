import React from 'react';
import { NavLink } from 'react-router-dom';
import { Mic, Clock, BookOpen, Settings, Zap } from 'lucide-react';

const navItems = [
  { path: '/', icon: Mic, label: 'Dictée' },
  { path: '/history', icon: Clock, label: 'Historique' },
  { path: '/dictionary', icon: BookOpen, label: 'Dictionnaire' },
  { path: '/settings', icon: Settings, label: 'Paramètres' },
];

interface SidebarProps {
  isConnected?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isConnected = true }) => {
  return (
    <aside className="w-16 bg-bg-primary border-r border-bg-tertiary flex flex-col items-center py-4">
      <div className="mb-8 draggable">
        <div className="w-10 h-10 bg-gradient-to-br from-accent-purple to-accent-green rounded-xl flex items-center justify-center">
          <Zap size={20} className="text-white" />
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-2 non-draggable">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `
              w-10 h-10 rounded-xl flex items-center justify-center
              transition-all duration-200 group relative
              ${isActive
                ? 'bg-accent-purple text-white shadow-lg shadow-accent-purple/25'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'}
            `}
            title={label}
          >
            <Icon size={20} />
            <span className="absolute left-14 px-2 py-1 bg-bg-tertiary text-text-primary text-xs rounded
                           opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap
                           transition-opacity duration-200 z-50">
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto non-draggable">
        <div 
          className={`w-3 h-3 rounded-full ${isConnected ? 'bg-accent-green' : 'bg-red-500'}`}
          title={isConnected ? 'Connecté' : 'Déconnecté'}
        />
      </div>
    </aside>
  );
};
