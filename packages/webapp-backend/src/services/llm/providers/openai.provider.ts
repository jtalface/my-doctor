import OpenAI from 'openai';
import { LLMProvider, LLMMessage, LLMResponse, ChatOptions, CompleteOptions } from '../types.js';
import { config } from '../../../config/index.js';

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  private _isAvailable = false;
  private client: OpenAI | null = null;
  private model: string;

  constructor() {
    this.model = config.openai.model;
    
    if (config.openai.apiKey) {
      this.client = new OpenAI({ apiKey: config.openai.apiKey });
    }
  }

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  async initialize(): Promise<void> {
    await this.checkAvailability();
  }

  async checkAvailability(): Promise<boolean> {
    if (!this.client || !config.openai.apiKey) {
      this._isAvailable = false;
      if (config.debugMode) {
        console.log('[OpenAI] Not configured - missing API key');
      }
      return false;
    }

    try {
      // Simple models list call to verify API key
      await this.client.models.list();
      this._isAvailable = true;
      
      if (config.debugMode) {
        console.log('[OpenAI] Available and configured');
      }
      
      return true;
    } catch (error) {
      this._isAvailable = false;
      if (config.debugMode) {
        console.log('[OpenAI] Not available:', error instanceof Error ? error.message : 'Unknown error');
      }
      return false;
    }
  }

  async chat(messages: LLMMessage[], options?: ChatOptions): Promise<LLMResponse> {
    if (!this._isAvailable || !this.client) {
      throw new Error('OpenAI is not available');
    }

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_completion_tokens: options?.maxTokens || 512,
      stop: options?.stopSequences,
    });

    return {
      content: completion.choices[0]?.message?.content || '',
      model: completion.model,
      usage: completion.usage ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens,
      } : undefined,
    };
  }

  async complete(prompt: string, options?: CompleteOptions): Promise<LLMResponse> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  getInfo() {
    return {
      name: this.name,
      isAvailable: this._isAvailable,
      model: this.model,
    };
  }
}

