import React, { useEffect, useState } from 'react';
import { 
  Mic, Globe, Keyboard, Brain, Database, 
  Palette, Info, ExternalLink
} from 'lucide-react';
import { SettingsSection } from '../components/SettingsSection';
import { HotkeyInput } from '../components/HotkeyInput';
import { ApiKeyInput } from '../components/ApiKeyInput';
import { Toggle } from '../components/Toggle';
import { useSettings } from '../stores/settings';
import { SUPPORTED_LANGUAGES } from '../../shared/types';
import { HISTORY_RETENTION_OPTIONS, THEME_OPTIONS } from '../../shared/constants';

export const Settings: React.FC = () => {
  const { settings, updateSettings, isLoading } = useSettings();
  const [dbSize, setDbSize] = useState('0');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stats = await window.electronAPI.getStats();
      setDbSize(stats.dbSize);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
      await window.electronAPI.clearHistory();
      await loadStats();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 overflow-auto h-full">
      <h1 className="text-2xl font-bold mb-8 text-text-primary">Paramètres</h1>

      <SettingsSection
        icon={<Mic size={20} />}
        title="Reconnaissance vocale"
        description="Configuration de la capture audio"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Langue par défaut
            </label>
            <select
              value={settings.defaultLanguage}
              onChange={(e) => updateSettings({ defaultLanguage: e.target.value })}
              className="w-full bg-bg-tertiary text-text-primary border border-bg-tertiary rounded-lg px-4 py-3
                        focus:border-accent-purple focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-text-primary">Détection automatique de la langue</span>
              <p className="text-xs text-text-secondary">Laisse l'API détecter la langue parlée</p>
            </div>
            <Toggle
              checked={settings.autoDetectLanguage}
              onChange={(v) => updateSettings({ autoDetectLanguage: v })}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Keyboard size={20} />}
        title="Raccourcis clavier"
        description="Hotkeys globaux pour contrôler l'application"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Démarrer/Arrêter la dictée
            </label>
            <HotkeyInput
              value={settings.hotkeyRecord}
              onChange={(v) => updateSettings({ hotkeyRecord: v })}
              placeholder="Ctrl+Shift+Space"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Insérer le texte nettoyé
            </label>
            <HotkeyInput
              value={settings.hotkeyInsert}
              onChange={(v) => updateSettings({ hotkeyInsert: v })}
              placeholder="Ctrl+Shift+V"
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Brain size={20} />}
        title="Intelligence artificielle"
        description="Configuration du cleanup IA avec Gemini"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Clé API Gemini
            </label>
            <ApiKeyInput
              value={settings.geminiApiKey}
              onChange={(v) => updateSettings({ geminiApiKey: v })}
              placeholder="Entrez votre clé API Gemini"
            />
            <p className="text-xs text-text-secondary mt-2 flex items-center gap-1">
              Obtenez votre clé sur{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-purple hover:underline inline-flex items-center gap-1"
              >
                Google AI Studio <ExternalLink size={12} />
              </a>
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-text-primary">Cleanup automatique</span>
              <p className="text-xs text-text-secondary">Nettoyer automatiquement après chaque dictée</p>
            </div>
            <Toggle
              checked={settings.autoCleanup}
              onChange={(v) => updateSettings({ autoCleanup: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-text-primary">Détection de contexte</span>
              <p className="text-xs text-text-secondary">Adapter le cleanup selon l'application active</p>
            </div>
            <Toggle
              checked={settings.contextAwareCleanup}
              onChange={(v) => updateSettings({ contextAwareCleanup: v })}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Database size={20} />}
        title="Stockage & Historique"
        description="Gestion des données locales"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-text-primary">Sauvegarder l'historique</span>
              <p className="text-xs text-text-secondary">Conserver les transcriptions passées</p>
            </div>
            <Toggle
              checked={settings.saveHistory}
              onChange={(v) => updateSettings({ saveHistory: v })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Durée de rétention
            </label>
            <select
              value={settings.historyRetentionDays}
              onChange={(e) => updateSettings({ historyRetentionDays: parseInt(e.target.value) })}
              disabled={!settings.saveHistory}
              className="w-full bg-bg-tertiary text-text-primary border border-bg-tertiary rounded-lg px-4 py-3
                        focus:border-accent-purple focus:outline-none cursor-pointer disabled:opacity-50"
            >
              {HISTORY_RETENTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div>
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm text-white
                          transition-colors"
              >
                Effacer tout l'historique
              </button>
              <p className="text-xs text-text-secondary mt-2">
                Base de données: {dbSize} MB utilisés
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Palette size={20} />}
        title="Apparence"
        description="Personnalisation de l'interface"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Thème</label>
            <div className="flex gap-3">
              {THEME_OPTIONS.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => updateSettings({ theme: theme.value })}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    settings.theme === theme.value
                      ? 'bg-accent-purple text-white'
                      : 'bg-bg-tertiary text-text-primary hover:bg-bg-secondary'
                  }`}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-text-primary">Réduire dans le tray</span>
              <p className="text-xs text-text-secondary">Minimiser dans la barre système au lieu de fermer</p>
            </div>
            <Toggle
              checked={settings.minimizeToTray}
              onChange={(v) => updateSettings({ minimizeToTray: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-text-primary">Démarrer avec le système</span>
              <p className="text-xs text-text-secondary">Lancer automatiquement au démarrage</p>
            </div>
            <Toggle
              checked={settings.launchAtStartup}
              onChange={(v) => updateSettings({ launchAtStartup: v })}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Info size={20} />}
        title="À propos"
        description="Informations sur l'application"
      >
        <div className="space-y-2 text-sm text-text-secondary">
          <p>Speechly Clone v{settings.appVersion}</p>
          <p className="text-xs">
            Application de dictée vocale avec cleanup IA
          </p>
          <div className="pt-2">
            <a 
              href="#" 
              className="text-accent-purple hover:underline text-sm"
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              Vérifier les mises à jour
            </a>
          </div>
        </div>
      </SettingsSection>

      <div className="h-6" />
    </div>
  );
};
