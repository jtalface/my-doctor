/**
 * Conversation Model
 * 
 * Represents a messaging thread between a patient and a healthcare provider.
 * Each patient-provider pair has exactly one conversation.
 */

import mongoose, { Document, Schema } from 'mongoose';

export type ConversationStatus = 'active' | 'archived' | 'closed';

export interface IConversation extends Document {
  patientId: mongoose.Types.ObjectId;    // Reference to User
  providerId: mongoose.Types.ObjectId;   // Reference to Provider
  
  // Last message info for conversation list preview
  lastMessageAt: Date;
  lastMessagePreview: string;            // First ~100 chars of last message
  lastMessageSenderType: 'patient' | 'provider';
  
  // Unread counts
  unreadByPatient: number;
  unreadByProvider: number;
  
  // Conversation metadata
  status: ConversationStatus;
  subject?: string;                      // Optional subject line
  
  // For dependents
  dependentId?: mongoose.Types.ObjectId; // If conversation is about a dependent
  
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
    dependentId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Ensure unique conversation per patient-provider-dependent combination
// This allows separate conversations: one for the user themselves, and one per dependent
ConversationSchema.index(
  { patientId: 1, providerId: 1, dependentId: 1 }, 
  { unique: true }
);

// Index for fetching user's conversations sorted by recent activity
ConversationSchema.index({ patientId: 1, lastMessageAt: -1 });
ConversationSchema.index({ providerId: 1, lastMessageAt: -1 });

// Static method to get or create a conversation
ConversationSchema.statics.findOrCreate = async function(
  patientId: mongoose.Types.ObjectId | string,
  providerId: mongoose.Types.ObjectId | string,
  options?: { subject?: string; dependentId?: mongoose.Types.ObjectId | string }
) {
  let conversation = await this.findOne({ patientId, providerId });
  
  if (!conversation) {
    conversation = await this.create({
      patientId,
      providerId,
      subject: options?.subject,
      dependentId: options?.dependentId,
    });
  }
  
  return conversation;
};

// Method to update after new message
ConversationSchema.methods.updateLastMessage = function(
  preview: string,
  senderType: 'patient' | 'provider'
) {
  this.lastMessageAt = new Date();
  this.lastMessagePreview = preview.substring(0, 100);
  this.lastMessageSenderType = senderType;
  
  // Increment unread count for the recipient
  if (senderType === 'patient') {
    this.unreadByProvider += 1;
  } else {
    this.unreadByPatient += 1;
  }
  
  return this.save();
};

// Method to mark messages as read
ConversationSchema.methods.markAsRead = function(readerType: 'patient' | 'provider') {
  if (readerType === 'patient') {
    this.unreadByPatient = 0;
  } else {
    this.unreadByProvider = 0;
  }
  return this.save();
};

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);

