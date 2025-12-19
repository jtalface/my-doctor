export interface LLMConfig {
  provider: 'lm-studio' | 'openai';
  url?: string;
  apiKey?: string;
  model: string;
  timeout: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  readonly name: string;
  readonly isAvailable: boolean;
  
  initialize(): Promise<void>;
  checkAvailability(): Promise<boolean>;
  chat(messages: LLMMessage[], options?: ChatOptions): Promise<LLMResponse>;
  complete(prompt: string, options?: CompleteOptions): Promise<LLMResponse>;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface CompleteOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface LLMProviderInfo {
  name: string;
  isAvailable: boolean;
  model: string;
  url?: string;
}
