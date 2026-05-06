import OpenAI from 'openai';
import { LLMProvider, LLMMessage, LLMResponse, ChatOptions, CompleteOptions } from '../types.js';
import { config } from '../../../config/index.js';

/**
 * Reasoning models bill completion_tokens for hidden "reasoning"; they can burn the entire
 * max_completion_budget before emitting visible text (finish_reason: length).
 *
 * gpt-5-nano defaults to medium reasoning in the API; use `minimal` (not `none`) to leave budget for output.
 * @see https://stackoverflow.com/questions/79837650/turn-off-gpt-5-nano-reasoning
 *
 * Env: OPENAI_REASONING_EFFORT — explicit value, or empty string to omit entirely (e.g. plain GPT-4).
 */
function resolveOpenAIReasoningEffort(model: string): string | undefined {
  const explicit = process.env.OPENAI_REASONING_EFFORT;
  if (explicit === '') return undefined;
  if (explicit) return explicit;

  const m = model.trim().toLowerCase();
  // nano: API ignores unsupported values for some models; minimal reduces reasoning burn vs low/medium
  if (m.includes('nano')) return 'minimal';
  if (m.startsWith('gpt-5') || /^o\d/i.test(m) || m.startsWith('o1')) return 'low';
  return undefined;
}

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

    if (config.debugMode) {
      console.log('[OpenAI] Sending chat request with', messages.length, 'messages');
    }

    const reasoningEffort = resolveOpenAIReasoningEffort(this.model);
    const requestedMax = options?.maxTokens ?? 1024;
    const max_completion_tokens =
      Number.isFinite(requestedMax) && requestedMax > 0 ? requestedMax : 1024;

    const body: Record<string, unknown> = {
      model: this.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_completion_tokens,
    };
    if (options?.stopSequences?.length) {
      body.stop = options.stopSequences;
    }
    if (reasoningEffort) {
      body.reasoning_effort = reasoningEffort;
    }

    if (config.debugMode) {
      console.log('[OpenAI] Request:', {
        model: this.model,
        max_completion_tokens,
        reasoning_effort: reasoningEffort ?? '(omitted)',
      });
    }

    // `body` includes API fields the installed SDK types may not list yet (e.g. reasoning_effort).
    const completion = (await this.client.chat.completions.create(body as any)) as {
      choices: Array<{ message?: { content?: string | null }; finish_reason?: string | null }>;
      model: string;
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        completion_tokens_details?: { reasoning_tokens?: number };
      };
    };

    if (config.debugMode) {
      const rawContent = completion.choices[0]?.message?.content || '';
      const preview =
        rawContent.length > 200 ? `${rawContent.slice(0, 200)}...` : rawContent || '(empty)';
      console.log('[OpenAI] Response:', {
        contentPreview: preview,
        usage: completion.usage,
        finish_reason: completion.choices[0]?.finish_reason,
        reasoning_effort: reasoningEffort ?? '(omitted)',
      });
      const fr = completion.choices[0]?.finish_reason;
      if (fr === 'length' && rawContent.trim().length === 0) {
        console.warn(
          '[OpenAI] Hit max_completion_tokens with no visible content — raise LLM_SUMMARY_MAX_TOKENS or set OPENAI_REASONING_EFFORT (e.g. minimal for gpt-5-nano).'
        );
      }
    }

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

