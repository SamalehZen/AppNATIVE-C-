import React, { useState, useCallback } from 'react';
import { X, Download, Upload, Key, Copy, Check, AlertCircle, Shield } from 'lucide-react';

interface KeyBackupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'export' | 'import';
  onSuccess: () => void;
}

export const KeyBackupDialog: React.FC<KeyBackupDialogProps> = ({
  isOpen,
  onClose,
  mode,
  onSuccess,
}) => {
  const [keyValue, setKeyValue] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = useCallback(() => {
    setKeyValue('');
    setError('');
    setCopied(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleExport = async () => {
    setIsLoading(true);
    setError('');
    try {
      const key = await window.electronAPI.securityExportKey();
      setKeyValue(key);
    } catch (err) {
      setError('Impossible d\'exporter la clé');
      console.error('Export error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!keyValue.trim()) {
      setError('Veuillez entrer une clé');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await window.electronAPI.securityImportKey(keyValue.trim());
      if (result.success) {
        onSuccess();
        handleClose();
      } else {
        setError(result.error || 'Clé invalide');
      }
    } catch (err) {
      setError('Erreur lors de l\'importation');
      console.error('Import error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(keyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Impossible de copier');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([keyValue], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'speechly-key-backup.key';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-bg-tertiary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-purple/20 flex items-center justify-center">
              <Key size={20} className="text-accent-purple" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {mode === 'export' ? 'Exporter la clé' : 'Importer une clé'}
              </h2>
              <p className="text-sm text-text-secondary">
                {mode === 'export' 
                  ? 'Sauvegardez votre clé de chiffrement' 
                  : 'Restaurez une clé de sauvegarde'}
              </p>
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
          {mode === 'export' && !keyValue && (
            <div className="text-center py-8">
              <Shield size={48} className="mx-auto text-text-secondary mb-4" />
              <p className="text-text-secondary mb-6">
                Cliquez sur le bouton ci-dessous pour générer votre clé de sauvegarde.
                Conservez-la en lieu sûr.
              </p>
              <button
                onClick={handleExport}
                disabled={isLoading}
                className="px-6 py-3 bg-accent-purple text-white rounded-lg
                          hover:bg-accent-purple/90 transition-colors
                          disabled:opacity-50 disabled:cursor-not-allowed
                          flex items-center justify-center gap-2 mx-auto"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Download size={18} />
                    Générer la clé
                  </>
                )}
              </button>
            </div>
          )}

          {mode === 'export' && keyValue && (
            <div className="space-y-4">
              <div className="p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary">
                <p className="text-xs text-text-secondary mb-2 font-medium">Votre clé de chiffrement:</p>
                <code className="text-sm text-text-primary break-all font-mono">
                  {keyValue}
                </code>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-3 bg-bg-tertiary text-text-primary rounded-lg
                            hover:bg-bg-primary transition-colors
                            flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check size={18} className="text-green-500" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copier
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 py-3 bg-accent-purple text-white rounded-lg
                            hover:bg-accent-purple/90 transition-colors
                            flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Télécharger
                </button>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-xs text-amber-500">
                  <AlertCircle size={14} className="inline mr-1" />
                  Gardez cette clé en sécurité. Elle est nécessaire pour récupérer vos données 
                  en cas de réinstallation.
                </p>
              </div>
            </div>
          )}

          {mode === 'import' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Clé de sauvegarde
                </label>
                <textarea
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  placeholder="Collez votre clé de sauvegarde ici..."
                  rows={4}
                  className="w-full px-4 py-3 bg-bg-tertiary border border-bg-tertiary rounded-lg
                            text-text-primary placeholder-text-secondary font-mono text-sm
                            focus:outline-none focus:border-accent-purple resize-none"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-xs text-amber-500">
                  <AlertCircle size={14} className="inline mr-1" />
                  L'importation d'une nouvelle clé remplacera la clé actuelle. 
                  Vos données existantes pourraient devenir inaccessibles.
                </p>
              </div>
            </div>
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
            {mode === 'export' && keyValue ? 'Fermer' : 'Annuler'}
          </button>
          {mode === 'import' && (
            <button
              onClick={handleImport}
              disabled={isLoading || !keyValue.trim()}
              className="flex-1 py-3 bg-accent-purple text-white font-medium rounded-lg
                        hover:bg-accent-purple/90 transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Upload size={18} />
                  Importer
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
