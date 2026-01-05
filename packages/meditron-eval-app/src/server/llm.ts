import OpenAI from 'openai';
import type { LLMConfig } from '../types.js';

export const DEFAULT_CONFIG: LLMConfig = {
  baseUrl: process.env.LM_STUDIO_URL || 'http://localhost:1235/v1',
  model: process.env.LM_STUDIO_MODEL || 'meditron-7b',
  maxTokens: 500,
  temperature: 0.7,
  timeout: parseInt(process.env.LM_STUDIO_TIMEOUT || '60000', 10),
};

export class MeditronClient {
  private client: OpenAI;
  private config: LLMConfig;

  constructor(config: Partial<LLMConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = new OpenAI({
      baseURL: this.config.baseUrl,
      apiKey: 'not-needed', // LM Studio doesn't require an API key
      timeout: this.config.timeout,
    });
  }

  async healthCheck(): Promise<{ ok: boolean; model: string; error?: string }> {
    try {
      const models = await this.client.models.list();
      return {
        ok: true,
        model: this.config.model,
      };
    } catch (error) {
      return {
        ok: false,
        model: this.config.model,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async complete(prompt: string): Promise<string> {
    const systemPrompt = `You are Meditron, a medical AI assistant trained to provide helpful, accurate, and safe medical information. 
Your responses should be:
- Clinically accurate and evidence-based
- Appropriate for African healthcare contexts with resource constraints
- Safety-conscious, always recommending professional medical consultation for serious conditions
- Clear about uncertainty when information is incomplete

Provide concise but comprehensive answers. Include relevant safety warnings and referral recommendations when appropriate.`;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('LLM completion error:', error);
      throw new Error(
        `Failed to get completion: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  getConfig(): LLMConfig {
    return { ...this.config };
  }
}

export const createClient = (config?: Partial<LLMConfig>) => new MeditronClient(config);

