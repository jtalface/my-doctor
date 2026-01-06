/**
 * Conversation Model (Shared)
 * 
 * Same schema as webapp-backend. Both apps use the same collection.
 */

import mongoose, { Document, Schema } from 'mongoose';

export type ConversationStatus = 'active' | 'archived' | 'closed';

export interface IConversation extends Document {
  patientId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  dependentId?: mongoose.Types.ObjectId;
  
  lastMessageAt: Date;
  lastMessagePreview: string;
  lastMessageSenderType: 'patient' | 'provider';
  
  unreadByPatient: number;
  unreadByProvider: number;
  
  status: ConversationStatus;
  subject?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    patientId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true,
    },
    providerId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Provider', 
      required: true,
      index: true,
    },
    dependentId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
    },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: '' },
    lastMessageSenderType: { 
      type: String, 
      enum: ['patient', 'provider'],
      default: 'patient',
    },
    unreadByPatient: { type: Number, default: 0 },
    unreadByProvider: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['active', 'archived', 'closed'],
      default: 'active',
      index: true,
    },
    subject: { type: String, maxlength: 200 },
  },
  { timestamps: true }
);

// Indexes
ConversationSchema.index({ patientId: 1, providerId: 1, dependentId: 1 }, { unique: true });
ConversationSchema.index({ providerId: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);

