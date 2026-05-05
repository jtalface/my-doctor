import mongoose, { Document, Schema } from 'mongoose';
import type { ScreeningCode } from '../preventive/types.js';

export interface IScreeningCompletion extends Document {
  patientId: mongoose.Types.ObjectId;
  screeningCode: ScreeningCode;
  completedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScreeningCompletionSchema = new Schema<IScreeningCompletion>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    screeningCode: {
      type: String,
      enum: ['blood_pressure', 'lipid_panel', 'hba1c', 'colorectal', 'psa_discussion', 'vision', 'dental', 'cervical', 'mammogram', 'dexa'],
      required: true,
      index: true,
    },
    completedAt: { type: Date, required: true, index: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

ScreeningCompletionSchema.index({ patientId: 1, screeningCode: 1, completedAt: -1 });

export const ScreeningCompletion = mongoose.model<IScreeningCompletion>('ScreeningCompletion', ScreeningCompletionSchema);
