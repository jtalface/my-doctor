import { LLMProvider, LLMMessage, LLMResponse, ChatOptions, CompleteOptions } from '../types.js';
import { config } from '../../../config/index.js';

export class LMStudioProvider implements LLMProvider {
  readonly name = 'lm-studio';
  private _isAvailable = false;
  private url: string;
  private model: string;
  private timeout: number;

  constructor() {
    this.url = config.lmStudio.url;
    this.model = config.lmStudio.model;
    this.timeout = config.lmStudio.timeout;
  }

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  async initialize(): Promise<void> {
    await this.checkAvailability();
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.url}/v1/models`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this._isAvailable = response.ok;
      
      if (config.debugMode) {
        console.log(`[LMStudio] Availability check: ${this._isAvailable}`);
      }
      
      return this._isAvailable;
    } catch (error) {
      this._isAvailable = false;
      if (config.debugMode) {
        console.log('[LMStudio] Not available:', error instanceof Error ? error.message : 'Unknown error');
      }
      return false;
    }
  }

  async chat(messages: LLMMessage[], options?: ChatOptions): Promise<LLMResponse> {
    if (!this._isAvailable) {
      throw new Error('LM Studio is not available');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.url}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: options?.maxTokens || 512,
          temperature: options?.temperature || 0.7,
          stop: options?.stopSequences,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`LM Studio API error: ${response.status}`);
      }

      const json = await response.json() as {
        choices: Array<{ message: { content: string } }>;
        model: string;
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      };

      return {
        content: json.choices[0]?.message?.content || '',
        model: json.model || this.model,
        usage: json.usage ? {
          promptTokens: json.usage.prompt_tokens,
          completionTokens: json.usage.completion_tokens,
          totalTokens: json.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async complete(prompt: string, options?: CompleteOptions): Promise<LLMResponse> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  getInfo() {
    return {
      name: this.name,
      isAvailable: this._isAvailable,
      model: this.model,
      url: this.url,
    };
  }
}

