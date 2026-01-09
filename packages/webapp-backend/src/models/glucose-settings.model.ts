import mongoose, { Document, Schema } from 'mongoose';

export interface IGlucoseSettings extends Document {
  userId: mongoose.Types.ObjectId;
  profileType: 'user' | 'dependent';
  diabetesType: 'T1' | 'T2' | 'GDM' | 'Other';
  unitPreference: 'mg/dL' | 'mmol/L';
  targetRanges: {
    fasting: { min: number; max: number };
    preMeal: { min: number; max: number };
    postMeal: { min: number; max: number };
    bedtime: { min: number; max: number };
  };
  medications: Array<{
    name: string;
    isInsulin: boolean;
  }>;
  disclaimerAccepted: boolean;
  disclaimerAcceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GlucoseSettingsSchema = new Schema<IGlucoseSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    profileType: { type: String, enum: ['user', 'dependent'], required: true },
    diabetesType: { type: String, enum: ['T1', 'T2', 'GDM', 'Other'], required: true },
    unitPreference: { type: String, enum: ['mg/dL', 'mmol/L'], default: 'mg/dL' },
    targetRanges: {
      fasting: {
        min: { type: Number, default: 80 },
        max: { type: Number, default: 130 },
      },
      preMeal: {
        min: { type: Number, default: 80 },
        max: { type: Number, default: 130 },
      },
      postMeal: {
        min: { type: Number, default: 80 },
        max: { type: Number, default: 180 },
      },
      bedtime: {
        min: { type: Number, default: 100 },
        max: { type: Number, default: 140 },
      },
    },
    medications: [
      {
        name: { type: String, required: true },
        isInsulin: { type: Boolean, default: false },
      },
    ],
    disclaimerAccepted: { type: Boolean, required: true, default: false },
    disclaimerAcceptedAt: { type: Date },
  },
  { timestamps: true }
);

export const GlucoseSettings = mongoose.model<IGlucoseSettings>(
  'GlucoseSettings',
  GlucoseSettingsSchema
);

