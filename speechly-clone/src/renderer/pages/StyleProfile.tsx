import React, { useEffect, useState, useCallback } from 'react';
import {
  Fingerprint,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Type,
  MessageSquare,
  BarChart3,
} from 'lucide-react';
import {
  ConfidenceBar,
  StyleMetricCard,
  PatternsList,
  VocabularyManager,
  SampleTextsList,
} from '../components/style';
import { StyleProfile as StyleProfileType } from '../../shared/types';
import { DEFAULT_STYLE_PROFILE } from '../../shared/constants';
import { useSettings } from '../stores/settings';

export const StyleProfile: React.FC = () => {
  const { settings } = useSettings();
  const [profile, setProfile] = useState<StyleProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await window.electronAPI.getStyleProfile();
      setProfile(data || { ...DEFAULT_STYLE_PROFILE });
    } catch (error) {
      console.error('Failed to load style profile:', error);
      setProfile({ ...DEFAULT_STYLE_PROFILE });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleReset = async () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser votre profil de style ? Cette action est irréversible.')) {
      try {
        await window.electronAPI.clearStyleProfile();
        await loadProfile();
      } catch (error) {
        console.error('Failed to reset style profile:', error);
      }
    }
  };

  const handleExport = async () => {
    try {
      const data = await window.electronAPI.exportStyleProfile();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speechly-style-profile-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export style profile:', error);
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          await window.electronAPI.importStyleProfile(text);
          await loadProfile();
        } catch (error) {
          console.error('Failed to import style profile:', error);
          alert('Erreur lors de l\'import du profil. Vérifiez le format du fichier.');
        }
      }
    };
    input.click();
  };

  const handleAddTechnicalTerm = async (term: string) => {
    if (!profile) return;
    const updatedProfile = {
      ...profile,
      vocabulary: {
        ...profile.vocabulary,
        technicalTerms: [...profile.vocabulary.technicalTerms, term.toLowerCase()],
      },
      updatedAt: Date.now(),
    };
    setProfile(updatedProfile);
    await window.electronAPI.saveStyleProfile(updatedProfile);
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
    setProfile(updatedProfile);
    await window.electronAPI.saveStyleProfile(updatedProfile);
  };

  const getFormalityLabel = (score: number) => {
    if (score >= 0.7) return 'Formel';
    if (score <= 0.3) return 'Informel';
    return 'Neutre';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-secondary">Erreur lors du chargement du profil</p>
      </div>
    );
  }

  const minSamples = settings?.styleLearning?.minSamplesBeforeUse || 20;
  const isActive = profile.trainingStats.totalSamples >= minSamples && settings?.styleLearning?.enabled;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 overflow-auto h-full">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-purple to-accent-green rounded-xl flex items-center justify-center">
            <Fingerprint size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Mon Style d'Écriture</h1>
            <p className="text-sm text-text-secondary">
              {isActive ? 'Style actif' : 'En apprentissage'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadProfile}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
            title="Actualiser"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={handleExport}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
            title="Exporter"
          >
            <Download size={18} />
          </button>
          <button
            onClick={handleImport}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
            title="Importer"
          >
            <Upload size={18} />
          </button>
          <button
            onClick={handleReset}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Réinitialiser"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <ConfidenceBar
        score={profile.trainingStats.confidenceScore}
        samplesCount={profile.trainingStats.totalSamples}
        minSamples={minSamples}
      />

      <section>
        <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
          <BarChart3 size={16} />
          Caractéristiques apprises
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StyleMetricCard
            title="Formalité"
            value={getFormalityLabel(profile.metrics.formalityScore)}
            icon={MessageSquare}
            description={`Score: ${Math.round(profile.metrics.formalityScore * 100)}%`}
            variant={profile.metrics.formalityScore >= 0.7 ? 'accent' : 'default'}
          />
          <StyleMetricCard
            title="Longueur phrases"
            value={`~${Math.round(profile.metrics.averageSentenceLength)} mots`}
            icon={Type}
            description="Moyenne par phrase"
          />
          <StyleMetricCard
            title="Richesse vocab."
            value={`${Math.round(profile.metrics.vocabularyRichness * 100)}%`}
            icon={Type}
            description="Diversité lexicale"
          />
          <StyleMetricCard
            title="Échantillons"
            value={profile.trainingStats.totalSamples}
            icon={BarChart3}
            description="Textes analysés"
            variant={profile.trainingStats.totalSamples >= minSamples ? 'accent' : 'warning'}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-text-secondary mb-3">
          Expressions favorites
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <PatternsList
            title="Salutations"
            patterns={profile.patterns.greetings.map(text => ({ text }))}
            emptyMessage="Dictez des messages avec salutations pour apprendre"
          />
          <PatternsList
            title="Formules de conclusion"
            patterns={profile.patterns.closings.map(text => ({ text }))}
            emptyMessage="Dictez des messages avec conclusions pour apprendre"
          />
        </div>
      </section>

      <section>
        <PatternsList
          title="Mots de transition préférés"
          patterns={profile.patterns.transitions.map(text => ({ text }))}
          maxDisplay={15}
          emptyMessage="Les transitions seront détectées automatiquement"
        />
      </section>

      <section>
        <h2 className="text-sm font-medium text-text-secondary mb-3">
          Vocabulaire fréquent
        </h2>
        <PatternsList
          title="Mots les plus utilisés"
          patterns={profile.vocabulary.frequentWords.slice(0, 20).map(w => ({
            text: w.word,
            count: w.count,
          }))}
          maxDisplay={20}
          emptyMessage="Le vocabulaire sera appris au fil des dictées"
        />
      </section>

      <section>
        <VocabularyManager
          technicalTerms={profile.vocabulary.technicalTerms}
          onAddTerm={handleAddTechnicalTerm}
          onRemoveTerm={handleRemoveTechnicalTerm}
        />
      </section>

      <section>
        <SampleTextsList
          samples={profile.sampleTexts}
          maxInitialDisplay={5}
        />
      </section>

      {profile.trainingStats.lastTrainingDate > 0 && (
        <footer className="text-xs text-text-secondary text-center pt-4 border-t border-bg-tertiary">
          Dernière mise à jour:{' '}
          {new Date(profile.trainingStats.lastTrainingDate).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </footer>
      )}
    </div>
  );
};
