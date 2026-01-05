/**
 * MessageBubble Component
 * 
 * Displays a single message with content and attachments.
 */

import { Message, MessageAttachment } from '../../services/api';
import { useTranslate } from '../../i18n';
import styles from './MessageBubble.module.css';

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
                  <img 
                    src={attachment.url} 
                    alt={attachment.originalName}
                    className={styles.attachmentImage}
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

