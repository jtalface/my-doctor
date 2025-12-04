import { SessionMemory, SessionData } from "./types";

const MEMORY_STORE: Record<string, SessionData> = {};

export class InMemorySessionMemory implements SessionMemory {
  async recall(sessionId: string): Promise<SessionData> {
    return MEMORY_STORE[sessionId] ?? {};
  }

  async store(sessionId: string, data: Partial<SessionData>): Promise<void> {
    MEMORY_STORE[sessionId] = {
      ...(MEMORY_STORE[sessionId] || {}),
      ...data
    };
  }

  async clear(sessionId: string): Promise<void> {
    delete MEMORY_STORE[sessionId];
  }
}

