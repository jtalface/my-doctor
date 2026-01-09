import mongoose, { Document, Schema } from 'mongoose';

export interface IBPSuggestionAudit extends Document {
  userId: mongoose.Types.ObjectId;
  profileType: 'user' | 'dependent';
  timestamp: Date;
  suggestionId: string; // Rule ID
  suggestionType: string; // e.g., 'CRISIS_WITH_SYMPTOMS', 'PERSISTENT_HIGH'
  severity: 'info' | 'warn' | 'urgent';
  title: string;
  message: string;
  rationale: string;
  supportingData: {
    sessions: Array<{
      timestamp: Date;
      systolic: number;
      diastolic: number;
      classification: string;
    }>;
    patterns: string[];
  };
  userAction?: 'viewed' | 'dismissed';
  actionTimestamp?: Date;
  createdAt: Date;
}

const BPSuggestionAuditSchema = new Schema<IBPSuggestionAudit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    profileType: { type: String, enum: ['user', 'dependent'], required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    suggestionId: { type: String, required: true },
    suggestionType: { type: String, required: true },
    severity: { type: String, enum: ['info', 'warn', 'urgent'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    rationale: { type: String, required: true },
    supportingData: {
      sessions: [
        {
          timestamp: Date,
          systolic: Number,
          diastolic: Number,
          classification: String,
        },
      ],
      patterns: [String],
    },
    userAction: { type: String, enum: ['viewed', 'dismissed'] },
    actionTimestamp: { type: Date },
  },
  { timestamps: true }
);

// Index for efficient queries
BPSuggestionAuditSchema.index({ userId: 1, timestamp: -1 });
BPSuggestionAuditSchema.index({ userId: 1, severity: 1, timestamp: -1 });

export const BPSuggestionAudit = mongoose.model<IBPSuggestionAudit>(
  'BPSuggestionAudit',
  BPSuggestionAuditSchema
);

