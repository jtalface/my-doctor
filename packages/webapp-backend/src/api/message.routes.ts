/**
 * Message Routes
 * 
 * API endpoints for the patient-doctor messaging system.
 * Handles conversations, messages, file uploads, and provider status.
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';

import { authenticate } from '../auth/index.js';
import { Conversation } from '../models/conversation.model.js';
import { Message, IAttachment } from '../models/message.model.js';
import { Provider } from '../models/provider.model.js';
import { 
  upload, 
  getFileUrl, 
  getFilePath, 
  deleteFile,
} from '../services/messaging/file-upload.js';

const router: Router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

// ============================================================================
// PROVIDER ROUTES
// ============================================================================

/**
 * GET /api/messages/providers
 * List all available healthcare providers
 */
router.get('/providers', async (_req: Request, res: Response) => {
  try {
    const providers = await Provider.find({ isActive: true })
      .select('firstName lastName email specialty title avatarUrl isAvailable lastActiveAt languages')
      .sort({ lastName: 1, firstName: 1 })
      .lean();

    // Add isOnline virtual and name
    const providersWithStatus = providers.map(provider => ({
      ...provider,
      name: `${provider.firstName} ${provider.lastName}`.trim(),
      isOnline: provider.lastActiveAt 
        ? new Date(provider.lastActiveAt) > new Date(Date.now() - 5 * 60 * 1000)
        : false,
    }));

    res.json(providersWithStatus);
  } catch (error) {
    console.error('[Messages] Error fetching providers:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

/**
 * GET /api/messages/providers/:providerId
 * Get a specific provider's details
 */
router.get('/providers/:providerId', async (req: Request, res: Response) => {
  try {
    const providerId = req.params.providerId;

    if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({ error: 'Invalid provider ID' });
    }

    const provider = await Provider.findById(providerId)
      .select('firstName lastName email specialty title avatarUrl bio phone isAvailable lastActiveAt languages workingHours')
      .lean();

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Add isOnline virtual and name
    const providerWithStatus = {
      ...provider,
      name: `${provider.firstName} ${provider.lastName}`.trim(),
      isOnline: provider.lastActiveAt 
        ? new Date(provider.lastActiveAt) > new Date(Date.now() - 5 * 60 * 1000)
        : false,
    };

    res.json(providerWithStatus);
  } catch (error) {
    console.error('[Messages] Error fetching provider:', error);
    res.status(500).json({ error: 'Failed to fetch provider' });
  }
});

// ============================================================================
// CONVERSATION ROUTES
// ============================================================================

/**
 * GET /api/messages/conversations
 * List all conversations for the current user
 */
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { dependentId } = req.query;

    const query: any = { patientId: userId, status: { $ne: 'closed' } };
    
    // If dependentId is provided, filter by it
    if (dependentId) {
      query.dependentId = dependentId;
    }

    const conversations = await Conversation.find(query)
      .populate('providerId', 'firstName lastName specialty title avatarUrl lastActiveAt')
      .sort({ lastMessageAt: -1 })
      .lean();

    // Add provider online status and name
    const conversationsWithStatus = conversations.map(conv => {
      const provider = conv.providerId as any;
      return {
        ...conv,
        provider: provider ? {
          ...provider,
          name: `${provider.firstName} ${provider.lastName}`.trim(),
          isOnline: provider.lastActiveAt 
            ? new Date(provider.lastActiveAt) > new Date(Date.now() - 5 * 60 * 1000)
            : false,
        } : null,
      };
    });

    res.json(conversationsWithStatus);
  } catch (error) {
    console.error('[Messages] Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * POST /api/messages/conversations
 * Start a new conversation with a provider
 */
router.post('/conversations', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { providerId, subject, dependentId } = req.body;

    if (!providerId) {
      return res.status(400).json({ error: 'Provider ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({ error: 'Invalid provider ID' });
    }

    // Check if provider exists and is active
    const provider = await Provider.findOne({ _id: providerId, isActive: true });
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found or inactive' });
    }

    // Check for existing conversation
    // When dependentId is not provided, look for conversations without a dependent (null or missing)
    // When dependentId IS provided, look for that specific dependent's conversation
    const query: any = { 
      patientId: userId, 
      providerId,
    };
    
    if (dependentId) {
      query.dependentId = dependentId;
    } else {
      // Match documents where dependentId is null, undefined, or doesn't exist
      query.dependentId = { $in: [null, undefined] };
    }
    
    let conversation = await Conversation.findOne(query);

    if (conversation) {
      // Reactivate if archived
      if (conversation.status === 'archived') {
        conversation.status = 'active';
        await conversation.save();
      }
      
      // Populate and transform existing conversation
      await conversation.populate('providerId', 'firstName lastName specialty title avatarUrl lastActiveAt');
      const existingObj = conversation.toObject();
      const existingProvider = existingObj.providerId as any;
      
      return res.json({
        ...existingObj,
        provider: existingProvider ? {
          ...existingProvider,
          name: `${existingProvider.firstName} ${existingProvider.lastName}`.trim(),
          isOnline: existingProvider.lastActiveAt 
            ? new Date(existingProvider.lastActiveAt) > new Date(Date.now() - 5 * 60 * 1000)
            : false,
        } : null,
      });
    }

    // Create new conversation
    conversation = await Conversation.create({
      patientId: userId,
      providerId,
      subject,
      dependentId,
    });

    // Populate provider info and convert to plain object
    await conversation.populate('providerId', 'firstName lastName specialty title avatarUrl lastActiveAt');
    const conversationObj = conversation.toObject();
    const providerData = conversationObj.providerId as any;

    // Transform to match expected response format
    const response = {
      ...conversationObj,
      provider: providerData ? {
        ...providerData,
        name: `${providerData.firstName} ${providerData.lastName}`.trim(),
        isOnline: providerData.lastActiveAt 
          ? new Date(providerData.lastActiveAt) > new Date(Date.now() - 5 * 60 * 1000)
          : false,
      } : null,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('[Messages] Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

/**
 * GET /api/messages/conversations/:conversationId
 * Get a specific conversation
 */
router.get('/conversations/:conversationId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const conversationId = req.params.conversationId;

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const conversation = await Conversation.findOne({ 
      _id: conversationId,
      patientId: userId,
    })
      .populate('providerId', 'firstName lastName specialty title avatarUrl lastActiveAt bio phone')
      .lean();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Add provider online status and name
    const provider = conversation.providerId as any;
    const conversationWithStatus = {
      ...conversation,
      provider: provider ? {
        ...provider,
        name: `${provider.firstName} ${provider.lastName}`.trim(),
        isOnline: provider.lastActiveAt 
          ? new Date(provider.lastActiveAt) > new Date(Date.now() - 5 * 60 * 1000)
          : false,
      } : null,
    };

    res.json(conversationWithStatus);
  } catch (error) {
    console.error('[Messages] Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

/**
 * PATCH /api/messages/conversations/:conversationId
 * Update conversation (archive, close, etc.)
 */
router.patch('/conversations/:conversationId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const conversationId = req.params.conversationId;
    const { status, subject } = req.body;

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const conversation = await Conversation.findOne({ 
      _id: conversationId,
      patientId: userId,
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (status && ['active', 'archived', 'closed'].includes(status)) {
      conversation.status = status;
    }
    if (subject !== undefined) {
      conversation.subject = subject;
    }

    await conversation.save();
    res.json(conversation);
  } catch (error) {
    console.error('[Messages] Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

/**
 * POST /api/messages/conversations/:conversationId/read
 * Mark all messages in conversation as read
 */
router.post('/conversations/:conversationId/read', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const conversationId = req.params.conversationId;

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const conversation = await Conversation.findOne({ 
      _id: conversationId,
      patientId: userId,
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Mark messages as read
    await Message.updateMany(
      { 
        conversationId, 
        senderType: 'provider',
        readAt: { $exists: false },
      },
      { $set: { readAt: new Date() } }
    );

    // Reset unread count
    conversation.unreadByPatient = 0;
    await conversation.save();

    res.json({ success: true });
  } catch (error) {
    console.error('[Messages] Error marking as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// ============================================================================
// MESSAGE ROUTES
// ============================================================================

/**
 * GET /api/messages/conversations/:conversationId/messages
 * Get messages in a conversation (paginated)
 */
router.get('/conversations/:conversationId/messages', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const conversationId = req.params.conversationId;
    const { limit = 50, before, after } = req.query;

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    // Verify conversation belongs to user
    const conversation = await Conversation.findOne({ 
      _id: conversationId,
      patientId: userId,
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const query: any = { 
      conversationId,
      deletedAt: { $exists: false },
    };

    if (before) {
      query.createdAt = { $lt: new Date(before as string) };
    }
    if (after) {
      query.createdAt = { ...query.createdAt, $gt: new Date(after as string) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string, 10))
      .lean();

    // Return in chronological order (oldest first)
    res.json(messages.reverse());
  } catch (error) {
    console.error('[Messages] Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * POST /api/messages/conversations/:conversationId/messages
 * Send a new message (with optional attachments)
 */
router.post(
  '/conversations/:conversationId/messages',
  upload.array('attachments', 5),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const conversationId = req.params.conversationId;
      const { content } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({ error: 'Invalid conversation ID' });
      }

      // Verify conversation belongs to user
      const conversation = await Conversation.findOne({ 
        _id: conversationId,
        patientId: userId,
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      if (conversation.status === 'closed') {
        return res.status(400).json({ error: 'Cannot send messages in a closed conversation' });
      }

      // Must have content or attachments
      if (!content && (!files || files.length === 0)) {
        return res.status(400).json({ error: 'Message must have content or attachments' });
      }

      // Process attachments
      const attachments: IAttachment[] = files?.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: getFileUrl(file.filename),
      })) || [];

      // Create message
      const message = await Message.create({
        conversationId,
        senderType: 'patient',
        senderId: userId,
        content: content || '',
        attachments,
      });

      // Update conversation
      const preview = content || `[${attachments.length} attachment(s)]`;
      conversation.lastMessageAt = new Date();
      conversation.lastMessagePreview = preview.substring(0, 100);
      conversation.lastMessageSenderType = 'patient';
      conversation.unreadByProvider += 1;
      await conversation.save();

      res.status(201).json(message);
    } catch (error) {
      console.error('[Messages] Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
);

/**
 * DELETE /api/messages/messages/:messageId
 * Delete (soft) a message
 */
router.delete('/messages/:messageId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const messageId = req.params.messageId;

    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    const message = await Message.findOne({ 
      _id: messageId,
      senderType: 'patient',
      senderId: userId,
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Delete attachments from disk
    for (const attachment of message.attachments) {
      await deleteFile(attachment.filename);
    }

    // Soft delete
    message.deletedAt = new Date();
    message.content = '[Message deleted]';
    message.attachments = [];
    await message.save();

    res.json({ success: true });
  } catch (error) {
    console.error('[Messages] Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// ============================================================================
// FILE ROUTES
// ============================================================================

/**
 * GET /api/messages/files/:filename
 * Download a file attachment
 */
router.get('/files/:filename', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const filename = req.params.filename;

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    // Security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = getFilePath(filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Find the message with this attachment to verify access
    const message = await Message.findOne({
      'attachments.filename': filename,
    }).populate({
      path: 'conversationId',
      select: 'patientId',
    });

    if (!message) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify user has access to this conversation
    const conversation = message.conversationId as any;
    if (conversation.patientId.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get original filename for download
    const attachment = message.attachments.find(a => a.filename === filename);
    const downloadName = attachment?.originalName || filename;

    res.download(filePath, downloadName);
  } catch (error) {
    console.error('[Messages] Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// ============================================================================
// STATS ROUTES
// ============================================================================

/**
 * GET /api/messages/stats
 * Get messaging stats for the current user
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const [totalConversations, unreadCount] = await Promise.all([
      Conversation.countDocuments({ patientId: userId, status: { $ne: 'closed' } }),
      Conversation.aggregate([
        { $match: { patientId: new mongoose.Types.ObjectId(userId), status: { $ne: 'closed' } } },
        { $group: { _id: null, total: { $sum: '$unreadByPatient' } } },
      ]),
    ]);

    res.json({
      totalConversations,
      unreadMessages: unreadCount[0]?.total || 0,
    });
  } catch (error) {
    console.error('[Messages] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;

