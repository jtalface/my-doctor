/**
 * Call Routes (Doctor Backend)
 * 
 * WebRTC signaling endpoints for audio calls between doctors and patients.
 * Uses the same Call model from the shared MongoDB.
 */

import { Router, Request, Response } from 'express';
import mongoose, { Document, Model } from 'mongoose';
import { requireAuth } from '../auth/auth.middleware.js';
import { Conversation, User } from '../models/index.js';

// Call model schema (shared with webapp-backend via same MongoDB)
const CallSchema = new mongoose.Schema(
  {
    conversationId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Conversation', 
      required: true,
      index: true,
    },
    callerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
      index: true,
    },
    callerType: { 
      type: String, 
      enum: ['patient', 'provider'], 
      required: true,
    },
    calleeId: { 
      type: mongoose.Schema.Types.ObjectId, 
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
      type: {
        sdp: { type: String },
        type: { type: String },
      },
      required: false,
    },
    answer: {
      type: {
        sdp: { type: String },
        type: { type: String },
      },
      required: false,
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

// Interface for Call document
interface ICall extends Document {
  conversationId: mongoose.Types.ObjectId;
  callerId: mongoose.Types.ObjectId;
  callerType: 'patient' | 'provider';
  calleeId: mongoose.Types.ObjectId;
  calleeType: 'patient' | 'provider';
  status: 'pending' | 'ringing' | 'active' | 'ended' | 'missed' | 'declined' | 'failed';
  endReason?: 'completed' | 'missed' | 'declined' | 'busy' | 'failed' | 'cancelled';
  offer?: { sdp: string; type: string };
  answer?: { sdp: string; type: string };
  iceCandidates: Array<{
    candidate: string;
    sdpMid: string;
    sdpMLineIndex: number;
    from: 'caller' | 'callee';
  }>;
  initiatedAt: Date;
  answeredAt?: Date;
  endedAt?: Date;
  duration?: number;
  fallbackUsed: boolean;
}

// Use existing model or create new one (handles hot-reloading)
const Call: Model<ICall> = (mongoose.models.Call as Model<ICall>) || mongoose.model<ICall>('Call', CallSchema);

const router: Router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * Clean up stale calls (for debugging)
 * DELETE /api/calls/cleanup
 */
router.delete('/cleanup', async (_req: Request, res: Response) => {
  try {
    const result = await Call.updateMany(
      { 
        status: { $in: ['pending', 'ringing'] },
        initiatedAt: { $lt: new Date(Date.now() - 30 * 1000) } // older than 30 seconds
      },
      { 
        $set: { 
          status: 'failed',
          endReason: 'failed',
          endedAt: new Date()
        }
      }
    );
    
    console.log(`[Call] Cleaned up ${result.modifiedCount} stale calls`);
    res.json({ 
      message: `Cleaned up ${result.modifiedCount} stale calls`,
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('[Call] Cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup calls' });
  }
});

/**
 * Initiate a call
 * POST /api/calls/initiate
 */
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.body;
    const doctorId = req.doctor!.providerId;

    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId is required' });
    }

    // Get conversation to determine callee
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify doctor is the provider in this conversation
    if (conversation.get('providerId')?.toString() !== doctorId) {
      return res.status(403).json({ error: 'Not authorized for this conversation' });
    }

    // Check for existing active call
    const existingCall = await Call.findOne({
      conversationId,
      status: { $in: ['pending', 'ringing', 'active'] },
    });

    if (existingCall) {
      // Auto-cleanup stale calls (older than 30 seconds for pending/ringing)
      const callAge = Date.now() - existingCall.initiatedAt.getTime();
      const STALE_TIMEOUT = 30 * 1000; // 30 seconds
      
      if (callAge > STALE_TIMEOUT && existingCall.status !== 'active') {
        // Mark stale call as failed and allow new call
        console.log(`[Call] Auto-cleaning stale call ${existingCall._id} (age: ${Math.round(callAge / 1000)}s)`);
        existingCall.status = 'failed';
        existingCall.endReason = 'failed';
        existingCall.endedAt = new Date();
        await existingCall.save();
      } else {
        return res.status(409).json({ 
          error: 'Call already in progress',
          callId: existingCall._id,
        });
      }
    }

    // Create new call (doctor is caller, patient is callee)
    const call = await Call.create({
      conversationId,
      callerId: doctorId,
      callerType: 'provider',
      calleeId: conversation.get('patientId'),
      calleeType: 'patient',
      status: 'pending',
      initiatedAt: new Date(),
    });

    res.status(201).json({
      callId: call._id,
      status: call.get('status'),
    });
  } catch (error) {
    console.error('[Call] Initiate error:', error);
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});

