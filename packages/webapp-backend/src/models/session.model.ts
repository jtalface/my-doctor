import mongoose, { Document, Schema } from 'mongoose';

export interface ISessionStep {
  nodeId: string;
  timestamp: Date;
  input: any;
  response: string;
  reasoning?: any;
  metadata?: Record<string, any>;
}

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  currentState: string;
  status: 'active' | 'completed' | 'abandoned';
  steps: ISessionStep[];
  summary?: {
    redFlags: string[];
    recommendations: string[];
    screenings: string[];
    notes: string;
  };
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionStepSchema = new Schema<ISessionStep>(
  {
    nodeId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    input: { type: Schema.Types.Mixed },
    response: { type: String },
    reasoning: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    currentState: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },
    steps: [SessionStepSchema],
    summary: {
      redFlags: [{ type: String }],
      recommendations: [{ type: String }],
      screenings: [{ type: String }],
      notes: { type: String },
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const Session = mongoose.model<ISession>('Session', SessionSchema);
