import mongoose, { Schema, Document } from "mongoose";

// ============================================
// Session Schema
// ============================================

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  currentState: string;
  isEphemeral: boolean;
  startedAt: Date;
  lastActivityAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    currentState: { type: String, required: true, default: "WELCOME" },
    isEphemeral: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    lastActivityAt: { type: Date, default: Date.now },
    endedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

// Indexes
SessionSchema.index({ userId: 1 });
SessionSchema.index({ createdAt: -1 });
SessionSchema.index({ userId: 1, endedAt: 1 });

export const Session = mongoose.model<ISession>("Session", SessionSchema);

// ============================================
// Session Repository
// ============================================

export class SessionRepository {
  async findById(id: string): Promise<ISession | null> {
    return Session.findById(id);
  }

  async findByUserId(userId: string): Promise<ISession[]> {
    return Session.find({ userId }).sort({ createdAt: -1 });
  }

  async findActiveByUserId(userId: string): Promise<ISession | null> {
    return Session.findOne({ userId, endedAt: null }).sort({ createdAt: -1 });
  }

  async create(userId: string, isEphemeral = false): Promise<ISession> {
    const session = new Session({
      userId,
      isEphemeral,
      currentState: "WELCOME"
    });
    return session.save();
  }

  async updateState(sessionId: string, state: string): Promise<ISession | null> {
    return Session.findByIdAndUpdate(
      sessionId,
      { 
        currentState: state, 
        lastActivityAt: new Date() 
      },
      { new: true }
    );
  }

  async endSession(sessionId: string): Promise<ISession | null> {
    return Session.findByIdAndUpdate(
      sessionId,
      { 
        endedAt: new Date(),
        lastActivityAt: new Date()
      },
      { new: true }
    );
  }

  async deleteEphemeral(sessionId: string): Promise<boolean> {
    const session = await Session.findById(sessionId);
    if (session?.isEphemeral) {
      await Session.findByIdAndDelete(sessionId);
      return true;
    }
    return false;
  }
}

