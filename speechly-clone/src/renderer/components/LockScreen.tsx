import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Unlock, AlertCircle, Mic, Key } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
  onResetData?: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, onResetData }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleUnlock = useCallback(async () => {
    if (!password.trim()) {
      setError('Veuillez entrer votre mot de passe');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await window.electronAPI.securityUnlock(password);
      if (result.success) {
        setPassword('');
        setAttempts(0);
        onUnlock();
      } else {
        setAttempts(prev => prev + 1);
        setError(result.error || 'Mot de passe incorrect');
        setPassword('');
      }
    } catch (err) {
      setError('Erreur lors du déverrouillage');
      console.error('Unlock error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [password, onUnlock]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  }, [handleUnlock]);

  const handleResetData = async () => {
    if (onResetData) {
      onResetData();
    }
    setShowResetConfirm(false);
  };

  return (
    <div className="fixed inset-0 bg-bg-primary flex items-center justify-center z-50">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink mb-6">
            <Mic size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Speechly Clone</h1>
          <p className="text-text-secondary">Application verrouillée</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={20} className="text-text-secondary" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Entrez votre mot de passe"
              disabled={isLoading}
              autoFocus
              className="w-full pl-12 pr-4 py-4 bg-bg-secondary border border-bg-tertiary rounded-xl
                        text-text-primary placeholder-text-secondary
                        focus:outline-none focus:border-accent-purple focus:ring-2 focus:ring-accent-purple/20
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-500">{error}</span>
            </div>
          )}

          {attempts >= 3 && (
            <p className="text-xs text-text-secondary text-center">
              {5 - attempts > 0 
                ? `${5 - attempts} tentative(s) restante(s)` 
                : 'Trop de tentatives'}
            </p>
          )}

          <button
            onClick={handleUnlock}
            disabled={isLoading || !password.trim()}
            className="w-full py-4 bg-gradient-to-r from-accent-purple to-accent-pink
                      text-white font-medium rounded-xl
                      hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Unlock size={20} />
                Déverrouiller
              </>
            )}
          </button>
        </div>

        <div className="pt-4 border-t border-bg-tertiary">
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2 text-sm text-text-secondary hover:text-text-primary
                        transition-colors flex items-center justify-center gap-2"
            >
              <Key size={16} />
              Mot de passe oublié ?
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary text-center">
                <AlertCircle size={16} className="inline mr-1 text-amber-500" />
                Cette action effacera toutes vos données chiffrées (historique, profil, snippets).
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 bg-bg-tertiary text-text-primary rounded-lg
                            hover:bg-bg-secondary transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleResetData}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg
                            hover:bg-red-700 transition-colors text-sm"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-text-secondary text-center mt-8">
          Vos données sont protégées par chiffrement AES-256
        </p>
      </div>
    </div>
  );
};
