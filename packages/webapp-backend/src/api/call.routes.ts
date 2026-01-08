/**
 * Call Routes
 * 
 * WebRTC signaling endpoints for audio calls between patients and doctors.
 * 
 * Flow:
 * 1. Caller initiates call (POST /calls/initiate)
 * 2. Callee polls for incoming calls (GET /calls/incoming)
 * 3. Caller sends offer (POST /calls/:id/offer)
 * 4. Callee sends answer (POST /calls/:id/answer)
 * 5. Both exchange ICE candidates (POST /calls/:id/ice)
 * 6. Either party ends call (POST /calls/:id/end)
 */

import { Router, Response } from 'express';
import { Call } from '../models/call.model.js';
import { Conversation } from '../models/conversation.model.js';
import { Provider } from '../models/provider.model.js';
import { User } from '../models/user.model.js';
import { authenticate } from '../auth/auth.middleware.js';
import { AuthenticatedRequest } from '../auth/auth.types.js';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Clean up stale calls (for debugging)
 * DELETE /api/calls/cleanup
 */
router.delete('/cleanup', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await Call.updateMany(
      { 
        status: { $in: ['pending', 'ringing'] },
        initiatedAt: { $lt: new Date(Date.now() - 2 * 60 * 1000) } // older than 2 minutes
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
router.post('/initiate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user!.userId;

    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId is required' });
    }

    // Get conversation to determine caller/callee
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Determine if caller is patient or provider
    const isPatient = conversation.patientId.toString() === userId;
    const isProvider = conversation.providerId?.toString() === userId;

    if (!isPatient && !isProvider) {
      return res.status(403).json({ error: 'Not authorized for this conversation' });
    }

    // Check for existing active call in this conversation
    const existingCall = await Call.findOne({
      conversationId,
      status: { $in: ['pending', 'ringing', 'active'] },
    });

    if (existingCall) {
      // Auto-cleanup stale calls (older than 2 minutes)
      const callAge = Date.now() - existingCall.initiatedAt.getTime();
      const TWO_MINUTES = 2 * 60 * 1000;
      
      if (callAge > TWO_MINUTES && existingCall.status !== 'active') {
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

    // Create new call
    const call = await Call.create({
      conversationId,
      callerId: userId,
      callerType: isPatient ? 'patient' : 'provider',
      calleeId: isPatient ? conversation.providerId : conversation.patientId,
      calleeType: isPatient ? 'provider' : 'patient',
      status: 'pending',
      initiatedAt: new Date(),
    });

    res.status(201).json({
      callId: call._id,
      status: call.status,
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
router.get('/incoming', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Find any pending/ringing calls where user is the callee
    const incomingCall = await Call.findOne({
      calleeId: userId,
      status: { $in: ['pending', 'ringing'] },
    }).sort({ initiatedAt: -1 });

    if (!incomingCall) {
      return res.json({ hasIncomingCall: false });
    }

    // Get caller info
    let callerName = 'Unknown';
    let callerPhone: string | undefined;

    if (incomingCall.callerType === 'patient') {
      const patient = await User.findById(incomingCall.callerId);
      callerName = patient ? `${patient.firstName} ${patient.lastName}` : 'Patient';
      callerPhone = patient?.phone;
    } else {
      const provider = await Provider.findById(incomingCall.callerId);
      callerName = provider?.name || 'Doctor';
      callerPhone = provider?.phone;
    }

    // Update status to ringing if it was pending
    if (incomingCall.status === 'pending') {
      incomingCall.status = 'ringing';
      await incomingCall.save();
    }

    res.json({
      hasIncomingCall: true,
      call: {
        callId: incomingCall._id,
        conversationId: incomingCall.conversationId,
        callerName,
        callerPhone,
        callerType: incomingCall.callerType,
        status: incomingCall.status,
        initiatedAt: incomingCall.initiatedAt,
        offer: incomingCall.offer,
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
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const lastIceIndex = parseInt(req.query.lastIceIndex as string) || 0;
    const userId = req.user!.userId;

    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // Verify user is part of this call
    if (call.callerId.toString() !== userId && call.calleeId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const isCaller = call.callerId.toString() === userId;
    
    // Filter ICE candidates from the other party and only return new ones
    const otherParty = isCaller ? 'callee' : 'caller';
    const allCandidates = call.iceCandidates.filter(c => c.from === otherParty);
    const newCandidates = allCandidates.slice(lastIceIndex);

    res.json({
      callId: call._id,
      conversationId: call.conversationId,
      status: call.status,
      endReason: call.endReason,
      isCaller,
      offer: call.offer,
      answer: call.answer,
      // Return only NEW ICE candidates from the other party
      iceCandidates: newCandidates,
      iceIndex: allCandidates.length, // Client should track this for next request
      initiatedAt: call.initiatedAt,
      answeredAt: call.answeredAt,
      duration: call.duration,
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
router.post('/:id/offer', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { offer } = req.body;
    const userId = req.user!.userId;

    if (!offer?.sdp || !offer?.type) {
      return res.status(400).json({ error: 'Invalid offer format' });
    }

    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    if (call.callerId.toString() !== userId) {
      return res.status(403).json({ error: 'Only caller can send offer' });
    }

    if (call.status !== 'pending' && call.status !== 'ringing') {
      return res.status(400).json({ error: 'Call is not in valid state for offer' });
    }

    call.offer = offer;
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
router.post('/:id/answer', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;
    const userId = req.user!.userId;

    if (!answer?.sdp || !answer?.type) {
      return res.status(400).json({ error: 'Invalid answer format' });
    }

    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    if (call.calleeId.toString() !== userId) {
      return res.status(403).json({ error: 'Only callee can send answer' });
    }

    if (call.status !== 'ringing') {
      return res.status(400).json({ error: 'Call is not ringing' });
    }

    call.answer = answer;
    call.status = 'active';
    call.answeredAt = new Date();
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
router.post('/:id/ice', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { candidate } = req.body;
    const userId = req.user!.userId;

    if (!candidate) {
      return res.status(400).json({ error: 'Candidate is required' });
    }

    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    const isCaller = call.callerId.toString() === userId;
    const isCallee = call.calleeId.toString() === userId;

    if (!isCaller && !isCallee) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    call.iceCandidates.push({
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex,
      from: isCaller ? 'caller' : 'callee',
    });
    await call.save();

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
router.post('/:id/decline', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    if (call.calleeId.toString() !== userId) {
      return res.status(403).json({ error: 'Only callee can decline' });
    }

    if (call.status !== 'pending' && call.status !== 'ringing') {
      return res.status(400).json({ error: 'Call cannot be declined' });
    }

    call.status = 'declined';
    call.endReason = 'declined';
    call.endedAt = new Date();
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
router.post('/:id/end', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user!.userId;

    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    if (call.callerId.toString() !== userId && call.calleeId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // If call was already ended, just return success
    if (call.status === 'ended' || call.status === 'missed' || call.status === 'declined' || call.status === 'failed') {
      return res.json({ success: true, alreadyEnded: true });
    }

    const isCaller = call.callerId.toString() === userId;
    const endedAt = new Date();

    // Determine end reason
    let endReason = reason || 'completed';
    if (call.status === 'pending' || call.status === 'ringing') {
      endReason = isCaller ? 'cancelled' : 'declined';
      call.status = isCaller ? 'missed' : 'declined';
    } else {
      call.status = 'ended';
    }

    call.endReason = endReason;
    call.endedAt = endedAt;

    // Calculate duration if call was answered
    if (call.answeredAt) {
      call.duration = Math.round((endedAt.getTime() - call.answeredAt.getTime()) / 1000);
    }

    await call.save();

    res.json({ 
      success: true,
      duration: call.duration,
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
router.post('/:id/fallback', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    if (call.callerId.toString() !== userId && call.calleeId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    call.fallbackUsed = true;
    call.status = 'failed';
    call.endReason = 'failed';
    call.endedAt = new Date();
    await call.save();

    res.json({ success: true });
  } catch (error) {
    console.error('[Call] Fallback error:', error);
    res.status(500).json({ error: 'Failed to mark fallback' });
  }
});

/**
 * Get call history for a conversation
 * GET /api/calls/history/:conversationId
 */
router.get('/history/:conversationId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.userId;

    // Verify user has access to this conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isPatient = conversation.patientId.toString() === userId;
    const isProvider = conversation.providerId?.toString() === userId;

    if (!isPatient && !isProvider) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const calls = await Call.find({ conversationId })
      .select('status endReason initiatedAt answeredAt endedAt duration callerType fallbackUsed')
      .sort({ initiatedAt: -1 })
      .limit(50);

    res.json({ calls });
  } catch (error) {
    console.error('[Call] History error:', error);
    res.status(500).json({ error: 'Failed to get call history' });
  }
});

export default router;