/**
 * Check for incoming calls
 * GET /api/calls/incoming
 */
router.get('/incoming', async (req: Request, res: Response) => {
  try {
    const doctorId = req.doctor!.providerId;

    // Find any pending/ringing calls where doctor is the callee
    const incomingCall = await Call.findOne({
      calleeId: doctorId,
      status: { $in: ['pending', 'ringing'] },
    }).sort({ initiatedAt: -1 });

    if (!incomingCall) {
      return res.json({ hasIncomingCall: false });
    }

    // Get patient info
    const patient = await User.findById(incomingCall.get('callerId'));
    const callerName = patient ? `${patient.get('firstName')} ${patient.get('lastName')}` : 'Patient';

    // Update status to ringing if pending
    if (incomingCall.get('status') === 'pending') {
      incomingCall.set('status', 'ringing');
      await incomingCall.save();
    }

    res.json({
      hasIncomingCall: true,
      call: {
        callId: incomingCall._id,
        conversationId: incomingCall.get('conversationId'),
        callerName,
        callerPhone: patient?.get('phone'),
        callerType: incomingCall.get('callerType'),
        status: incomingCall.get('status'),
        initiatedAt: incomingCall.get('initiatedAt'),
        offer: incomingCall.get('offer'),
      },
    });
  } catch (error) {
    console.error('[Call] Incoming check error:', error);
    res.status(500).json({ error: 'Failed to check incoming calls' });
  }
});

/**
 * Get call status
 * GET /api/calls/:id
 * 
 * Query params:
 * - lastIceIndex: Index of last processed ICE candidate (to avoid re-sending)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lastIceIndex = parseInt(req.query.lastIceIndex as string) || 0;
    const doctorId = req.doctor!.providerId;

    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // Verify doctor is part of this call
    if (call.get('callerId')?.toString() !== doctorId && call.get('calleeId')?.toString() !== doctorId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const isCaller = call.get('callerId')?.toString() === doctorId;
    
    // Filter ICE candidates from the other party and only return new ones
    const otherParty = isCaller ? 'callee' : 'caller';
    const allCandidates = (call.get('iceCandidates') || []).filter(
      (c: any) => c.from === otherParty
    );
    const newCandidates = allCandidates.slice(lastIceIndex);

    res.json({
      callId: call._id,
      conversationId: call.get('conversationId'),
      status: call.get('status'),
      endReason: call.get('endReason'),
      isCaller,
      offer: call.get('offer'),
      answer: call.get('answer'),
      // Return only NEW ICE candidates from the other party
      iceCandidates: newCandidates,
      iceIndex: allCandidates.length, // Client should track this for next request
      initiatedAt: call.get('initiatedAt'),
      answeredAt: call.get('answeredAt'),
      duration: call.get('duration'),
    });
  } catch (error) {
    console.error('[Call] Get status error:', error);
    res.status(500).json({ error: 'Failed to get call status' });
  }
});

/**
 * Send WebRTC offer (caller only)
 * POST /api/calls/:id/offer
 */
router.post('/:id/offer', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { offer } = req.body;
    const doctorId = req.doctor!.providerId;

    if (!offer?.sdp || !offer?.type) {
      return res.status(400).json({ error: 'Invalid offer format' });
    }

    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    if (call.get('callerId')?.toString() !== doctorId) {
      return res.status(403).json({ error: 'Only caller can send offer' });
    }

    call.set('offer', offer);
    await call.save();

    res.json({ success: true });
  } catch (error) {
    console.error('[Call] Offer error:', error);
    res.status(500).json({ error: 'Failed to send offer' });
  }
});

/**
 * Send WebRTC answer (callee only)
 * POST /api/calls/:id/answer
 */
