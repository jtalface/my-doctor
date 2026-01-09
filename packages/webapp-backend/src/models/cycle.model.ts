import mongoose, { Document, Schema } from 'mongoose';

export interface ICycle extends Document {
  userId: mongoose.Types.ObjectId;          // References User (could be self or dependent)
  profileType: 'user' | 'dependent';        // Whether this is for a primary user or dependent
  startDate: string;                        // ISO date string YYYY-MM-DD (first day of period)
  endDate: string;                          // ISO date string YYYY-MM-DD (last day of period)
  cycleLength: number;                      // Days from this period start to next period start (computed)
  periodLength: number;                     // Days of bleeding (endDate - startDate + 1)
  notes: string;                            // Optional notes about this cycle
  createdAt: Date;
  updatedAt: Date;
}

const CycleSchema = new Schema<ICycle>(
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
    startDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,  // Validate YYYY-MM-DD format
      index: true,
    },
    endDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,  // Validate YYYY-MM-DD format
    },
    cycleLength: {
      type: Number,
      min: 0,  // 0 means current/incomplete cycle
    },
    periodLength: {
      type: Number,
      required: true,
      min: 1,
      max: 15,
    },
    notes: {
      type: String,
      maxlength: 500,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for sorting cycles by date
CycleSchema.index({ userId: 1, startDate: -1 });

// Index for finding overlapping cycles (validation)
CycleSchema.index({ userId: 1, startDate: 1, endDate: 1 });

export const Cycle = mongoose.model<ICycle>('Cycle', CycleSchema);

