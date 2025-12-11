/**
 * OpenAI Provider
 * 
 * Connects to OpenAI's API for ChatGPT and other models.
 */

import { LLMProvider, LLMConfig, LLMMessage, LLMResponse } from "../types";

const DEFAULT_CONFIG: LLMConfig = {
  apiKey: process.env.OPENAI_API_KEY || "",
  baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  maxTokens: 300,
  temperature: 0.7,
  timeout: parseInt(process.env.OPENAI_TIMEOUT || "30000", 10)
};

const SYSTEM_MESSAGE = `You are a careful health education assistant. 
Your role is to gather health information and provide general health education.
You are NOT a doctor and cannot diagnose conditions or prescribe treatments.
Always encourage users to consult healthcare professionals for medical advice.
Keep responses concise, empathetic, and focused on the current question.`;

export class OpenAIProvider implements LLMProvider {
  readonly type = "openai" as const;
  readonly name = "OpenAI (ChatGPT)";
  
  private config: LLMConfig;
  private isAvailable: boolean | null = null;

  constructor(config: Partial<LLMConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async checkAvailability(): Promise<boolean> {
    if (!this.config.apiKey) {
      this.isAvailable = false;
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${this.config.baseUrl}/models`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`
        },
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
    if (!this.config.apiKey) {
      return {
        content: this.fallbackResponse(prompt),
        source: "fallback",
        provider: this.type,
        error: "OpenAI API key not configured"
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: "system", content: SYSTEM_MESSAGE },
            { role: "user", content: prompt }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorBody}`);
      }

      const json = await res.json() as {
        choices: Array<{ message: { content: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };

      const content = json.choices[0].message.content.trim();
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
      console.warn("[OpenAIProvider] Error:", errorMsg);
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
    if (!this.config.apiKey) {
      const lastUserMessage = messages.filter(m => m.role === "user").pop();
      return {
        content: this.fallbackResponse(lastUserMessage?.content || ""),
        source: "fallback",
        provider: this.type,
        error: "OpenAI API key not configured"
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      // Ensure system message is present
      const hasSystem = messages.some(m => m.role === "system");
      const messagesWithSystem = hasSystem 
        ? messages 
        : [{ role: "system" as const, content: SYSTEM_MESSAGE }, ...messages];

      const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messagesWithSystem,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorBody}`);
      }

      const json = await res.json() as {
        choices: Array<{ message: { content: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };

      const content = json.choices[0].message.content.trim();
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
      console.warn("[OpenAIProvider] Chat error:", errorMsg);
      this.isAvailable = false;

      const lastUserMessage = messages.filter(m => m.role === "user").pop();
      return {
        content: this.fallbackResponse(lastUserMessage?.content || ""),
        source: "fallback",
        provider: this.type,
        error: errorMsg
      };
    }
  }

  getConfig(): LLMConfig {
    // Don't expose full API key
    return {
      ...this.config,
      apiKey: this.config.apiKey ? "***configured***" : ""
    };
  }

  updateConfig(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config };
    // Reset availability when config changes
    this.isAvailable = null;
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

