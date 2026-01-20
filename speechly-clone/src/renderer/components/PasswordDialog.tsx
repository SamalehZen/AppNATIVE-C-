import React, { useState, useCallback } from 'react';
import { X, Lock, Eye, EyeOff, Check, AlertCircle, Shield } from 'lucide-react';

interface PasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'set' | 'change' | 'remove';
  onSuccess: () => void;
}

export const PasswordDialog: React.FC<PasswordDialogProps> = ({
  isOpen,
  onClose,
  mode,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setShowPassword(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 4) {
      return 'Le mot de passe doit contenir au moins 4 caractères';
    }
    return null;
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'set') {
        const validationError = validatePassword(newPassword);
        if (validationError) {
          setError(validationError);
          setIsLoading(false);
          return;
        }

        if (newPassword !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          setIsLoading(false);
          return;
        }

        const result = await window.electronAPI.securitySetPassword(newPassword);
        if (result.success) {
          onSuccess();
          handleClose();
        }
      } else if (mode === 'change') {
        const validationError = validatePassword(newPassword);
        if (validationError) {
          setError(validationError);
          setIsLoading(false);
          return;
        }

        if (newPassword !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          setIsLoading(false);
          return;
        }

        const result = await window.electronAPI.securityChangePassword(currentPassword, newPassword);
        if (result.success) {
          onSuccess();
          handleClose();
        } else {
          setError(result.error || 'Mot de passe actuel incorrect');
        }
      } else if (mode === 'remove') {
        const result = await window.electronAPI.securityRemovePassword(currentPassword);
        if (result.success) {
          onSuccess();
          handleClose();
        } else {
          setError(result.error || 'Mot de passe incorrect');
        }
      }
    } catch (err) {
      setError('Une erreur est survenue');
      console.error('Password operation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getTitle = () => {
    switch (mode) {
      case 'set': return 'Définir un mot de passe';
      case 'change': return 'Changer le mot de passe';
      case 'remove': return 'Supprimer le mot de passe';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'set': return 'Protégez vos données avec un mot de passe';
      case 'change': return 'Entrez votre ancien et nouveau mot de passe';
      case 'remove': return 'Entrez votre mot de passe actuel pour le supprimer';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-bg-tertiary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-purple/20 flex items-center justify-center">
              <Shield size={20} className="text-accent-purple" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{getTitle()}</h2>
              <p className="text-sm text-text-secondary">{getDescription()}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {(mode === 'change' || mode === 'remove') && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Mot de passe actuel
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-text-secondary" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Entrez le mot de passe actuel"
                  className="w-full pl-10 pr-10 py-3 bg-bg-tertiary border border-bg-tertiary rounded-lg
                            text-text-primary placeholder-text-secondary
                            focus:outline-none focus:border-accent-purple"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff size={18} className="text-text-secondary" />
                  ) : (
                    <Eye size={18} className="text-text-secondary" />
                  )}
                </button>
              </div>
            </div>
          )}

          {(mode === 'set' || mode === 'change') && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {mode === 'set' ? 'Mot de passe' : 'Nouveau mot de passe'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-text-secondary" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 4 caractères"
                    className="w-full pl-10 pr-10 py-3 bg-bg-tertiary border border-bg-tertiary rounded-lg
                              text-text-primary placeholder-text-secondary
                              focus:outline-none focus:border-accent-purple"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff size={18} className="text-text-secondary" />
                    ) : (
                      <Eye size={18} className="text-text-secondary" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-text-secondary" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmez le mot de passe"
                    className="w-full pl-10 pr-10 py-3 bg-bg-tertiary border border-bg-tertiary rounded-lg
                              text-text-primary placeholder-text-secondary
                              focus:outline-none focus:border-accent-purple"
                  />
                  {confirmPassword && newPassword === confirmPassword && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Check size={18} className="text-green-500" />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-500">{error}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={handleClose}
            className="flex-1 py-3 bg-bg-tertiary text-text-primary rounded-lg
                      hover:bg-bg-primary transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`flex-1 py-3 text-white font-medium rounded-lg
                      transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center justify-center gap-2
                      ${mode === 'remove' 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-accent-purple hover:bg-accent-purple/90'}`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'remove' ? 'Supprimer' : 'Confirmer'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
