/**
 * Payment Model
 * 
 * Stores payment records for collections in MZ (eMola) and AO (Multicaixa Express).
 * Uses Mongoose for MongoDB storage, following existing codebase conventions.
 */

import mongoose, { Document, Schema } from 'mongoose';

export type PaymentStatus = 'CREATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELED';
export type PaymentMethod = 'MOBILE_MONEY' | 'LOCAL_RAIL';
export type PaymentProvider = 'EMOLA' | 'MULTICAIXA';
export type CountryCode = 'MZ' | 'AO';
export type CurrencyCode = 'MZN' | 'AOA';

export interface IPayment extends Document {
  orderId: string;
  country: CountryCode;
  currency: CurrencyCode;
  amountMinor: number; // Amount in minor units (centavos)
  method: PaymentMethod;
  provider: PaymentProvider;
  status: PaymentStatus;
  providerReference?: string; // Unique reference from provider
  msisdnEncrypted?: string; // AES-256-GCM encrypted phone number
  msisdnLast4?: string; // Last 4 digits for display
  idempotencyKey: string; // sha256 hash for idempotency
  failureReason?: string;
  lastInitiatedAt?: Date; // For resend throttling
  customer?: {
    name?: string;
    email?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: { type: String, required: true, index: true },
    country: { type: String, required: true, enum: ['MZ', 'AO'] },
    currency: { type: String, required: true, enum: ['MZN', 'AOA'] },
    amountMinor: { type: Number, required: true, min: 1 },
    method: { type: String, required: true, enum: ['MOBILE_MONEY', 'LOCAL_RAIL'] },
    provider: { type: String, required: true, enum: ['EMOLA', 'MULTICAIXA'] },
    status: {
      type: String,
      required: true,
      enum: ['CREATED', 'PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELED'],
      default: 'CREATED',
      index: true,
    },
    providerReference: { type: String, unique: true, sparse: true },
    msisdnEncrypted: { type: String },
    msisdnLast4: { type: String },
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    failureReason: { type: String },
    lastInitiatedAt: { type: Date },
    customer: {
      name: { type: String },
      email: { type: String },
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
PaymentSchema.index({ orderId: 1, status: 1 });
PaymentSchema.index({ provider: 1, status: 1, updatedAt: 1 }); // For reconciliation
PaymentSchema.index({ createdAt: 1 }); // For cleanup queries

// Ensure virtuals are included in JSON
PaymentSchema.set('toJSON', { virtuals: true });
PaymentSchema.set('toObject', { virtuals: true });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
