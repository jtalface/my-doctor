import { SessionMemory } from "./types";

const MEM: Record<string, any> = {};

export class InMemorySessionMemory implements SessionMemory {
  async recall(sessionId: string): Promise<any> {
    return MEM[sessionId] ?? {};
  }
  async store(sessionId: string, data: any): Promise<void> {
    MEM[sessionId] = { ...(MEM[sessionId] || {}), ...data };
  }
  async clear(sessionId: string): Promise<void> {
    delete MEM[sessionId];
  }
}
