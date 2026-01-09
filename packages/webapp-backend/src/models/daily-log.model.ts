import mongoose, { Document, Schema } from 'mongoose';

export type FlowLevel = 'none' | 'light' | 'medium' | 'heavy';

export type Symptom = 
  | 'cramps'
  | 'headache'
  | 'bloating'
  | 'acne'
  | 'breast_tenderness'
  | 'fatigue'
  | 'nausea'
  | 'back_pain';

export type Mood = 
  | 'happy'
  | 'anxious'
  | 'irritable'
  | 'sad'
  | 'energetic'
  | 'calm';

export interface IDailyLog extends Document {
  userId: mongoose.Types.ObjectId;          // References User (could be self or dependent)
  profileType: 'user' | 'dependent';        // Whether this is for a primary user or dependent
  date: string;                             // ISO date string YYYY-MM-DD (no time)
  isPeriodDay: boolean;                     // Whether this is a period day
  flowLevel: FlowLevel;                     // Flow intensity
  symptoms: Symptom[];                      // Array of symptoms
  mood: Mood[];                             // Array of moods
  notes: string;                            // Free-text notes
  createdAt: Date;
  updatedAt: Date;
}

const DailyLogSchema = new Schema<IDailyLog>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true,
    },
    profileType: {
      type: String,
      enum: ['user', 'dependent'],
      required: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,  // Validate YYYY-MM-DD format
      index: true,
    },
    isPeriodDay: {
      type: Boolean,
      default: false,
    },
    flowLevel: {
      type: String,
      enum: ['none', 'light', 'medium', 'heavy'],
      default: 'none',
    },
    symptoms: [{
      type: String,
      enum: [
        'cramps',
        'headache',
        'bloating',
        'acne',
        'breast_tenderness',
        'fatigue',
        'nausea',
        'back_pain',
      ],
    }],
    mood: [{
      type: String,
      enum: [
        'happy',
        'anxious',
        'irritable',
        'sad',
        'energetic',
        'calm',
      ],
    }],
    notes: {
      type: String,
      maxlength: 500,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound unique index: one log per user per date
DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

// Index for date range queries
DailyLogSchema.index({ userId: 1, date: 1 });

// Index for finding period days
DailyLogSchema.index({ userId: 1, isPeriodDay: 1, date: 1 });

export const DailyLog = mongoose.model<IDailyLog>('DailyLog', DailyLogSchema);

