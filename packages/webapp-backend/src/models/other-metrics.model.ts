import mongoose, { Document, Schema } from 'mongoose';

export interface IOtherMetrics extends Document {
  userId: mongoose.Types.ObjectId;
  profileType: 'user' | 'dependent';
  date: Date; // Date without time
  weight?: {
    value: number;
    unit: 'kg' | 'lbs';
  };
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  a1c?: number; // Percentage (e.g., 7.5)
  createdAt: Date;
  updatedAt: Date;
}

const OtherMetricsSchema = new Schema<IOtherMetrics>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    profileType: { type: String, enum: ['user', 'dependent'], required: true },
    date: { type: Date, required: true },
    weight: {
      value: { type: Number, min: 0, max: 500 },
      unit: { type: String, enum: ['kg', 'lbs'] },
    },
    bloodPressure: {
      systolic: { type: Number, min: 40, max: 300 },
      diastolic: { type: Number, min: 20, max: 200 },
    },
    a1c: { type: Number, min: 3, max: 20 },
  },
  { timestamps: true }
);

// Unique constraint: one metrics entry per user per date
OtherMetricsSchema.index({ userId: 1, date: 1 }, { unique: true });

export const OtherMetrics = mongoose.model<IOtherMetrics>('OtherMetrics', OtherMetricsSchema);

