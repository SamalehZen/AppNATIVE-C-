import appContexts from '../../data/app-contexts.json';

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

export interface ActiveWindowInfo {
  title: string;
  processName: string;
  bundleId: string;
  executablePath: string;
  pid: number;
  isValid: boolean;
}

export interface DetectedContext {
  type: ContextType;
  name: string;
  icon: string;
  appName: string;
  confidence: 'high' | 'medium' | 'low';
  subContext?: string;
}

interface AppDefinition {
  process?: string;
  bundleId?: string;
  urlPattern?: string;
  name: string;
}

interface ContextDefinition {
  name: string;
  icon: string;
  description: string;
  apps: {
    windows?: AppDefinition[];
    macos?: AppDefinition[];
    web?: AppDefinition[];
  };
}

type ContextsMap = Record<string, ContextDefinition>;

export class ContextDetector {
  private platform: 'windows' | 'macos' | 'linux';
  private contexts: ContextsMap;
  private browserProcessNames: Set<string>;
  private browserBundleIds: Set<string>;
  private cachedContext: DetectedContext | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 500;

  constructor() {
    this.platform = this.detectPlatform();
    this.contexts = (appContexts as any).contexts as ContextsMap;
    this.browserProcessNames = new Set<string>();
    this.browserBundleIds = new Set<string>();
    this.initBrowserCache();
  }

  private detectPlatform(): 'windows' | 'macos' | 'linux' {
    if (process.platform === 'darwin') return 'macos';
    if (process.platform === 'win32') return 'windows';
    return 'linux';
  }

  private initBrowserCache(): void {
    const browserContext = this.contexts.browser;
    if (!browserContext) return;

    const windowsApps = browserContext.apps.windows || [];
    const macosApps = browserContext.apps.macos || [];

    windowsApps.forEach((app) => {
      if (app.process) {
        this.browserProcessNames.add(app.process.toLowerCase());
      }
    });

    macosApps.forEach((app) => {
      if (app.bundleId) {
        this.browserBundleIds.add(app.bundleId);
      }
    });
  }

  detectContext(windowInfo: ActiveWindowInfo): DetectedContext {
    const now = Date.now();
    if (
      this.cachedContext &&
      now - this.cacheTimestamp < this.CACHE_TTL_MS &&
      this.isSameWindow(windowInfo)
    ) {
      return this.cachedContext;
    }

    const startTime = performance.now();
    let result: DetectedContext;

    const browserContext = this.detectBrowserContext(windowInfo);
    if (browserContext) {
      result = browserContext;
    } else {
      result = this.detectNativeAppContext(windowInfo);
    }

    const elapsed = performance.now() - startTime;
    if (elapsed > 50) {
      console.warn(`Context detection took ${elapsed.toFixed(1)}ms`);
    }

    this.cachedContext = result;
    this.cacheTimestamp = now;
    this.lastWindowTitle = windowInfo.title;
    this.lastProcessName = windowInfo.processName;

    return result;
  }

  private lastWindowTitle: string = '';
  private lastProcessName: string = '';

  private isSameWindow(windowInfo: ActiveWindowInfo): boolean {
    return (
      windowInfo.title === this.lastWindowTitle &&
      windowInfo.processName === this.lastProcessName
    );
  }

  private isBrowser(windowInfo: ActiveWindowInfo): boolean {
    if (this.platform === 'macos' && windowInfo.bundleId) {
      return this.browserBundleIds.has(windowInfo.bundleId);
    }
    return this.browserProcessNames.has(windowInfo.processName.toLowerCase());
  }

  private detectBrowserContext(
    windowInfo: ActiveWindowInfo
  ): DetectedContext | null {
    if (!this.isBrowser(windowInfo)) {
      return null;
    }

    const title = windowInfo.title.toLowerCase();

    for (const [contextType, contextData] of Object.entries(this.contexts)) {
      if (contextType === 'browser') continue;

      const webApps = contextData.apps?.web || [];

      for (const webApp of webApps) {
        if (!webApp.urlPattern) continue;

        const pattern = webApp.urlPattern.toLowerCase();
        if (title.includes(pattern) || title.includes(webApp.name.toLowerCase())) {
          return {
            type: contextType as ContextType,
            name: contextData.name,
            icon: contextData.icon,
            appName: webApp.name,
            confidence: 'medium',
            subContext: this.detectSubContext(windowInfo, contextType),
          };
        }
      }
    }

    return {
      type: 'browser',
      name: 'Navigateur',
      icon: 'globe',
      appName: this.getBrowserName(windowInfo),
      confidence: 'low',
    };
  }

  private getBrowserName(windowInfo: ActiveWindowInfo): string {
    const browserContext = this.contexts.browser;
    if (!browserContext) return windowInfo.processName;

    const platformApps =
      this.platform === 'macos'
        ? browserContext.apps.macos || []
        : browserContext.apps.windows || [];

    for (const app of platformApps) {
      if (this.matchesApp(windowInfo, app)) {
        return app.name;
      }
    }

    return windowInfo.processName;
  }

