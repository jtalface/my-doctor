/**
 * Payment Event Model
 * 
 * Stores all webhook payloads and status change events for audit/debugging.
 * Every webhook received and every status transition is logged here.
 */

import mongoose, { Document, Schema } from 'mongoose';

export type PaymentEventType = 
  | 'webhook.received' 
  | 'status.changed' 
  | 'reconciliation.query'
  | 'initiate.requested'
  | 'resend.requested'
  | 'error';

export interface IPaymentEvent extends Document {
  paymentId: mongoose.Types.ObjectId;
  provider: string;
  eventType: PaymentEventType;
  payloadJson: Record<string, unknown>; // Full webhook/event payload (sanitized)
  receivedAt: Date;
}

const PaymentEventSchema = new Schema<IPaymentEvent>(
  {
    paymentId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Payment',
      index: true,
    },
    provider: { type: String, required: true, index: true },
    eventType: { 
      type: String, 
      required: true, 
      index: true,
      enum: ['webhook.received', 'status.changed', 'reconciliation.query', 'initiate.requested', 'resend.requested', 'error'],
    },
    payloadJson: { type: Schema.Types.Mixed, required: true },
    receivedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// Index for efficient queries
PaymentEventSchema.index({ paymentId: 1, receivedAt: -1 });

export const PaymentEvent = mongoose.model<IPaymentEvent>('PaymentEvent', PaymentEventSchema);
