/**
 * Patient Routes
 * 
 * Endpoints for viewing patient data (read-only).
 * Doctors can only view patients they have conversations with.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/index.js';
import { Conversation, User, PatientProfile } from '../models/index.js';

const router = Router();

/**
 * GET /api/patients
 * List all patients the doctor has conversations with
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const providerId = req.doctor!.providerId;

    // Get unique patient IDs from conversations
    const conversations = await Conversation.find({ providerId })
      .select('patientId')
      .lean();

    const patientIds = [...new Set(conversations.map(c => c.patientId.toString()))];

    const patients = await User.find({ _id: { $in: patientIds } })
      .select('name email createdAt')
      .lean();

    res.json({ patients });
  } catch (error) {
    console.error('[Patients] List error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch patients' 
    });
  }
});

/**
 * GET /api/patients/:id
 * Get patient basic info
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const providerId = req.doctor!.providerId;
    const { id } = req.params;

    // Verify doctor has a conversation with this patient
    const hasAccess = await Conversation.exists({ providerId, patientId: id });
    if (!hasAccess) {
      res.status(403).json({ 
        error: 'FORBIDDEN',
        message: 'You do not have access to this patient' 
      });
      return;
    }

    const patient = await User.findById(id)
      .select('name email preferences createdAt')
      .lean();

    if (!patient) {
      res.status(404).json({ 
        error: 'NOT_FOUND',
        message: 'Patient not found' 
      });
      return;
    }

    res.json({ patient });
  } catch (error) {
    console.error('[Patients] Get error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch patient' 
    });
  }
});

/**
 * GET /api/patients/:id/profile
 * Get patient health profile
 */
router.get('/:id/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const providerId = req.doctor!.providerId;
    const { id } = req.params;

    // Verify doctor has a conversation with this patient
    const hasAccess = await Conversation.exists({ providerId, patientId: id });
    if (!hasAccess) {
      res.status(403).json({ 
        error: 'FORBIDDEN',
        message: 'You do not have access to this patient' 
      });
      return;
    }

    // Get patient user info
    const patient = await User.findById(id)
      .select('name email')
      .lean();

    if (!patient) {
      res.status(404).json({ 
        error: 'NOT_FOUND',
        message: 'Patient not found' 
      });
      return;
    }

    // Get patient profile
    const profile = await PatientProfile.findOne({ userId: id }).lean();

    res.json({ 
      patient: {
        ...patient,
        profile: profile || null,
      }
    });
  } catch (error) {
    console.error('[Patients] Get profile error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch patient profile' 
    });
  }
});

/**
 * GET /api/patients/:id/history
 * Get patient conversation history with this doctor
 */
router.get('/:id/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const providerId = req.doctor!.providerId;
    const { id } = req.params;

    const conversations = await Conversation.find({ 
      providerId, 
      patientId: id 
    })
      .sort({ createdAt: -1 })
      .lean();

    // Get message counts for each conversation
    const conversationsWithCounts = await Promise.all(
      conversations.map(async (conv) => {
        const messageCount = await Message.countDocuments({ 
          conversationId: conv._id 
        });
        return {
          _id: conv._id,
          subject: conv.subject,
          status: conv.status,
          messageCount,
          createdAt: conv.createdAt,
          lastMessageAt: conv.lastMessageAt,
        };
      })
    );

    res.json({ conversations: conversationsWithCounts });
  } catch (error) {
    console.error('[Patients] Get history error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch patient history' 
    });
  }
});

// Import Message for the history endpoint
import { Message } from '../models/index.js';

export default router;

