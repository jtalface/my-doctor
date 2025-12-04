import { NLP } from "./types";

/**
 * DummyNLP provides a stub implementation for development and testing.
 * Replace with actual LLM integration (OpenAI, Anthropic, etc.) in production.
 */
export class DummyNLP implements NLP {
  async complete(_prompt: string): Promise<string> {
    // Naive stub — echo back a helper response
    // In production, this would call an actual LLM API
    return "OK — noted. (This is a dummy LLM output.)";
  }

  async embed(_text: string): Promise<number[]> {
    // Stub embedding - returns random vector
    return Array.from({ length: 128 }, () => Math.random());
  }
}