  private detectNativeAppContext(windowInfo: ActiveWindowInfo): DetectedContext {
    const platformKey = this.platform === 'linux' ? 'windows' : this.platform;

    for (const [contextType, contextData] of Object.entries(this.contexts)) {
      const apps = (contextData.apps as any)[platformKey] || [];

      for (const app of apps) {
        if (this.matchesApp(windowInfo, app)) {
          return {
            type: contextType as ContextType,
            name: contextData.name,
            icon: contextData.icon,
            appName: app.name,
            confidence: 'high',
            subContext: this.detectSubContext(windowInfo, contextType),
          };
        }
      }
    }

    return {
      type: 'general',
      name: 'Général',
      icon: 'edit',
      appName: windowInfo.processName || 'Unknown',
      confidence: 'low',
    };
  }

  private detectSubContext(
    windowInfo: ActiveWindowInfo,
    contextType: string
  ): string | undefined {
    const title = windowInfo.title.toLowerCase();

    switch (contextType) {
      case 'email':
        return this.detectEmailSubContext(title);
      case 'code':
        return this.detectCodeSubContext(title);
      case 'chat':
        return this.detectChatSubContext(title);
      case 'document':
        return this.detectDocumentSubContext(title);
      default:
        return undefined;
    }
  }

  private detectEmailSubContext(title: string): string | undefined {
    const composePatterns = [
      'compose',
      'nouveau',
      'new message',
      'new email',
      'rédiger',
      'nouveau message',
    ];
    const replyPatterns = ['reply', 'répondre', 're:', 'response'];
    const forwardPatterns = ['forward', 'transférer', 'fwd:', 'tr:'];

    for (const pattern of composePatterns) {
      if (title.includes(pattern)) return 'compose';
    }
    for (const pattern of replyPatterns) {
      if (title.includes(pattern)) return 'reply';
    }
    for (const pattern of forwardPatterns) {
      if (title.includes(pattern)) return 'forward';
    }

    return undefined;
  }

  private detectCodeSubContext(title: string): string | undefined {
    const extensionMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'cpp',
      '.rs': 'rust',
      '.go': 'go',
      '.rb': 'ruby',
      '.php': 'php',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.cs': 'csharp',
      '.vue': 'vue',
      '.svelte': 'svelte',
      '.css': 'css',
      '.scss': 'scss',
      '.html': 'html',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
    };

    for (const [ext, lang] of Object.entries(extensionMap)) {
      if (title.includes(ext)) {
        return `editing:${lang}`;
      }
    }

    if (title.includes('commit') || title.includes('git')) {
      return 'git';
    }
    if (title.includes('terminal') || title.includes('console')) {
      return 'terminal';
    }
    if (title.includes('debug')) {
      return 'debug';
    }

    return undefined;
  }

  private detectChatSubContext(title: string): string | undefined {
    if (title.includes('thread') || title.includes('fil')) {
      return 'thread';
    }
    if (title.includes('channel') || title.includes('canal')) {
      return 'channel';
    }
    if (title.includes('dm') || title.includes('direct')) {
      return 'direct';
    }
    if (title.includes('call') || title.includes('appel') || title.includes('meeting')) {
      return 'call';
    }

    return undefined;
  }

  private detectDocumentSubContext(title: string): string | undefined {
    if (title.includes('untitled') || title.includes('sans titre') || title.includes('nouveau')) {
      return 'new';
    }
    if (title.includes('- editing') || title.includes('modification')) {
      return 'editing';
    }

    return undefined;
  }

  private matchesApp(windowInfo: ActiveWindowInfo, app: AppDefinition): boolean {
    if (this.platform === 'macos' && app.bundleId && windowInfo.bundleId) {
      return windowInfo.bundleId === app.bundleId;
    }
    if (app.process && windowInfo.processName) {
      return windowInfo.processName.toLowerCase() === app.process.toLowerCase();
    }
    return false;
  }

  getDefaultContext(): DetectedContext {
    return {
      type: 'general',
      name: 'Général',
      icon: 'edit',
      appName: 'Unknown',
      confidence: 'low',
    };
  }

  getSupportedContexts(): Array<{ type: ContextType; name: string; icon: string }> {
    const contexts: Array<{ type: ContextType; name: string; icon: string }> = [];

    for (const [type, data] of Object.entries(this.contexts)) {
      contexts.push({
        type: type as ContextType,
        name: data.name,
        icon: data.icon,
      });
    }

    contexts.push({
      type: 'general',
      name: 'Général',
      icon: 'edit',
    });

    return contexts;
  }

  clearCache(): void {
    this.cachedContext = null;
    this.cacheTimestamp = 0;
  }
}

let detectorInstance: ContextDetector | null = null;

export function getContextDetector(): ContextDetector {
  if (!detectorInstance) {
    detectorInstance = new ContextDetector();
  }
  return detectorInstance;
}

export function detectContextFromWindow(
  windowInfo: ActiveWindowInfo
): DetectedContext {
  return getContextDetector().detectContext(windowInfo);
}
