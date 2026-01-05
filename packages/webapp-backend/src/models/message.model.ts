/**
 * Message Model
 * 
 * Represents individual messages within a conversation.
 * Supports text content and file attachments.
 */

import mongoose, { Document, Schema } from 'mongoose';

export type MessageSenderType = 'patient' | 'provider';

export interface IAttachment {
  filename: string;        // Stored filename (UUID-based)
  originalName: string;    // Original filename from upload
  mimeType: string;        // e.g., 'application/pdf', 'image/png'
  size: number;            // Size in bytes
  url: string;             // Download URL path
}

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderType: MessageSenderType;
  senderId: mongoose.Types.ObjectId;      // User ID or Provider ID
  
  // Content
  content: string;
  attachments: IAttachment[];
  
  // Metadata
  readAt?: Date;                          // When recipient read this message
  editedAt?: Date;                        // If message was edited
  deletedAt?: Date;                       // Soft delete
  
  // For system messages (optional)
  isSystemMessage: boolean;               // e.g., "Provider joined the conversation"
  systemMessageType?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Conversation', 
      required: true,
      index: true,
    },
    senderType: { 
      type: String, 
      enum: ['patient', 'provider'],
      required: true,
    },
    senderId: { 
      type: Schema.Types.ObjectId, 
      required: true,
      refPath: 'senderType === "patient" ? "User" : "Provider"',
    },
    content: { 
      type: String, 
      default: '',
      maxlength: 5000,  // Reasonable limit for a message
    },
    attachments: [AttachmentSchema],
    readAt: { type: Date },
    editedAt: { type: Date },
    deletedAt: { type: Date },
    isSystemMessage: { type: Boolean, default: false },
    systemMessageType: { type: String },
  },
  { timestamps: true }
);

// Index for fetching messages in a conversation (sorted by time)
MessageSchema.index({ conversationId: 1, createdAt: 1 });

// Index for unread messages
MessageSchema.index({ conversationId: 1, readAt: 1 });

// Virtual to check if message has attachments
MessageSchema.virtual('hasAttachments').get(function() {
  return this.attachments && this.attachments.length > 0;
});

// Virtual to check if message is deleted
MessageSchema.virtual('isDeleted').get(function() {
  return !!this.deletedAt;
});

// Method to mark message as read
MessageSchema.methods.markAsRead = function() {
  if (!this.readAt) {
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to soft delete
MessageSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  this.content = '[Message deleted]';
  this.attachments = [];
  return this.save();
};

// Static method to get messages for a conversation (paginated)
MessageSchema.statics.getConversationMessages = async function(
  conversationId: mongoose.Types.ObjectId | string,
  options: { limit?: number; before?: Date; after?: Date } = {}
) {
  const { limit = 50, before, after } = options;
  
  const query: any = { 
    conversationId,
    deletedAt: { $exists: false },
  };
  
  if (before) {
    query.createdAt = { $lt: before };
  }
  if (after) {
    query.createdAt = { ...query.createdAt, $gt: after };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to mark all messages in conversation as read
MessageSchema.statics.markAllAsRead = async function(
  conversationId: mongoose.Types.ObjectId | string,
  readerType: 'patient' | 'provider'
) {
  // Only mark messages from the other party as read
  const senderTypeToMark = readerType === 'patient' ? 'provider' : 'patient';
  
  return this.updateMany(
    { 
      conversationId, 
      senderType: senderTypeToMark,
      readAt: { $exists: false },
    },
    { $set: { readAt: new Date() } }
  );
};

// Ensure virtuals are included in JSON
MessageSchema.set('toJSON', { virtuals: true });
MessageSchema.set('toObject', { virtuals: true });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);

