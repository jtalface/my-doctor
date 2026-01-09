import mongoose, { Document, Schema } from 'mongoose';

export interface ISuggestionAudit extends Document {
  userId: mongoose.Types.ObjectId;
  profileType: 'user' | 'dependent';
  timestamp: Date;
  suggestionId: string; // Rule ID
  suggestionType: string; // e.g., 'HYPO_SEVERE', 'HYPER_DKA_RISK'
  severity: 'info' | 'warn' | 'urgent';
  title: string;
  message: string;
  rationale: string;
  supportingData: {
    readings: Array<{
      timestamp: Date;
      value: number;
      context: string;
    }>;
    patterns: string[];
  };
  userAction?: 'viewed' | 'dismissed';
  actionTimestamp?: Date;
  createdAt: Date;
}

const SuggestionAuditSchema = new Schema<ISuggestionAudit>(
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
      readings: [
        {
          timestamp: Date,
          value: Number,
          context: String,
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
SuggestionAuditSchema.index({ userId: 1, timestamp: -1 });
SuggestionAuditSchema.index({ userId: 1, severity: 1, timestamp: -1 });

export const SuggestionAudit = mongoose.model<ISuggestionAudit>(
  'SuggestionAudit',
  SuggestionAuditSchema
);

