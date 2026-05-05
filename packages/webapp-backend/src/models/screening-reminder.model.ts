import mongoose, { Document, Schema } from 'mongoose';
import type { ScreeningCode } from '../preventive/types.js';

export interface IScreeningReminder extends Document {
  patientId: mongoose.Types.ObjectId;
  screeningCode: ScreeningCode;
  remindAt: Date;
  channel: 'in_app' | 'email';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ScreeningReminderSchema = new Schema<IScreeningReminder>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    screeningCode: {
      type: String,
      enum: ['blood_pressure', 'lipid_panel', 'hba1c', 'colorectal', 'psa_discussion', 'vision', 'dental', 'cervical', 'mammogram', 'dexa'],
      required: true,
      index: true,
    },
    remindAt: { type: Date, required: true, index: true },
    channel: { type: String, enum: ['in_app', 'email'], default: 'in_app' },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ScreeningReminderSchema.index({ patientId: 1, remindAt: 1 });

export const ScreeningReminder = mongoose.model<IScreeningReminder>('ScreeningReminder', ScreeningReminderSchema);
