import { LLMProvider, LLMProviderInfo } from './types.js';
import { LMStudioProvider } from './providers/lm-studio.provider.js';
import { OpenAIProvider } from './providers/openai.provider.js';
import { config } from '../../config/index.js';

export class LLMManager {
  private providers: Map<string, LLMProvider> = new Map();
  private activeProvider: string;
  private initialized = false;

  constructor() {
    this.activeProvider = config.defaultLLMProvider;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Register providers
    const lmStudio = new LMStudioProvider();
    const openai = new OpenAIProvider();

    this.providers.set('lm-studio', lmStudio);
    this.providers.set('openai', openai);

    // Initialize all providers
    await Promise.all([
      lmStudio.initialize(),
      openai.initialize(),
    ]);

    // Verify active provider is available
    const active = this.providers.get(this.activeProvider);
    if (!active?.isAvailable) {
      // Try to find an available provider
      for (const [name, provider] of this.providers) {
        if (provider.isAvailable) {
          this.activeProvider = name;
          console.log(`[LLMManager] Switched to available provider: ${name}`);
          break;
        }
      }
    }

    this.initialized = true;
    console.log(`[LLMManager] Initialized with active provider: ${this.activeProvider}`);
  }

  getActiveProvider(): LLMProvider {
    const provider = this.providers.get(this.activeProvider);
    if (!provider) {
      throw new Error(`Provider ${this.activeProvider} not found`);
    }
    return provider;
  }

  getProvider(name: string): LLMProvider | undefined {
    return this.providers.get(name);
  }

  setActiveProvider(name: string): boolean {
    const provider = this.providers.get(name);
    if (!provider) {
      return false;
    }
    if (!provider.isAvailable) {
      console.warn(`[LLMManager] Provider ${name} is not available`);
    }
    this.activeProvider = name;
    return true;
  }

  getActiveProviderName(): string {
    return this.activeProvider;
  }

  getAllProviders(): LLMProviderInfo[] {
    const providers: LLMProviderInfo[] = [];
    for (const [name, provider] of this.providers) {
      const info = (provider as any).getInfo?.() || {
        name,
        isAvailable: provider.isAvailable,
        model: 'unknown',
      };
      providers.push(info);
    }
    return providers;
  }

  async refreshAvailability(): Promise<void> {
    for (const provider of this.providers.values()) {
      await provider.checkAvailability();
    }
  }
}

// Singleton instance
export const llmManager = new LLMManager();

