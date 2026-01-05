/**
 * File Upload Service
 * 
 * Handles file uploads for the messaging system.
 * Supports PDF, PNG, and JPEG files with size limits.
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ],
  allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg'],
  uploadDir: path.resolve(__dirname, '../../../uploads/messages'),
};

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_CONFIG.uploadDir)) {
  fs.mkdirSync(UPLOAD_CONFIG.uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_CONFIG.uploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: uuid-timestamp.extension
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${randomUUID()}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  // Check extension
  if (!UPLOAD_CONFIG.allowedExtensions.includes(ext)) {
    return cb(new Error(`File extension ${ext} is not allowed. Allowed: ${UPLOAD_CONFIG.allowedExtensions.join(', ')}`));
  }

  // Check MIME type
  if (!UPLOAD_CONFIG.allowedMimeTypes.includes(mimeType)) {
    return cb(new Error(`File type ${mimeType} is not allowed. Allowed: ${UPLOAD_CONFIG.allowedMimeTypes.join(', ')}`));
  }

  cb(null, true);
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: UPLOAD_CONFIG.maxFileSize,
    files: 5, // Max 5 files per message
  },
});

// Helper to get file URL path
export function getFileUrl(filename: string): string {
  return `/api/messages/files/${filename}`;
}

// Helper to get full file path
export function getFilePath(filename: string): string {
  return path.join(UPLOAD_CONFIG.uploadDir, filename);
}

// Helper to delete a file
export async function deleteFile(filename: string): Promise<boolean> {
  try {
    const filePath = getFilePath(filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[FileUpload] Error deleting file:', error);
    return false;
  }
}

// Helper to check if file exists
export function fileExists(filename: string): boolean {
  return fs.existsSync(getFilePath(filename));
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get file icon based on mime type
export function getFileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.startsWith('image/')) return '🖼️';
  return '📎';
}

