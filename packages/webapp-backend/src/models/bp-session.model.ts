import mongoose, { Document, Schema } from 'mongoose';

export type BPClassification = 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis';

export type BPContext = 'resting' | 'after_exercise' | 'stressed' | 'clinic' | 'other';

export type BPSymptom =
  | 'chest_pain'
  | 'shortness_of_breath'
  | 'severe_headache'
  | 'vision_changes'
  | 'confusion'
  | 'weakness_numbness'
  | 'none';

export interface IBPReading {
  systolic: number;
  diastolic: number;
  pulse?: number;
}

export interface IMeasurementQuality {
  rested_5_min: boolean;
  feet_flat: boolean;
  back_supported: boolean;
  arm_supported_heart_level: boolean;
  correct_cuff_size?: boolean;
  no_caffeine_30_min?: boolean;
  no_exercise_30_min?: boolean;
  no_smoking_30_min?: boolean;
}

export interface IBPSession extends Document {
  userId: mongoose.Types.ObjectId;
  profileType: 'user' | 'dependent';
  timestamp: Date;
  readings: IBPReading[]; // Multiple readings in one session
  averages: {
    systolic: number;
    diastolic: number;
    pulse?: number;
  };
  classification: BPClassification;
  context: BPContext;
  symptoms: BPSymptom[];
  measurementQuality: IMeasurementQuality;
  notes?: string;
  flagged: boolean; // Auto-flagged for high/crisis readings
  createdAt: Date;
  updatedAt: Date;
}

const BPSessionSchema = new Schema<IBPSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    profileType: { type: String, enum: ['user', 'dependent'], required: true },
    timestamp: { type: Date, required: true },
    readings: [
      {
        systolic: { type: Number, required: true, min: 60, max: 260 },
        diastolic: { type: Number, required: true, min: 40, max: 150 },
        pulse: { type: Number, min: 30, max: 200 },
      },
    ],
    averages: {
      systolic: { type: Number, required: true },
      diastolic: { type: Number, required: true },
      pulse: { type: Number },
    },
    classification: {
      type: String,
      enum: ['normal', 'elevated', 'stage1', 'stage2', 'crisis'],
      required: true,
    },
    context: {
      type: String,
      enum: ['resting', 'after_exercise', 'stressed', 'clinic', 'other'],
      required: true,
    },
    symptoms: [
      {
        type: String,
        enum: [
          'chest_pain',
          'shortness_of_breath',
          'severe_headache',
          'vision_changes',
          'confusion',
          'weakness_numbness',
          'none',
        ],
      },
    ],
    measurementQuality: {
      rested_5_min: { type: Boolean, default: false },
      feet_flat: { type: Boolean, default: false },
      back_supported: { type: Boolean, default: false },
      arm_supported_heart_level: { type: Boolean, default: false },
      correct_cuff_size: { type: Boolean },
      no_caffeine_30_min: { type: Boolean },
      no_exercise_30_min: { type: Boolean },
      no_smoking_30_min: { type: Boolean },
    },
    notes: { type: String, maxlength: 500 },
    flagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for efficient queries
BPSessionSchema.index({ userId: 1, timestamp: -1 });
BPSessionSchema.index({ userId: 1, classification: 1, timestamp: -1 });
BPSessionSchema.index({ userId: 1, flagged: 1, timestamp: -1 });

export const BPSession = mongoose.model<IBPSession>('BPSession', BPSessionSchema);

