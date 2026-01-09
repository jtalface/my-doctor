import mongoose, { Document, Schema } from 'mongoose';

export interface IBPSettings extends Document {
  userId: mongoose.Types.ObjectId;
  profileType: 'user' | 'dependent';
  targets: {
    systolic: number;
    diastolic: number;
  };
  measurementSchedule: ('AM' | 'PM')[];
  medications: Array<{
    name: string;
    class?: string; // e.g., 'ACE Inhibitor', 'Beta Blocker', 'Diuretic'
  }>;
  comorbidities: {
    diabetes: boolean;
    ckd: boolean; // Chronic Kidney Disease
    cad: boolean; // Coronary Artery Disease / MI
    stroke: boolean; // Stroke / TIA
    pregnancy: boolean;
  };
  disclaimerAccepted: boolean;
  disclaimerAcceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BPSettingsSchema = new Schema<IBPSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    profileType: { type: String, enum: ['user', 'dependent'], required: true },
    targets: {
      systolic: { type: Number, default: 130, min: 90, max: 180 },
      diastolic: { type: Number, default: 80, min: 60, max: 110 },
    },
    measurementSchedule: [{ type: String, enum: ['AM', 'PM'] }],
    medications: [
      {
        name: { type: String, required: true },
        class: { type: String },
      },
    ],
    comorbidities: {
      diabetes: { type: Boolean, default: false },
      ckd: { type: Boolean, default: false },
      cad: { type: Boolean, default: false },
      stroke: { type: Boolean, default: false },
      pregnancy: { type: Boolean, default: false },
    },
    disclaimerAccepted: { type: Boolean, required: true, default: false },
    disclaimerAcceptedAt: { type: Date },
  },
  { timestamps: true }
);

export const BPSettings = mongoose.model<IBPSettings>('BPSettings', BPSettingsSchema);

