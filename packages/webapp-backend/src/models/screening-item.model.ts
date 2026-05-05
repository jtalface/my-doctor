import mongoose, { Document, Schema } from 'mongoose';
import type { ScreeningCode } from '../preventive/types.js';

export interface IScreeningItem extends Document {
  code: ScreeningCode;
  isActive: boolean;
  defaultMinIntervalYears: number;
  defaultMaxIntervalYears: number;
  createdAt: Date;
  updatedAt: Date;
}

const ScreeningItemSchema = new Schema<IScreeningItem>(
  {
    code: {
      type: String,
      enum: ['blood_pressure', 'lipid_panel', 'hba1c', 'colorectal', 'psa_discussion', 'vision', 'dental', 'cervical', 'mammogram', 'dexa'],
      required: true,
      unique: true,
    },
    isActive: { type: Boolean, default: true },
    defaultMinIntervalYears: { type: Number, required: true },
    defaultMaxIntervalYears: { type: Number, required: true },
  },
  { timestamps: true }
);

export const ScreeningItem = mongoose.model<IScreeningItem>('ScreeningItem', ScreeningItemSchema);
