/**
 * Call Model
 * 
 * Tracks audio calls between patients and doctors.
 * Uses WebRTC for peer-to-peer audio communication.
 */

import mongoose, { Document, Schema } from 'mongoose';

export type CallStatus = 
  | 'pending'      // Call initiated, waiting for answer
  | 'ringing'      // Callee notified
  | 'active'       // Call in progress
  | 'ended'        // Call completed normally
  | 'missed'       // Callee didn't answer
  | 'declined'     // Callee rejected the call
  | 'failed';      // Technical failure

export type CallEndReason =
  | 'completed'    // Normal hang up
  | 'missed'       // No answer (timeout)
  | 'declined'     // Rejected by callee
  | 'busy'         // Callee on another call
  | 'failed'       // Technical error
  | 'cancelled';   // Caller cancelled before answer

export interface ICall extends Document {
  conversationId: mongoose.Types.ObjectId;
  callerId: mongoose.Types.ObjectId;
  callerType: 'patient' | 'provider';
  calleeId: mongoose.Types.ObjectId;
  calleeType: 'patient' | 'provider';
  
  status: CallStatus;
  endReason?: CallEndReason;
  
  // WebRTC signaling data (stored temporarily during call setup)
  offer?: {
    sdp: string;
    type: string;
  };
  answer?: {
    sdp: string;
    type: string;
  };
  iceCandidates: Array<{
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
    from: 'caller' | 'callee';
  }>;
  
  // Timestamps
  initiatedAt: Date;
  answeredAt?: Date;
  endedAt?: Date;
  
  // Call duration in seconds (calculated when call ends)
  duration?: number;
  
  // Fallback info
  fallbackUsed?: boolean;  // True if user fell back to phone call
  
  createdAt: Date;
  updatedAt: Date;
}

const CallSchema = new Schema<ICall>(
  {
    conversationId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Conversation', 
      required: true,
      index: true,
    },
    callerId: { 
      type: Schema.Types.ObjectId, 
      required: true,
      index: true,
    },
    callerType: { 
      type: String, 
      enum: ['patient', 'provider'], 
      required: true,
    },
    calleeId: { 
      type: Schema.Types.ObjectId, 
      required: true,
      index: true,
    },
    calleeType: { 
      type: String, 
      enum: ['patient', 'provider'], 
      required: true,
    },
    status: { 
      type: String, 
      enum: ['pending', 'ringing', 'active', 'ended', 'missed', 'declined', 'failed'],
      default: 'pending',
      index: true,
    },
    endReason: { 
      type: String, 
      enum: ['completed', 'missed', 'declined', 'busy', 'failed', 'cancelled'],
    },
    offer: {
      type: Schema.Types.Mixed,
      default: null,
    },
    answer: {
      type: Schema.Types.Mixed,
      default: null,
    },
    iceCandidates: [{
      candidate: String,
      sdpMid: String,
      sdpMLineIndex: Number,
      from: { type: String, enum: ['caller', 'callee'] },
    }],
    initiatedAt: { type: Date, default: Date.now },
    answeredAt: Date,
    endedAt: Date,
    duration: Number,
    fallbackUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for finding active calls
CallSchema.index({ status: 1, calleeId: 1 });
CallSchema.index({ status: 1, callerId: 1 });

// Auto-expire pending/ringing calls after 60 seconds
CallSchema.index(
  { initiatedAt: 1 },
  { 
    expireAfterSeconds: 300,  // Clean up old call records after 5 minutes
    partialFilterExpression: { status: { $in: ['pending', 'ringing', 'missed'] } }
  }
);

export const Call = mongoose.model<ICall>('Call', CallSchema);

