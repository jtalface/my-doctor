/**
 * Message Model (Shared)
 * 
 * Same schema as webapp-backend. Both apps use the same collection.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderType: 'patient' | 'provider';
  senderId: mongoose.Types.ObjectId;
  content: string;
  attachments: IAttachment[];
  isRead: boolean;
  readAt?: Date;
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
      refPath: 'senderType',
    },
    content: { type: String, required: true },
    attachments: [AttachmentSchema],
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
