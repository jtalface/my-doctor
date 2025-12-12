/**
 * OpenAI Provider
 * 
 * Connects to OpenAI's API for ChatGPT and other models using the official SDK.
 */

import OpenAI from "openai";
import { LLMProvider, LLMConfig, LLMMessage, LLMResponse } from "../types";

const DEFAULT_CONFIG: LLMConfig = {
  apiKey: process.env.OPENAI_API_KEY || "",
  model: process.env.OPENAI_MODEL || "gpt-5-nano",
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
  private client: OpenAI;
  private isAvailable: boolean | null = null;

  constructor(config: Partial<LLMConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = new OpenAI({ apiKey: this.config.apiKey });
  }

  async checkAvailability(): Promise<boolean> {
    if (!this.config.apiKey) {
      this.isAvailable = false;
      return false;
    }

    try {
      await this.client.models.list();
      this.isAvailable = true;
      return true;
    } catch (error) {
      console.warn("[OpenAIProvider] Availability check failed:", error);
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
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        max_completion_tokens: this.config.maxTokens,
        messages: [
          { role: "system", content: SYSTEM_MESSAGE },
          { role: "user", content: prompt }
        ]
      });

      const content = completion.choices[0]?.message?.content?.trim() ?? "";
      this.isAvailable = true;

      return {
        content,
        source: "llm",
        provider: this.type,
        model: this.config.model,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens
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
      // Ensure system message is present
      const hasSystem = messages.some(m => m.role === "system");
      const messagesWithSystem = hasSystem 
        ? messages 
        : [{ role: "system" as const, content: SYSTEM_MESSAGE }, ...messages];

      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        max_completion_tokens: this.config.maxTokens,
        messages: messagesWithSystem
      });

      const content = completion.choices[0]?.message?.content?.trim() ?? "";
      this.isAvailable = true;

      return {
        content,
        source: "llm",
        provider: this.type,
        model: this.config.model,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens
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
    return {
      ...this.config,
      apiKey: this.config.apiKey ? "***configured***" : ""
    };
  }

  updateConfig(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config };
    // Reinitialize client with new config
    this.client = new OpenAI({ apiKey: this.config.apiKey });
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
