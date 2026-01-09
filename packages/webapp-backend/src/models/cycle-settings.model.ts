import mongoose, { Document, Schema } from 'mongoose';

export interface ICycleSettings extends Document {
  userId: mongoose.Types.ObjectId;          // References User (could be self or dependent)
  profileType: 'user' | 'dependent';        // Whether this is for a primary user or dependent
  lastPeriodStart: string;                  // ISO date string YYYY-MM-DD
  averageCycleLength: number;               // Days, default 28
  averagePeriodLength: number;              // Days, default 5
  irregularCycle: boolean;                  // If true, show prediction ranges
  reminders: {
    periodExpected: boolean;                // Remind X days before period
    periodExpectedDays: number;             // How many days before (default 2)
    fertileWindow: boolean;                 // Remind when fertile window starts
  };
  isActive: boolean;                        // Whether tracking is active
  createdAt: Date;
  updatedAt: Date;
}

const CycleSettingsSchema = new Schema<ICycleSettings>(
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
    lastPeriodStart: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,  // Validate YYYY-MM-DD format
    },
    averageCycleLength: {
      type: Number,
      required: true,
      default: 28,
      min: 21,
      max: 45,
    },
    averagePeriodLength: {
      type: Number,
      required: true,
      default: 5,
      min: 2,
      max: 10,
    },
    irregularCycle: {
      type: Boolean,
      default: false,
    },
    reminders: {
      periodExpected: {
        type: Boolean,
        default: true,
      },
      periodExpectedDays: {
        type: Number,
        default: 2,
        min: 0,
        max: 7,
      },
      fertileWindow: {
        type: Boolean,
        default: false,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Ensure one settings record per user
CycleSettingsSchema.index({ userId: 1 }, { unique: true });

// Index for querying active settings
CycleSettingsSchema.index({ isActive: 1 });

export const CycleSettings = mongoose.model<ICycleSettings>('CycleSettings', CycleSettingsSchema);

