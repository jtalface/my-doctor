import { Session, ISessionStep } from '../models/session.model.js';
import mongoose from 'mongoose';

export interface SessionMemoryData {
  sessionId: string;
  userId: string;
  sessionType: 'annual-checkup' | 'symptom-check' | 'medication-review';
  currentState: string;
  steps: ISessionStep[];
}

class SessionMemoryService {
  async create(
    userId: string,
    initialState: string,
    sessionType: 'annual-checkup' | 'symptom-check' | 'medication-review'
  ): Promise<SessionMemoryData> {
    const session = new Session({
      userId: new mongoose.Types.ObjectId(userId),
      sessionType,
      currentState: initialState,
      status: 'active',
      steps: [],
      startedAt: new Date(),
    });

    await session.save();

    return {
      sessionId: session._id.toString(),
      userId,
      sessionType,
      currentState: initialState,
      steps: [],
    };
  }

  async get(sessionId: string): Promise<SessionMemoryData | null> {
    const session = await Session.findById(sessionId);
    if (!session) return null;

    return {
      sessionId: session._id.toString(),
      userId: session.userId.toString(),
      sessionType: session.sessionType,
      currentState: session.currentState,
      steps: session.steps,
    };
  }

  async append(
    sessionId: string,
    nodeId: string,
    input: any,
    response: string,
    reasoning?: any
  ): Promise<void> {
    const step: ISessionStep = {
      nodeId,
      timestamp: new Date(),
      input,
      response,
      reasoning,
    };

    await Session.findByIdAndUpdate(sessionId, {
      $push: { steps: step },
    });
  }

  async updateState(sessionId: string, newState: string): Promise<void> {
    await Session.findByIdAndUpdate(sessionId, {
      currentState: newState,
    });
  }

  async goBack(sessionId: string): Promise<SessionMemoryData | null> {
    const session = await Session.findById(sessionId);
    if (!session) return null;

    if (session.steps.length === 0) {
      return {
        sessionId: session._id.toString(),
        userId: session.userId.toString(),
        sessionType: session.sessionType,
        currentState: session.currentState,
        steps: session.steps,
      };
    }

    const previousStep = session.steps[session.steps.length - 1];
    if (!previousStep) {
      return {
        sessionId: session._id.toString(),
        userId: session.userId.toString(),
        sessionType: session.sessionType,
        currentState: session.currentState,
        steps: session.steps,
      };
    }

    session.steps.pop();
    session.currentState = previousStep.nodeId;
    session.status = 'active';
    session.completedAt = undefined;
    session.summary = undefined;
    await session.save();

    return {
      sessionId: session._id.toString(),
      userId: session.userId.toString(),
      sessionType: session.sessionType,
      currentState: session.currentState,
      steps: session.steps,
    };
  }

  async complete(
    sessionId: string,
    summary: {
      redFlags: string[];
      recommendations: string[];
      screenings: string[];
      notes: string;
    }
  ): Promise<void> {
    await Session.findByIdAndUpdate(sessionId, {
      status: 'completed',
      completedAt: new Date(),
      summary,
    });
  }

  async abandon(sessionId: string): Promise<void> {
    await Session.findByIdAndUpdate(sessionId, {
      status: 'abandoned',
    });
  }

  async getHistory(sessionId: string): Promise<ISessionStep[]> {
    const session = await Session.findById(sessionId);
    return session?.steps || [];
  }

  async getUserSessions(userId: string): Promise<SessionMemoryData[]> {
    const sessions = await Session.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(20);

    return sessions.map(s => ({
      sessionId: s._id.toString(),
      userId: s.userId.toString(),
      sessionType: s.sessionType,
      currentState: s.currentState,
      steps: s.steps,
    }));
  }
}

export const sessionMemoryService = new SessionMemoryService();

