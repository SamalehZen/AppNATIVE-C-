import React, { useEffect, useState } from 'react';
import { 
  Fingerprint, RotateCcw, Download, Type, MessageSquare, 
  Hash, Plus, X, RefreshCw, BookOpen, Sparkles
} from 'lucide-react';
import { StyleProfile as StyleProfileType, DEFAULT_STYLE_PROFILE } from '../../shared/types';
import { ConfidenceBar } from '../components/style/ConfidenceBar';
import { StyleMetricCard } from '../components/style/StyleMetricCard';
import { useSettings } from '../stores/settings';

export const StyleProfile: React.FC = () => {
  const { settings } = useSettings();
  const [profile, setProfile] = useState<StyleProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newTerm, setNewTerm] = useState('');
  const [showAllSamples, setShowAllSamples] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const loadedProfile = await window.electronAPI.getStyleProfile();
      setProfile(loadedProfile);
    } catch (error) {
      console.error('Failed to load style profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser votre profil de style? Toutes les données d\'apprentissage seront perdues.')) {
      await window.electronAPI.clearStyleProfile();
      setProfile(null);
    }
  };

  const handleExport = () => {
    if (!profile) return;
    const dataStr = JSON.stringify(profile, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `style-profile-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddTechnicalTerm = async () => {
    if (!newTerm.trim() || !profile) return;
    const updatedProfile = {
      ...profile,
      vocabulary: {
        ...profile.vocabulary,
        technicalTerms: [...profile.vocabulary.technicalTerms, newTerm.trim().toLowerCase()],
      },
      updatedAt: Date.now(),
    };
    await window.electronAPI.saveStyleProfile(updatedProfile);
    setProfile(updatedProfile);
    setNewTerm('');
  };

  const handleRemoveTechnicalTerm = async (term: string) => {
    if (!profile) return;
    const updatedProfile = {
      ...profile,
      vocabulary: {
        ...profile.vocabulary,
        technicalTerms: profile.vocabulary.technicalTerms.filter(t => t !== term),
      },
      updatedAt: Date.now(),
    };
    await window.electronAPI.saveStyleProfile(updatedProfile);
    setProfile(updatedProfile);
  };

  const minSamples = settings.styleLearning?.minSamplesBeforeUse || 20;
  const styleEnabled = settings.styleLearning?.enabled ?? true;

  const getFormalityLabel = (score: number): string => {
    if (score > 0.7) return 'Formel';
    if (score < 0.3) return 'Casual';
    return 'Neutre';
  };

  const getFormalityBar = (score: number): string => {
    const filled = Math.round(score * 7);
    return '█'.repeat(filled) + '░'.repeat(7 - filled);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
      </div>
    );
  }

  const displayProfile = profile || DEFAULT_STYLE_PROFILE;
  const hasData = profile && profile.trainingStats.totalSamples > 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 overflow-auto h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-purple/20 rounded-xl flex items-center justify-center">
            <Fingerprint size={24} className="text-accent-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Mon Style d'Écriture</h1>
            <p className="text-sm text-text-secondary">L'IA apprend et reproduit votre style personnel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadProfile}
            className="p-2 bg-bg-tertiary hover:bg-bg-secondary rounded-lg transition-colors"
            title="Actualiser"
          >
            <RefreshCw size={18} className="text-text-secondary" />
          </button>
          <button
            onClick={handleExport}
            disabled={!hasData}
            className="p-2 bg-bg-tertiary hover:bg-bg-secondary rounded-lg transition-colors disabled:opacity-50"
            title="Exporter"
          >
            <Download size={18} className="text-text-secondary" />
          </button>
          <button
            onClick={handleReset}
            disabled={!hasData}
            className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors disabled:opacity-50"
            title="Réinitialiser"
          >
            <RotateCcw size={18} className="text-red-400" />
          </button>
        </div>
      </div>

      {!styleEnabled && (
        <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-4">
          <p className="text-sm text-yellow-200">
            L'apprentissage du style est désactivé. Activez-le dans les paramètres pour commencer.
          </p>
        </div>
      )}

      <div className="bg-bg-secondary rounded-xl p-6">
        <ConfidenceBar
          score={displayProfile.trainingStats.confidenceScore}
          samplesCount={displayProfile.trainingStats.totalSamples}
          minSamples={minSamples}
        />
      </div>

      {hasData && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StyleMetricCard
              icon={MessageSquare}
              title="Formalité"
              value={getFormalityLabel(displayProfile.metrics.formalityScore)}
              description={getFormalityBar(displayProfile.metrics.formalityScore)}
            />
            <StyleMetricCard
              icon={Type}
              title="Longueur phrases"
              value={`~${Math.round(displayProfile.metrics.averageSentenceLength)} mots`}
              description="Moyenne par phrase"
            />
            <StyleMetricCard
              icon={Hash}
              title="Vocabulaire"
              value={displayProfile.vocabulary.frequentWords.length}
              description="Mots fréquents"
            />
            <StyleMetricCard
              icon={BookOpen}
              title="Échantillons"
              value={displayProfile.trainingStats.totalSamples}
              description="Textes analysés"
            />
          </div>

          <div className="bg-bg-secondary rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-medium text-text-primary flex items-center gap-2">
              <Sparkles size={18} className="text-accent-purple" />
              Expressions favorites
            </h3>
            <div className="flex flex-wrap gap-2">
              {displayProfile.vocabulary.frequentWords.slice(0, 20).map((word, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-bg-tertiary rounded-full text-sm"
                >
                  <span className="text-text-primary">{word.word}</span>
                  <span className="text-xs text-text-secondary">({word.count}x)</span>
                </span>
              ))}
              {displayProfile.vocabulary.frequentWords.length === 0 && (
                <p className="text-sm text-text-secondary italic">Aucune expression détectée</p>
              )}
            </div>
          </div>

          {(displayProfile.patterns.greetings.length > 0 || 
            displayProfile.patterns.closings.length > 0 ||
            displayProfile.patterns.transitions.length > 0) && (
            <div className="bg-bg-secondary rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-medium text-text-primary">Patterns détectés</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {displayProfile.patterns.greetings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-text-secondary mb-2">Salutations</h4>
                    <div className="flex flex-wrap gap-1">
                      {displayProfile.patterns.greetings.slice(0, 5).map((g, i) => (
                        <span key={i} className="px-2 py-0.5 bg-bg-tertiary rounded text-xs text-text-primary">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {displayProfile.patterns.closings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-text-secondary mb-2">Formules de clôture</h4>
                    <div className="flex flex-wrap gap-1">
                      {displayProfile.patterns.closings.slice(0, 5).map((c, i) => (
                        <span key={i} className="px-2 py-0.5 bg-bg-tertiary rounded text-xs text-text-primary">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {displayProfile.patterns.transitions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-text-secondary mb-2">Transitions</h4>
                    <div className="flex flex-wrap gap-1">
                      {displayProfile.patterns.transitions.slice(0, 5).map((t, i) => (
                        <span key={i} className="px-2 py-0.5 bg-bg-tertiary rounded text-xs text-text-primary">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-bg-secondary rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-text-primary">Vocabulaire technique</h3>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTechnicalTerm()}
                placeholder="Ajouter un terme technique..."
                className="flex-1 bg-bg-tertiary text-text-primary border border-bg-tertiary rounded-lg px-4 py-2
                          focus:border-accent-purple focus:outline-none text-sm"
              />
              <button
                onClick={handleAddTechnicalTerm}
                disabled={!newTerm.trim()}
                className="p-2 bg-accent-purple hover:bg-accent-purple/80 rounded-lg transition-colors disabled:opacity-50"
              >
                <Plus size={18} className="text-white" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {displayProfile.vocabulary.technicalTerms.map((term, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-accent-purple/20 rounded-full text-sm group"
                >
                  <span className="text-accent-purple">{term}</span>
                  <button
                    onClick={() => handleRemoveTechnicalTerm(term)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} className="text-text-secondary hover:text-red-400" />
                  </button>
                </span>
              ))}
              {displayProfile.vocabulary.technicalTerms.length === 0 && (
                <p className="text-sm text-text-secondary italic">
                  Ajoutez des termes techniques à préserver exactement
                </p>
              )}
            </div>
          </div>

          {displayProfile.sampleTexts.length > 0 && (
            <div className="bg-bg-secondary rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-text-primary">Échantillons de référence</h3>
                <button
                  onClick={() => setShowAllSamples(!showAllSamples)}
                  className="text-sm text-accent-purple hover:underline"
                >
                  {showAllSamples ? 'Voir moins' : 'Voir tous'}
                </button>
              </div>
              <div className="space-y-3">
                {displayProfile.sampleTexts
                  .slice(showAllSamples ? 0 : -3)
                  .reverse()
                  .map((sample, index) => (
                    <div key={index} className="p-3 bg-bg-tertiary rounded-lg">
                      <p className="text-sm text-text-primary line-clamp-2">
                        "{sample.text}"
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
                        <span className="px-2 py-0.5 bg-bg-secondary rounded">{sample.context}</span>
                        <span>{new Date(sample.timestamp).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {!hasData && (
        <div className="bg-bg-secondary rounded-xl p-8 text-center">
          <Fingerprint size={48} className="text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            Aucun style appris
          </h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Commencez à dicter du texte pour que l'IA apprenne votre style d'écriture personnel.
            Après {minSamples} échantillons, votre style sera automatiquement appliqué.
          </p>
        </div>
      )}

      <div className="h-6" />
    </div>
  );
};
