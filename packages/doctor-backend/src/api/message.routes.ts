/**
 * Message Routes
 * 
 * Endpoints for sending and receiving messages.
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../auth/index.js';
import { Conversation, Message } from '../models/index.js';
import config from '../config/index.js';

const router = Router();

// Ensure upload directory exists
const uploadDir = config.uploadDir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSize,
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

/**
 * GET /api/messages/conversations/:id/messages
 * Get messages for a conversation
 */
router.get('/conversations/:id/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const providerId = req.doctor!.providerId;
    const { id } = req.params;
    const { before, limit = '50' } = req.query;

    // Verify doctor has access to this conversation
    const conversation = await Conversation.findOne({ _id: id, providerId });
    if (!conversation) {
      res.status(404).json({ 
        error: 'NOT_FOUND',
        message: 'Conversation not found' 
      });
      return;
    }

    const query: Record<string, unknown> = { conversationId: id };
    if (before) {
      query.createdAt = { $lt: new Date(before as string) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string, 10))
      .lean();

    // Reverse to get chronological order
    messages.reverse();

    res.json({ messages });
  } catch (error) {
    console.error('[Messages] Get messages error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch messages' 
    });
  }
});

/**
 * POST /api/messages/conversations/:id/messages
 * Send a message to a conversation
 */
router.post(
  '/conversations/:id/messages',
  requireAuth,
  upload.array('attachments', 5),
  async (req: Request, res: Response) => {
    try {
      const providerId = req.doctor!.providerId;
      const { id } = req.params;
      const { content } = req.body;
      const files = req.files as Express.Multer.File[] | undefined;

      if (!content && (!files || files.length === 0)) {
        res.status(400).json({ 
          error: 'VALIDATION_ERROR',
          message: 'Message content or attachments required' 
        });
        return;
      }

      // Verify doctor has access to this conversation
      const conversation = await Conversation.findOne({ _id: id, providerId });
      if (!conversation) {
        res.status(404).json({ 
          error: 'NOT_FOUND',
          message: 'Conversation not found' 
        });
        return;
      }

      // Process attachments
      const attachments = files?.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/api/messages/files/${file.filename}`,
      })) || [];

      // Create message
      const message = await Message.create({
        conversationId: id,
        senderType: 'provider',
        senderId: providerId,
        content: content || '',
        attachments,
      });

      // Update conversation
      await Conversation.findByIdAndUpdate(id, {
        lastMessageAt: new Date(),
        lastMessagePreview: content?.substring(0, 100) || '[Attachment]',
        lastMessageSenderType: 'provider',
        $inc: { unreadByPatient: 1 },
      });

      res.status(201).json({ message });
    } catch (error) {
      console.error('[Messages] Send message error:', error);
      res.status(500).json({ 
        error: 'INTERNAL_ERROR',
        message: 'Failed to send message' 
      });
    }
  }
);

/**
 * GET /api/messages/files/:filename
 * Download a file attachment
 */
router.get('/files/:filename', requireAuth, async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const providerId = req.doctor!.providerId;

    // Find the message with this attachment to verify access
    const message = await Message.findOne({
      'attachments.filename': filename,
    }).populate<{ conversationId: { providerId: { toString: () => string } } }>('conversationId');

    if (!message || !message.conversationId) {
      res.status(404).json({ 
        error: 'NOT_FOUND',
        message: 'File not found' 
      });
      return;
    }

    // Check if doctor has access
    const conversation = message.conversationId as unknown as { providerId: { toString: () => string } };
    if (conversation.providerId.toString() !== providerId) {
      res.status(403).json({ 
        error: 'FORBIDDEN',
        message: 'Access denied' 
      });
      return;
    }

    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ 
        error: 'NOT_FOUND',
        message: 'File not found' 
      });
      return;
    }

    const attachment = message.attachments.find(a => a.filename === filename);
    res.setHeader('Content-Type', attachment?.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${attachment?.originalName || filename}"`);
    
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('[Messages] File download error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to download file' 
    });
  }
});

export default router;

