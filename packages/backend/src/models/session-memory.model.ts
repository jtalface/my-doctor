import mongoose, { Schema, Document } from "mongoose";

// ============================================
// Session Memory Schema
// ============================================

export interface ISessionStep {
  nodeId: string;
  timestamp: Date;
  input: string;
  response?: string;
  controllerData?: Record<string, unknown>;
  reasoning?: Record<string, unknown>;
}

export interface ISessionMemory extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  steps: ISessionStep[];
  context: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SessionStepSchema = new Schema<ISessionStep>(
  {
    nodeId: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    input: { type: String, required: true },
    response: { type: String },
    controllerData: { type: Schema.Types.Mixed },
    reasoning: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const SessionMemorySchema = new Schema<ISessionMemory>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    steps: { type: [SessionStepSchema], default: [] },
    context: { type: Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: true
  }
);

// Indexes
SessionMemorySchema.index({ sessionId: 1 });
SessionMemorySchema.index({ userId: 1 });

export const SessionMemory = mongoose.model<ISessionMemory>("SessionMemory", SessionMemorySchema);

// ============================================
// Session Memory Repository
// ============================================

export class SessionMemoryRepository {
  async findBySessionId(sessionId: string): Promise<ISessionMemory | null> {
    return SessionMemory.findOne({ sessionId });
  }

  async create(sessionId: string, userId: string): Promise<ISessionMemory> {
    const memory = new SessionMemory({ sessionId, userId });
    return memory.save();
  }

  async findOrCreate(sessionId: string, userId: string): Promise<ISessionMemory> {
    let memory = await this.findBySessionId(sessionId);
    if (!memory) {
      memory = await this.create(sessionId, userId);
    }
    return memory;
  }

  async appendStep(sessionId: string, step: ISessionStep): Promise<ISessionMemory | null> {
    return SessionMemory.findOneAndUpdate(
      { sessionId },
      { $push: { steps: step } },
      { new: true }
    );
  }

  async updateStepResponse(
    sessionId: string, 
    nodeId: string, 
    response: string
  ): Promise<ISessionMemory | null> {
    // Update the last step with matching nodeId
    const memory = await this.findBySessionId(sessionId);
    if (!memory) return null;

    // Find last index manually for compatibility
    let stepIndex = -1;
    for (let i = memory.steps.length - 1; i >= 0; i--) {
      if (memory.steps[i].nodeId === nodeId) {
        stepIndex = i;
        break;
      }
    }
    if (stepIndex === -1) return memory;

    return SessionMemory.findOneAndUpdate(
      { sessionId },
      { $set: { [`steps.${stepIndex}.response`]: response } },
      { new: true }
    );
  }

  async updateContext(
    sessionId: string, 
    context: Record<string, unknown>
  ): Promise<ISessionMemory | null> {
    return SessionMemory.findOneAndUpdate(
      { sessionId },
      { $set: { context: { ...context } } },
      { new: true }
    );
  }

  async mergeContext(
    sessionId: string, 
    data: Record<string, unknown>
  ): Promise<ISessionMemory | null> {
    const memory = await this.findBySessionId(sessionId);
    if (!memory) return null;

    const mergedContext = { ...memory.context, ...data };
    return SessionMemory.findOneAndUpdate(
      { sessionId },
      { $set: { context: mergedContext } },
      { new: true }
    );
  }

  async getContext(sessionId: string): Promise<Record<string, unknown>> {
    const memory = await this.findBySessionId(sessionId);
    return memory?.context || {};
  }

  async clear(sessionId: string): Promise<ISessionMemory | null> {
    return SessionMemory.findOneAndUpdate(
      { sessionId },
      { $set: { steps: [], context: {} } },
      { new: true }
    );
  }

  async delete(sessionId: string): Promise<boolean> {
    const result = await SessionMemory.findOneAndDelete({ sessionId });
    return result !== null;
  }
}

