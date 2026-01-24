import mongoose, { Document, Schema } from 'mongoose';
import type { ChecklistSection, ChecklistItem } from '@ffd/shared';

export interface ITemplate extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  version: number;
  sections: ChecklistSection[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistItemSchema = new Schema<ChecklistItem>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    isRedFlag: { type: Boolean, default: false },
  },
  { _id: false }
);

const ChecklistSectionSchema = new Schema<ChecklistSection>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    items: [ChecklistItemSchema],
    hasVitals: { type: Boolean, default: false },
    hasSleepHours: { type: Boolean, default: false },
    hasFatigueScore: { type: Boolean, default: false },
    hasBACTest: { type: Boolean, default: false },
  },
  { _id: false }
);

const TemplateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true },
    version: { type: Number, required: true, default: 1 },
    sections: [ChecklistSectionSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TemplateSchema.index({ name: 1, version: -1 });
TemplateSchema.index({ isActive: 1 });

export const Template = mongoose.model<ITemplate>('Template', TemplateSchema);
