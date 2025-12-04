export interface SessionMemory {
  recall(sessionId: string): Promise<SessionData>;
  store(sessionId: string, data: Partial<SessionData>): Promise<void>;
  clear(sessionId: string): Promise<void>;
}

export interface SessionData {
  startedAt?: string;
  userId?: string;
  lastInput?: string;
  lastOutput?: string;
  lastState?: string;
  [key: string]: any;
}

