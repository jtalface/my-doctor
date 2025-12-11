/**
 * LM Studio Provider
 * 
 * Connects to a local LM Studio instance running Meditron or other models.
 */

import { LLMProvider, LLMConfig, LLMMessage, LLMResponse } from "../types";

const DEFAULT_CONFIG: LLMConfig = {
  baseUrl: process.env.LM_STUDIO_URL || "http://localhost:1235/v1",
  model: process.env.LM_STUDIO_MODEL || "meditron-7b",
  maxTokens: 200,
  temperature: 0.7,
  timeout: parseInt(process.env.LM_STUDIO_TIMEOUT || "30000", 10)
};

const SYSTEM_CONTEXT = "[Context: You are a health education assistant. Be concise and helpful. Do not diagnose.]";

export class LMStudioProvider implements LLMProvider {
  readonly type = "lm-studio" as const;
  readonly name = "LM Studio (Local)";
  
  private config: LLMConfig;
  private isAvailable: boolean | null = null;

  constructor(config: Partial<LLMConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${this.config.baseUrl}/models`, {
        method: "GET",
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.isAvailable = res.ok;
      return this.isAvailable;
    } catch {
      this.isAvailable = false;
      return false;
    }
  }

  getAvailabilityStatus(): boolean | null {
    return this.isAvailable;
  }

  async complete(prompt: string): Promise<LLMResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: "user", content: `${SYSTEM_CONTEXT}\n\n${prompt}` }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stop: ["###", "Response:", "User:", "\n\n\n", "[Context:"],
          repeat_penalty: 1.2
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json() as {
        choices: Array<{ message: { content: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };
      
      let content = json.choices[0].message.content;
      content = this.cleanResponse(content);
      this.isAvailable = true;

      return {
        content,
        source: "llm",
        provider: this.type,
        model: this.config.model,
        usage: json.usage ? {
          promptTokens: json.usage.prompt_tokens,
          completionTokens: json.usage.completion_tokens,
          totalTokens: json.usage.total_tokens
        } : undefined
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn("[LMStudioProvider] Error:", errorMsg);
      this.isAvailable = false;

      return {
        content: this.fallbackResponse(prompt),
        source: "fallback",
        provider: this.type,
        error: errorMsg
      };
    }
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stop: ["###", "Response:", "User:", "\n\n\n", "[Context:"],
          repeat_penalty: 1.2
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json() as {
        choices: Array<{ message: { content: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };

      let content = json.choices[0].message.content;
      content = this.cleanResponse(content);
      this.isAvailable = true;

      return {
        content,
        source: "llm",
        provider: this.type,
        model: this.config.model,
        usage: json.usage ? {
          promptTokens: json.usage.prompt_tokens,
          completionTokens: json.usage.completion_tokens,
          totalTokens: json.usage.total_tokens
        } : undefined
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn("[LMStudioProvider] Chat error:", errorMsg);
      this.isAvailable = false;

      const lastUserMessage = messages.filter(m => m.role === "user").pop();
      const prompt = lastUserMessage?.content || "";

      return {
        content: this.fallbackResponse(prompt),
        source: "fallback",
        provider: this.type,
        error: errorMsg
      };
    }
  }

  getConfig(): LLMConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private cleanResponse(response: string): string {
    let cleaned = response.trim();

    cleaned = cleaned.replace(/^#+\s*Response:\s*/i, '');
    cleaned = cleaned.replace(/\n#+\s*Response:[\s\S]*/i, '');

    const prefixesToRemove = [
      /^(Assistant|AI|Bot|System|Health Assistant):\s*/i,
      /^(Response|Answer|Reply):\s*/i,
    ];

    for (const pattern of prefixesToRemove) {
      cleaned = cleaned.replace(pattern, '');
    }

    cleaned = cleaned.replace(/["']?You are a.*?\.["']?\s*/gi, '');
    cleaned = cleaned.replace(/["']?Do not diagnose.*?\.["']?\s*/gi, '');
    cleaned = cleaned.replace(/\[Context:.*?\]\s*/gi, '');

    cleaned = cleaned.trim();
    if (!cleaned) {
      return "I understand. Please continue.";
    }

    return cleaned;
  }

  private fallbackResponse(prompt: string): string {
    const promptLower = prompt.toLowerCase();

    if (/welcome|hello|hi|start|check-?in/i.test(promptLower)) {
      return "Hello! I'm here to help you with your health check-in. Let's get started.";
    }
    if (/age|birth|sex|gender|demographic/i.test(promptLower)) {
      return "Thank you for sharing that information. I've noted your demographics.";
    }
    if (/medical history|condition|diagnosis|chronic|disease/i.test(promptLower)) {
      return "I've recorded your medical history. This helps me understand your health better.";
    }
    if (/medication|medicine|prescription|drug/i.test(promptLower)) {
      return "Thank you for listing your medications. It's important to keep track of these.";
    }
    if (/chest pain|shortness of breath|can't breathe|suicid|emergency/i.test(promptLower)) {
      return "Those symptoms can sometimes be serious. For urgent or severe symptoms, please seek in-person or emergency care immediately.";
    }
    if (/symptom|pain|feel|experiencing|hurt/i.test(promptLower)) {
      return "Thank you for describing your symptoms. Let me ask a few more questions to understand better.";
    }

    return "I've noted that. Let's continue with the next question.";
  }
}

