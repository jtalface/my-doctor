import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  actorUserId: mongoose.Types.ObjectId;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  diff?: Record<string, unknown>;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    ip: { type: String },
    userAgent: { type: String },
    diff: { type: Schema.Types.Mixed },
  },
  { timestamps: false }
);

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ actorUserId: 1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ action: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
