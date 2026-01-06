/**
 * MessageBubble Component
 * 
 * Displays a single message with content and attachments.
 */

import { useState, useEffect } from 'react';
import { Message, MessageAttachment, api } from '../../services/api';
import { useTranslate } from '../../i18n';
import styles from './MessageBubble.module.css';

// Component to load authenticated images
function AuthenticatedImage({ 
  attachment, 
  onDownload 
}: { 
  attachment: MessageAttachment;
  onDownload?: () => void;
}) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    let blobUrl: string | null = null;
    
    const loadImage = async () => {
      try {
        const blob = await api.downloadFileAsBlob(attachment.filename);
        if (mounted) {
          blobUrl = URL.createObjectURL(blob);
          setImageSrc(blobUrl);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(true);
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [attachment.filename]);

  if (isLoading) {
    return <div className={styles.imageLoading}>Loading...</div>;
  }

  if (error || !imageSrc) {
    return (
      <div className={styles.imageError} onClick={onDownload}>
        <span>🖼️</span>
        <span>{attachment.originalName}</span>
      </div>
    );
  }

  return (
    <img 
      src={imageSrc} 
      alt={attachment.originalName}
      className={styles.attachmentImage}
      onClick={onDownload}
    />
  );
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  providerName?: string;
  onDownloadFile?: (attachment: MessageAttachment) => void;
}

export function MessageBubble({ 
  message, 
  isOwn, 
  providerName,
  onDownloadFile,
}: MessageBubbleProps) {
  const t = useTranslate();

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.startsWith('image/')) return '🖼️';
    return '📎';
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  if (message.isSystemMessage) {
    return (
      <div className={styles.systemMessage}>
        <span>{message.content}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${isOwn ? styles.own : styles.other}`}>
      {!isOwn && providerName && (
        <span className={styles.senderName}>{providerName}</span>
      )}
      
      <div className={styles.bubble}>
        {message.content && (
          <p className={styles.content}>{message.content}</p>
        )}
        
        {message.attachments.length > 0 && (
          <div className={styles.attachments}>
            {message.attachments.map((attachment, idx) => (
              <div 
                key={idx}
                className={`${styles.attachment} ${isImage(attachment.mimeType) ? styles.imageAttachment : ''}`}
                onClick={() => onDownloadFile?.(attachment)}
              >
                {isImage(attachment.mimeType) ? (
                  <AuthenticatedImage 
                    attachment={attachment}
                    onDownload={() => onDownloadFile?.(attachment)}
                  />
                ) : (
                  <div className={styles.fileInfo}>
                    <span className={styles.fileIcon}>{getFileIcon(attachment.mimeType)}</span>
                    <div className={styles.fileDetails}>
                      <span className={styles.fileName}>{attachment.originalName}</span>
                      <span className={styles.fileSize}>{formatFileSize(attachment.size)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className={styles.meta}>
        <span className={styles.time}>{formatTime(message.createdAt)}</span>
        {isOwn && message.readAt && (
          <span className={styles.read} title={t('messages_read')}>✓✓</span>
        )}
        {isOwn && !message.readAt && (
          <span className={styles.sent} title={t('messages_sent')}>✓</span>
        )}
      </div>
    </div>
  );
}

