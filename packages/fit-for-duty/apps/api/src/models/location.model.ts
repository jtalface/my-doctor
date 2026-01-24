import mongoose, { Document, Schema } from 'mongoose';
import { LocationType } from '@ffd/shared';

export interface ILocation extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: typeof LocationType[keyof typeof LocationType];
  region: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(LocationType),
      required: true,
    },
    region: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

LocationSchema.index({ name: 1 });
LocationSchema.index({ type: 1 });
LocationSchema.index({ isActive: 1 });

export const Location = mongoose.model<ILocation>('Location', LocationSchema);
