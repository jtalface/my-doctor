/**
 * MessageInput Component
 * 
 * Input field for composing and sending messages with file attachments.
 */

import { useState, useRef, ChangeEvent, KeyboardEvent, FormEvent } from 'react';
import { useTranslate } from '../../i18n';
import styles from './MessageInput.module.css';

interface MessageInputProps {
  onSend: (content: string, files: File[]) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

export function MessageInput({ onSend, disabled, placeholder }: MessageInputProps) {
  const t = useTranslate();
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setError(null);
    
    // Validate file count
    if (files.length + selectedFiles.length > MAX_FILES) {
      setError(t('messages_error_too_many_files', { max: MAX_FILES }));
      return;
    }
    
    // Validate each file
    const validFiles: File[] = [];
    for (const file of selectedFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(t('messages_error_invalid_type'));
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(t('messages_error_file_too_large'));
        continue;
      }
      validFiles.push(file);
    }
    
    setFiles(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    
    if ((!content.trim() && files.length === 0) || isSending || disabled) {
      return;
    }
    
    setIsSending(true);
    setError(null);
    
    try {
      await onSend(content.trim(), files);
      setContent('');
      setFiles([]);
      
      // Focus back on textarea
      textareaRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages_error_send_failed'));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') return '📄';
    if (type.startsWith('image/')) return '🖼️';
    return '📎';
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      {error && (
        <div className={styles.error}>
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {files.length > 0 && (
        <div className={styles.filePreview}>
          {files.map((file, idx) => (
            <div key={idx} className={styles.fileItem}>
              <span className={styles.fileIcon}>{getFileIcon(file.type)}</span>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
              </div>
              <button 
                type="button"
                className={styles.removeFile}
                onClick={() => removeFile(idx)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className={styles.inputRow}>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          multiple
          onChange={handleFileSelect}
          className={styles.fileInput}
          id="message-file-input"
        />
        <label 
          htmlFor="message-file-input" 
          className={styles.attachButton}
          title={t('messages_attach_file')}
        >
          📎
        </label>
        
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('messages_type_message')}
          className={styles.textarea}
          disabled={disabled || isSending}
          rows={1}
        />
        
        <button
          type="submit"
          className={styles.sendButton}
          disabled={(!content.trim() && files.length === 0) || isSending || disabled}
          title={t('messages_send')}
        >
          {isSending ? (
            <span className={styles.sendingSpinner} />
          ) : (
            '➤'
          )}
        </button>
      </div>
    </form>
  );
}

