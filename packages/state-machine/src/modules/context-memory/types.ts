export interface SessionMemory {
  recall(sessionId: string): Promise<any>;
  store(sessionId: string, data: any): Promise<void>;
  clear(sessionId: string): Promise<void>;
}
