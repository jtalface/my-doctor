/**
 * LLM Provider Types
 * 
 * Defines the interface for LLM providers and response types.
 */

export type LLMProviderType = "lm-studio" | "openai" | "anthropic";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  source: "llm" | "fallback";
  provider: LLMProviderType;
  model?: string;
  error?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface LLMConfig {
  apiKey?: string;
  baseUrl?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export interface LLMProvider {
  readonly type: LLMProviderType;
  readonly name: string;
  
  /**
   * Check if the provider is available/configured
   */
  checkAvailability(): Promise<boolean>;
  
  /**
   * Get current availability status (cached)
   */
  getAvailabilityStatus(): boolean | null;
  
  /**
   * Complete a single prompt
   */
  complete(prompt: string): Promise<LLMResponse>;
  
  /**
   * Chat completion with message history
   */
  chat(messages: LLMMessage[]): Promise<LLMResponse>;
  
  /**
   * Get the current configuration
   */
  getConfig(): LLMConfig;
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<LLMConfig>): void;
}

export interface LLMProviderInfo {
  type: LLMProviderType;
  name: string;
  available: boolean | null;
  model: string;
  configured: boolean;
}

