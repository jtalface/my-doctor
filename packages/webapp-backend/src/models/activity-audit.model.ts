import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityAudit extends Document {
  userId: mongoose.Types.ObjectId;
  action:
    | 'login'
    | 'create_reading'
    | 'update_reading'
    | 'delete_reading'
    | 'view_suggestion'
    | 'export_data'
    | 'delete_account'
    | 'update_settings';
  resourceType?: string;
  resourceId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const ActivityAuditSchema = new Schema<IActivityAudit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: [
        'login',
        'create_reading',
        'update_reading',
        'delete_reading',
        'view_suggestion',
        'export_data',
        'delete_account',
        'update_settings',
      ],
      required: true,
    },
    resourceType: { type: String },
    resourceId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false }
);

// Index for audit queries
ActivityAuditSchema.index({ userId: 1, timestamp: -1 });
ActivityAuditSchema.index({ userId: 1, action: 1, timestamp: -1 });

export const ActivityAudit = mongoose.model<IActivityAudit>('ActivityAudit', ActivityAuditSchema);

