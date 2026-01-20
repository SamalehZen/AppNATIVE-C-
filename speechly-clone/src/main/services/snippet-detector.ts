import { Snippet, SnippetDetectionResult, SnippetProcessResult, SnippetReplacement } from '../../shared/types';
import { getSnippets, incrementSnippetUsage } from '../database';

export class SnippetDetector {
  private snippets: Snippet[] = [];
  private lastLoadTime: number = 0;
  private readonly CACHE_TTL = 5000;

  async loadSnippets(): Promise<void> {
    const now = Date.now();
    if (now - this.lastLoadTime < this.CACHE_TTL && this.snippets.length > 0) {
      return;
    }
    
    this.snippets = getSnippets().filter(s => s.isActive && s.content);
    this.lastLoadTime = now;
  }

  detectTrigger(transcript: string): SnippetDetectionResult {
    const lowerTranscript = transcript.toLowerCase();
    
    for (const snippet of this.snippets) {
      const allTriggers = [snippet.triggerPhrase, ...snippet.triggerVariants];
      
      for (const trigger of allTriggers) {
        const lowerTrigger = trigger.toLowerCase();
        const index = lowerTranscript.indexOf(lowerTrigger);
        
        if (index !== -1) {
          return {
            snippet,
            matchedPhrase: transcript.substring(index, index + trigger.length),
            position: { start: index, end: index + trigger.length },
          };
        }
      }
    }
    
    return {
      snippet: null,
      matchedPhrase: '',
      position: { start: -1, end: -1 },
    };
  }

  processTranscript(transcript: string): SnippetProcessResult {
    let processedText = transcript;
    const replacements: SnippetReplacement[] = [];
    const lowerTranscript = transcript.toLowerCase();
    const usedSnippets = new Set<string>();
    
    for (const snippet of this.snippets) {
      if (usedSnippets.has(snippet.id)) continue;
      
      const allTriggers = [snippet.triggerPhrase, ...snippet.triggerVariants];
      
      for (const trigger of allTriggers) {
        const lowerTrigger = trigger.toLowerCase();
        let searchStart = 0;
        let found = false;
        
        while (true) {
          const lowerProcessed = processedText.toLowerCase();
          const index = lowerProcessed.indexOf(lowerTrigger, searchStart);
          
          if (index === -1) break;
          
          const originalTrigger = processedText.substring(index, index + trigger.length);
          const before = processedText.substring(0, index);
          const after = processedText.substring(index + trigger.length);
          processedText = before + snippet.content + after;
          
          if (!found) {
            replacements.push({
              trigger: originalTrigger,
              value: snippet.content,
              snippetId: snippet.id,
            });
            found = true;
          }
          
          searchStart = index + snippet.content.length;
        }
        
        if (found) {
          usedSnippets.add(snippet.id);
          incrementSnippetUsage(snippet.id);
          break;
        }
      }
    }
    
    return { processedText, replacements };
  }

  getActiveSnippets(): Snippet[] {
    return this.snippets;
  }

  invalidateCache(): void {
    this.lastLoadTime = 0;
    this.snippets = [];
  }
}

let snippetDetectorInstance: SnippetDetector | null = null;

export function getSnippetDetector(): SnippetDetector {
  if (!snippetDetectorInstance) {
    snippetDetectorInstance = new SnippetDetector();
  }
  return snippetDetectorInstance;
}
