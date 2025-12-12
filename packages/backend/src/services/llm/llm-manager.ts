/**
 * LLM Manager
 * 
 * Manages multiple LLM providers and allows switching between them.
 */

import { config } from "../../config";
import { LLMProvider, LLMProviderType, LLMResponse, LLMMessage, LLMProviderInfo, LLMConfig } from "./types";
import { LMStudioProvider, OpenAIProvider } from "./providers";

export class LLMManager {
  private providers: Map<LLMProviderType, LLMProvider>;
  private activeProvider: LLMProviderType;

  constructor() {
    this.providers = new Map();
    
    // Initialize providers with config
    this.providers.set("lm-studio", new LMStudioProvider({
      baseUrl: config.llm.lmStudio.url,
      model: config.llm.lmStudio.model,
      timeout: config.llm.lmStudio.timeout,
    }));
    
    this.providers.set("openai", new OpenAIProvider({
      apiKey: config.llm.openai.apiKey,
      model: config.llm.openai.model,
      timeout: config.llm.openai.timeout,
    }));
    
    // Set default provider from config
    this.activeProvider = config.llm.defaultProvider;
  }

  /**
   * Get the current active provider
   */
  getActiveProvider(): LLMProvider {
    const provider = this.providers.get(this.activeProvider);
    if (!provider) {
      throw new Error(`Provider not found: ${this.activeProvider}`);
    }
    return provider;
  }

  /**
   * Get active provider type
   */
  getActiveProviderType(): LLMProviderType {
    return this.activeProvider;
  }

  /**
   * Set the active provider
   */
  setActiveProvider(type: LLMProviderType): void {
    if (!this.providers.has(type)) {
      throw new Error(`Unknown provider: ${type}`);
    }
    this.activeProvider = type;
    console.log(`[LLMManager] Switched to provider: ${type}`);
  }

  /**
   * Get a specific provider
   */
  getProvider(type: LLMProviderType): LLMProvider | undefined {
    return this.providers.get(type);
  }

  /**
   * Get all available providers
   */
  async getAllProviders(): Promise<LLMProviderInfo[]> {
    const infos: LLMProviderInfo[] = [];
    
    for (const [type, provider] of this.providers) {
      const config = provider.getConfig();
      const isConfigured = type === "lm-studio" || !!config.apiKey;
      
      infos.push({
        type,
        name: provider.name,
        available: provider.getAvailabilityStatus(),
        model: config.model,
        configured: isConfigured
      });
    }
    
    return infos;
  }

  /**
   * Check availability of all providers
   */
  async checkAllAvailability(): Promise<Map<LLMProviderType, boolean>> {
    const results = new Map<LLMProviderType, boolean>();
    
    const checks = Array.from(this.providers.entries()).map(async ([type, provider]) => {
      const available = await provider.checkAvailability();
      results.set(type, available);
    });
    
    await Promise.all(checks);
    return results;
  }

  /**
   * Complete a prompt using the active provider
   */
  async complete(prompt: string): Promise<LLMResponse> {
    return this.getActiveProvider().complete(prompt);
  }

  /**
   * Chat completion using the active provider
   */
  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    return this.getActiveProvider().chat(messages);
  }

  /**
   * Update configuration for a specific provider
   */
  updateProviderConfig(type: LLMProviderType, config: Partial<LLMConfig>): void {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Unknown provider: ${type}`);
    }
    provider.updateConfig(config);
  }

  /**
   * Get status summary
   */
  async getStatus(): Promise<{
    activeProvider: LLMProviderType;
    providers: LLMProviderInfo[];
  }> {
    return {
      activeProvider: this.activeProvider,
      providers: await this.getAllProviders()
    };
  }
}

// Export singleton instance
export const llmManager = new LLMManager();