router.post('/:id/answer', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;
    const doctorId = req.doctor!.providerId;

    if (!answer?.sdp || !answer?.type) {
      return res.status(400).json({ error: 'Invalid answer format' });
    }

    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    if (call.get('calleeId')?.toString() !== doctorId) {
      return res.status(403).json({ error: 'Only callee can send answer' });
    }

    if (call.get('status') !== 'ringing') {
      return res.status(400).json({ error: 'Call is not ringing' });
    }

    call.set('answer', answer);
    call.set('status', 'active');
    call.set('answeredAt', new Date());
    await call.save();

    res.json({ success: true });
  } catch (error) {
    console.error('[Call] Answer error:', error);
    res.status(500).json({ error: 'Failed to send answer' });
  }
});

/**
 * Send ICE candidate
 * POST /api/calls/:id/ice
 */
router.post('/:id/ice', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { candidate } = req.body;
    const doctorId = req.doctor!.providerId;

    if (!candidate) {
      return res.status(400).json({ error: 'Candidate is required' });
    }

    // First, verify the call exists and user is authorized
    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    const isCaller = call.get('callerId')?.toString() === doctorId;
    const isCallee = call.get('calleeId')?.toString() === doctorId;

    if (!isCaller && !isCallee) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Use atomic $push to avoid version conflicts
    await Call.findByIdAndUpdate(
      id,
      {
        $push: {
          iceCandidates: {
            candidate: candidate.candidate,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex,
            from: isCaller ? 'caller' : 'callee',
          }
        }
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('[Call] ICE error:', error);
    res.status(500).json({ error: 'Failed to send ICE candidate' });
  }
});

/**
 * Decline incoming call (callee only)
 * POST /api/calls/:id/decline
 */
router.post('/:id/decline', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = req.doctor!.providerId;

    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    if (call.get('calleeId')?.toString() !== doctorId) {
      return res.status(403).json({ error: 'Only callee can decline' });
    }

    const status = call.get('status');
    if (status !== 'pending' && status !== 'ringing') {
      return res.status(400).json({ error: 'Call cannot be declined' });
    }

    call.set('status', 'declined');
    call.set('endReason', 'declined');
    call.set('endedAt', new Date());
    await call.save();

    res.json({ success: true });
  } catch (error) {
    console.error('[Call] Decline error:', error);
    res.status(500).json({ error: 'Failed to decline call' });
  }
});

/**
 * End call
 * POST /api/calls/:id/end
 */
router.post('/:id/end', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const doctorId = req.doctor!.providerId;

    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    if (call.get('callerId')?.toString() !== doctorId && call.get('calleeId')?.toString() !== doctorId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const status = call.get('status');
    if (status === 'ended' || status === 'missed' || status === 'declined' || status === 'failed') {
      return res.json({ success: true, alreadyEnded: true });
    }

    const isCaller = call.get('callerId')?.toString() === doctorId;
    const endedAt = new Date();

    let endReason = reason || 'completed';
    if (status === 'pending' || status === 'ringing') {
      endReason = isCaller ? 'cancelled' : 'declined';
      call.set('status', isCaller ? 'missed' : 'declined');
    } else {
      call.set('status', 'ended');
    }

    call.set('endReason', endReason);
    call.set('endedAt', endedAt);

    const answeredAt = call.get('answeredAt');
    if (answeredAt) {
      call.set('duration', Math.round((endedAt.getTime() - new Date(answeredAt).getTime()) / 1000));
    }

    await call.save();

    res.json({ 
      success: true,
      duration: call.get('duration'),
    });
  } catch (error) {
    console.error('[Call] End error:', error);
    res.status(500).json({ error: 'Failed to end call' });
  }
});

/**
 * Mark that fallback (phone number) was used
 * POST /api/calls/:id/fallback
 */
router.post('/:id/fallback', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = req.doctor!.providerId;

    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    if (call.get('callerId')?.toString() !== doctorId && call.get('calleeId')?.toString() !== doctorId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    call.set('fallbackUsed', true);
    call.set('status', 'failed');
    call.set('endReason', 'failed');
    call.set('endedAt', new Date());
    await call.save();

    res.json({ success: true });
  } catch (error) {
    console.error('[Call] Fallback error:', error);
    res.status(500).json({ error: 'Failed to mark fallback' });
  }
});

export default router;

