/**
 * Conversation Routes
 * 
 * Endpoints for managing doctor conversations with patients.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/index.js';
import { Conversation, Message, User } from '../models/index.js';

const router = Router();

/**
 * GET /api/conversations
 * List all conversations for the current doctor
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const providerId = req.doctor!.providerId;
    const { status = 'active', page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    const take = parseInt(limit as string, 10);

    const query: Record<string, unknown> = { providerId };
    if (status !== 'all') {
      query.status = status;
    }

    const [conversations, total] = await Promise.all([
      Conversation.find(query)
        .populate('patientId', 'firstName lastName email')
        .populate('dependentId', 'firstName lastName')
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      Conversation.countDocuments(query),
    ]);

    // Transform for response with name virtual
    const formattedConversations = conversations.map(conv => {
      const patient = conv.patientId as any;
      const dependent = conv.dependentId as any;
      return {
        _id: conv._id,
        patient: patient ? {
          ...patient,
          name: `${patient.firstName} ${patient.lastName}`.trim(),
        } : null,
        dependent: dependent ? {
          ...dependent,
          name: `${dependent.firstName} ${dependent.lastName}`.trim(),
        } : null,
        subject: conv.subject,
        lastMessageAt: conv.lastMessageAt,
        lastMessagePreview: conv.lastMessagePreview,
        lastMessageSenderType: conv.lastMessageSenderType,
        unreadCount: conv.unreadByProvider,
        status: conv.status,
        createdAt: conv.createdAt,
      };
    });

    res.json({
      conversations: formattedConversations,
      pagination: {
        page: parseInt(page as string, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('[Conversations] List error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch conversations' 
    });
  }
});

/**
 * GET /api/conversations/:id
 * Get a specific conversation
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const providerId = req.doctor!.providerId;
    const { id } = req.params;

    const conversation = await Conversation.findOne({ _id: id, providerId })
      .populate('patientId', 'firstName lastName email')
      .populate('dependentId', 'firstName lastName')
      .lean();

    if (!conversation) {
      res.status(404).json({ 
        error: 'NOT_FOUND',
        message: 'Conversation not found' 
      });
      return;
    }

    const patient = conversation.patientId as any;
    const dependent = conversation.dependentId as any;

    res.json({
      conversation: {
        _id: conversation._id,
        patient: patient ? {
          ...patient,
          name: `${patient.firstName} ${patient.lastName}`.trim(),
        } : null,
        dependent: dependent ? {
          ...dependent,
          name: `${dependent.firstName} ${dependent.lastName}`.trim(),
        } : null,
        subject: conversation.subject,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount: conversation.unreadByProvider,
        status: conversation.status,
        createdAt: conversation.createdAt,
      },
    });
  } catch (error) {
    console.error('[Conversations] Get error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch conversation' 
    });
  }
});

/**
 * PATCH /api/conversations/:id
 * Update conversation (status, subject)
 */
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const providerId = req.doctor!.providerId;
    const { id } = req.params;
    const { status, subject } = req.body;

    const update: Record<string, unknown> = {};
    if (status) update.status = status;
    if (subject !== undefined) update.subject = subject;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: id, providerId },
      { $set: update },
      { new: true }
    ).populate('patientId', 'firstName lastName email').lean();

    if (!conversation) {
      res.status(404).json({ 
        error: 'NOT_FOUND',
        message: 'Conversation not found' 
      });
      return;
    }

    const patient = conversation.patientId as any;
    res.json({ 
      conversation: {
        ...conversation,
        patient: patient ? {
          ...patient,
          name: `${patient.firstName} ${patient.lastName}`.trim(),
        } : null,
      }
    });
  } catch (error) {
    console.error('[Conversations] Update error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to update conversation' 
    });
  }
});

/**
 * POST /api/conversations/:id/read
 * Mark conversation as read
 */
router.post('/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const providerId = req.doctor!.providerId;
    const { id } = req.params;

    await Promise.all([
      Conversation.findOneAndUpdate(
        { _id: id, providerId },
        { $set: { unreadByProvider: 0 } }
      ),
      Message.updateMany(
        { 
          conversationId: id, 
          senderType: 'patient',
          isRead: false 
        },
        { 
          $set: { isRead: true, readAt: new Date() } 
        }
      ),
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error('[Conversations] Mark read error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to mark as read' 
    });
  }
});

/**
 * GET /api/conversations/unread/count
 * Get total unread count
 */
router.get('/unread/count', requireAuth, async (req: Request, res: Response) => {
  try {
    const providerId = req.doctor!.providerId;

    const conversations = await Conversation.find({ 
      providerId, 
      unreadByProvider: { $gt: 0 } 
    }).select('unreadByProvider').lean();

    const totalUnread = conversations.reduce(
      (sum, conv) => sum + conv.unreadByProvider, 
      0
    );

    res.json({ unreadCount: totalUnread });
  } catch (error) {
    console.error('[Conversations] Unread count error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to get unread count' 
    });
  }
});

export default router;

