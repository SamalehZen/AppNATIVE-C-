import React from 'react';

export type ContextType =
  | 'email'
  | 'chat'
  | 'code'
  | 'document'
  | 'browser'
  | 'social'
  | 'ai'
  | 'spreadsheet'
  | 'terminal'
  | 'general';

export interface DetectedContext {
  type: ContextType;
  name: string;
  icon: string;
  appName: string;
  confidence: 'high' | 'medium' | 'low';
  subContext?: string;
}

interface Props {
  context: DetectedContext | null;
  isDetecting: boolean;
  onOverride?: (contextType: ContextType) => void;
  compact?: boolean;
}

const IconMail: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconMessageCircle: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const IconCode: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const IconFileText: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconGlobe: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconShare: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const IconBot: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);

const IconTable: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);

const IconTerminal: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const IconEdit: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconCheck: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconAlert: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  mail: IconMail,
  'message-circle': IconMessageCircle,
  code: IconCode,
  'file-text': IconFileText,
  globe: IconGlobe,
  'share-2': IconShare,
  bot: IconBot,
  table: IconTable,
  terminal: IconTerminal,
  edit: IconEdit,
};

const confidenceConfig = {
  high: {
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/30',
    label: 'Détection précise',
  },
  medium: {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    borderColor: 'border-yellow-400/30',
    label: 'Détection probable',
  },
  low: {
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
    borderColor: 'border-gray-400/30',
    label: 'Contexte général',
  },
};

export const ContextIndicator: React.FC<Props> = ({
  context,
  isDetecting,
  onOverride,
  compact = false,
}) => {
  if (isDetecting) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary rounded-lg">
        <div className="animate-pulse w-4 h-4 bg-gray-600 rounded-full" />
        <span className="text-sm text-text-secondary">Détection...</span>
      </div>
    );
  }

  if (!context) {
    return null;
  }

  const Icon = iconMap[context.icon] || IconEdit;
  const config = confidenceConfig[context.confidence];

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-2 py-1 rounded-md ${config.bgColor} border ${config.borderColor}`}
        title={`${context.name} - ${context.appName}`}
      >
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        <span className={`text-xs font-medium ${config.color}`}>
          {context.name}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 bg-bg-tertiary/50 rounded-lg border ${config.borderColor} transition-all`}
    >
      <div className={`p-2 rounded-md ${config.bgColor}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">
            {context.name}
          </span>
          {context.confidence === 'high' && (
            <IconCheck className="w-3 h-3 text-green-400 flex-shrink-0" />
          )}
          {context.confidence === 'low' && (
            <IconAlert className="w-3 h-3 text-gray-400 flex-shrink-0" />
          )}
        </div>
        <span className="text-xs text-text-secondary truncate">
          {context.appName}
        </span>
      </div>

      {context.subContext && (
        <span className="ml-auto text-xs px-2 py-1 bg-bg-secondary rounded text-text-secondary flex-shrink-0">
          {formatSubContext(context.subContext)}
        </span>
      )}

      {onOverride && (
        <button
          onClick={() => onOverride(context.type)}
          className="ml-2 p-1 rounded hover:bg-bg-secondary transition-colors"
          title="Changer le contexte"
        >
          <svg
            className="w-3.5 h-3.5 text-text-secondary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </div>
  );
};

function formatSubContext(subContext: string): string {
  const mapping: Record<string, string> = {
    compose: 'Nouveau',
    reply: 'Réponse',
    forward: 'Transfert',
    thread: 'Thread',
    channel: 'Canal',
    direct: 'DM',
    call: 'Appel',
    new: 'Nouveau',
    editing: 'Édition',
    git: 'Git',
    terminal: 'Terminal',
    debug: 'Debug',
  };

  if (subContext.startsWith('editing:')) {
    const lang = subContext.split(':')[1];
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  }

  return mapping[subContext] || subContext;
}

interface ContextSelectorProps {
  currentContext: ContextType;
  onSelect: (context: ContextType) => void;
  isOpen: boolean;
  onClose: () => void;
}

const allContexts: Array<{ type: ContextType; name: string; icon: string }> = [
  { type: 'email', name: 'Email', icon: 'mail' },
  { type: 'chat', name: 'Messagerie', icon: 'message-circle' },
  { type: 'code', name: 'Code', icon: 'code' },
  { type: 'document', name: 'Document', icon: 'file-text' },
  { type: 'browser', name: 'Navigateur', icon: 'globe' },
  { type: 'social', name: 'Réseaux sociaux', icon: 'share-2' },
  { type: 'ai', name: 'Assistant IA', icon: 'bot' },
  { type: 'spreadsheet', name: 'Tableur', icon: 'table' },
  { type: 'terminal', name: 'Terminal', icon: 'terminal' },
  { type: 'general', name: 'Général', icon: 'edit' },
];

export const ContextSelector: React.FC<ContextSelectorProps> = ({
  currentContext,
  onSelect,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full mt-2 right-0 z-50 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-xl p-2 min-w-[200px]">
      <div className="text-xs text-text-secondary px-2 py-1 mb-1">
        Forcer le contexte
      </div>
      {allContexts.map((ctx) => {
        const Icon = iconMap[ctx.icon] || IconEdit;
        const isSelected = ctx.type === currentContext;

        return (
          <button
            key={ctx.type}
            onClick={() => {
              onSelect(ctx.type);
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isSelected
                ? 'bg-accent-purple/20 text-accent-purple'
                : 'hover:bg-bg-tertiary text-text-primary'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm">{ctx.name}</span>
            {isSelected && (
              <IconCheck className="w-3 h-3 ml-auto text-accent-purple" />
            )}
          </button>
        );
      })}
    </div>
  );
};
