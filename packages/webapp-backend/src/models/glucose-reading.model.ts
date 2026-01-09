import mongoose, { Document, Schema } from 'mongoose';

export interface IGlucoseReading extends Document {
  userId: mongoose.Types.ObjectId;
  profileType: 'user' | 'dependent';
  timestamp: Date;
  glucoseValue: number; // Always stored in mg/dL (normalized)
  glucoseValueRaw: number; // As entered by user
  unit: 'mg/dL' | 'mmol/L'; // Unit user entered
  context: 'fasting' | 'pre_meal' | 'post_meal' | 'bedtime' | 'overnight' | 'other';
  carbsGrams?: number;
  insulinUnits?: number; // LOG ONLY - never used for suggestions
  activityMinutes?: number;
  symptoms: string[]; // Predefined symptoms
  notes?: string;
  flagged: boolean; // Auto-flagged by system for out-of-range values
  createdAt: Date;
  updatedAt: Date;
}

const GlucoseReadingSchema = new Schema<IGlucoseReading>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    profileType: { type: String, enum: ['user', 'dependent'], required: true },
    timestamp: { type: Date, required: true },
    glucoseValue: { type: Number, required: true }, // mg/dL
    glucoseValueRaw: { type: Number, required: true },
    unit: { type: String, enum: ['mg/dL', 'mmol/L'], required: true },
    context: {
      type: String,
      enum: ['fasting', 'pre_meal', 'post_meal', 'bedtime', 'overnight', 'other'],
      required: true,
    },
    carbsGrams: { type: Number, min: 0, max: 500 },
    insulinUnits: { type: Number, min: 0, max: 200 },
    activityMinutes: { type: Number, min: 0, max: 1440 },
    symptoms: [{ type: String }],
    notes: { type: String, maxlength: 500 },
    flagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for efficient queries
GlucoseReadingSchema.index({ userId: 1, timestamp: -1 });
GlucoseReadingSchema.index({ userId: 1, context: 1, timestamp: -1 });
GlucoseReadingSchema.index({ userId: 1, flagged: 1, timestamp: -1 });

export const GlucoseReading = mongoose.model<IGlucoseReading>(
  'GlucoseReading',
  GlucoseReadingSchema
);

