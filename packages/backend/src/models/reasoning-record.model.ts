import mongoose, { Schema, Document } from "mongoose";

// ============================================
// Reasoning Record Schema
// ============================================

export interface IRedFlag {
  id: string;
  label: string;
  reason: string;
  severity: "low" | "moderate" | "high";
}

export interface IReasoningScores {
  bmi?: number;
  cardioRisk?: number;
  respiratorySeverity?: number;
  depressionScore?: number;
  [key: string]: number | undefined;
}

export interface IReasoningRecommendations {
  educationTopics: string[];
  screeningSuggestions: string[];
  followUpQuestions: string[];
}

export interface IReasoningRecord extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  nodeId: string;
  redFlags: IRedFlag[];
  scores: IReasoningScores;
  recommendations: IReasoningRecommendations;
  notes: string[];
  overrideNextState?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RedFlagSchema = new Schema<IRedFlag>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    reason: { type: String, required: true },
    severity: { type: String, enum: ["low", "moderate", "high"], required: true }
  },
  { _id: false }
);

const ReasoningScoresSchema = new Schema<IReasoningScores>(
  {
    bmi: { type: Number },
    cardioRisk: { type: Number },
    respiratorySeverity: { type: Number },
    depressionScore: { type: Number }
  },
  { _id: false, strict: false } // Allow additional score fields
);

const ReasoningRecommendationsSchema = new Schema<IReasoningRecommendations>(
  {
    educationTopics: { type: [String], default: [] },
    screeningSuggestions: { type: [String], default: [] },
    followUpQuestions: { type: [String], default: [] }
  },
  { _id: false }
);

const ReasoningRecordSchema = new Schema<IReasoningRecord>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    nodeId: { type: String, required: true },
    redFlags: { type: [RedFlagSchema], default: [] },
    scores: { type: ReasoningScoresSchema, default: {} },
    recommendations: { type: ReasoningRecommendationsSchema, default: {} },
    notes: { type: [String], default: [] },
    overrideNextState: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

// Indexes
ReasoningRecordSchema.index({ sessionId: 1 });
ReasoningRecordSchema.index({ userId: 1 });
ReasoningRecordSchema.index({ sessionId: 1, nodeId: 1 });
ReasoningRecordSchema.index({ timestamp: -1 });

export const ReasoningRecord = mongoose.model<IReasoningRecord>("ReasoningRecord", ReasoningRecordSchema);

// ============================================
// Reasoning Record Repository
// ============================================

export class ReasoningRecordRepository {
  async findBySessionId(sessionId: string): Promise<IReasoningRecord[]> {
    return ReasoningRecord.find({ sessionId }).sort({ timestamp: 1 });
  }

  async findBySessionAndNode(sessionId: string, nodeId: string): Promise<IReasoningRecord | null> {
    return ReasoningRecord.findOne({ sessionId, nodeId }).sort({ timestamp: -1 });
  }

  async create(data: {
    sessionId: string;
    userId: string;
    nodeId: string;
    redFlags?: IRedFlag[];
    scores?: IReasoningScores;
    recommendations?: IReasoningRecommendations;
    notes?: string[];
    overrideNextState?: string;
  }): Promise<IReasoningRecord> {
    const record = new ReasoningRecord({
      ...data,
      timestamp: new Date()
    });
    return record.save();
  }

  async getRedFlagsBySession(sessionId: string): Promise<IRedFlag[]> {
    const records = await this.findBySessionId(sessionId);
    return records.flatMap(r => r.redFlags);
  }

  async getHighSeverityRedFlags(sessionId: string): Promise<IRedFlag[]> {
    const records = await this.findBySessionId(sessionId);
    return records
      .flatMap(r => r.redFlags)
      .filter(rf => rf.severity === "high");
  }

  async getLatestScores(sessionId: string): Promise<IReasoningScores> {
    const records = await this.findBySessionId(sessionId);
    // Merge all scores, later values override earlier
    return records.reduce((acc, r) => ({ ...acc, ...r.scores }), {} as IReasoningScores);
  }

  async getRecommendations(sessionId: string): Promise<IReasoningRecommendations> {
    const records = await this.findBySessionId(sessionId);
    const education = new Set<string>();
    const screenings = new Set<string>();
    const followUp = new Set<string>();

    records.forEach(r => {
      r.recommendations.educationTopics.forEach(t => education.add(t));
      r.recommendations.screeningSuggestions.forEach(s => screenings.add(s));
      r.recommendations.followUpQuestions.forEach(q => followUp.add(q));
    });

    return {
      educationTopics: Array.from(education),
      screeningSuggestions: Array.from(screenings),
      followUpQuestions: Array.from(followUp)
    };
  }

  async deleteBySession(sessionId: string): Promise<number> {
    const result = await ReasoningRecord.deleteMany({ sessionId });
    return result.deletedCount;
  }
}

