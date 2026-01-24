import mongoose, { Document, Schema } from 'mongoose';
import { JobRoleTag } from '@ffd/shared';

export interface IJobRole extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  safetyCritical: boolean;
  tags: Array<typeof JobRoleTag[keyof typeof JobRoleTag]>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const JobRoleSchema = new Schema<IJobRole>(
  {
    name: { type: String, required: true },
    safetyCritical: { type: Boolean, default: false },
    tags: [{
      type: String,
      enum: Object.values(JobRoleTag),
    }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

JobRoleSchema.index({ name: 1 });
JobRoleSchema.index({ safetyCritical: 1 });
JobRoleSchema.index({ isActive: 1 });

export const JobRole = mongoose.model<IJobRole>('JobRole', JobRoleSchema);
