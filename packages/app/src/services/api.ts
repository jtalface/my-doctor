/**
 * Backend API Client
 * 
 * Service for communicating with the MyDoctor backend
 */

const API_BASE_URL = 'http://localhost:3002/api';

export interface StartSessionResponse {
  success: boolean;
  data: {
    sessionId: string;
    userId: string;
    currentState: string;
    prompt: string;
    inputType: 'choice' | 'text' | 'none';
    choices: string[];
  };
}

export interface SendInputResponse {
  success: boolean;
  data: {
    response: string;
    previousState: string;
    currentState: string;
    prompt: string;
    inputType: 'choice' | 'text' | 'none';
    choices: string[];
    isTerminal: boolean;
    reasoning?: {
      redFlags: Array<{
        id: string;
        label: string;
        reason: string;
        severity: 'low' | 'moderate' | 'high';
      }>;
      scores: Record<string, number>;
      recommendations: {
        educationTopics: string[];
        screeningSuggestions: string[];
        followUpQuestions: string[];
      };
    };
  };
}

export interface SessionResponse {
  success: boolean;
  data: {
    session: {
      _id: string;
      userId: string;
      currentState: string;
      isEphemeral: boolean;
      startedAt: string;
      lastActivityAt: string;
      endedAt?: string;
    };
    memory: {
      steps: Array<{
        nodeId: string;
        timestamp: string;
        input: string;
        response?: string;
      }>;
      context: Record<string, unknown>;
    };
    currentNode: {
      id: string;
      prompt: string;
      inputType: 'choice' | 'text' | 'none';
      choices: string[];
    } | null;
  };
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  mongodb: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if backend is available
   */
  async checkHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error('Backend not available');
    }
    return response.json();
  }

  /**
   * Start a new session
   */
  async startSession(email: string, name?: string): Promise<StartSessionResponse> {
    const response = await fetch(`${this.baseUrl}/session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || 'Failed to start session');
    }

    return response.json();
  }

  /**
   * Send user input to the session
   */
  async sendInput(sessionId: string, input: string): Promise<SendInputResponse> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}/input`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || 'Failed to send input');
    }

    return response.json();
  }

  /**
   * Get session details
   */
  async getSession(sessionId: string): Promise<SessionResponse> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || 'Failed to get session');
    }

    return response.json();
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || 'Failed to end session');
    }
  }

  /**
   * Get conversation history
   */
  async getHistory(sessionId: string): Promise<{
    success: boolean;
    data: {
      steps: Array<{
        nodeId: string;
        timestamp: string;
        input: string;
        response?: string;
      }>;
      context: Record<string, unknown>;
    };
  }> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}/history`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || 'Failed to get history');
    }

    return response.json();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };

