/**
 * ChatWindow Component
 * 
 * Displays messages in a conversation and handles sending new messages.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { api, Conversation, Message, Provider, MessageAttachment } from '../../services/api';
import { useTranslate } from '../../i18n';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import styles from './ChatWindow.module.css';

interface ChatWindowProps {
  conversation: Conversation;
  onBack?: () => void;
}

export function ChatWindow({ conversation, onBack }: ChatWindowProps) {
  const t = useTranslate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const isLoadingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const conversationIdRef = useRef(conversation._id);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Reset refs when conversation changes
  useEffect(() => {
    if (conversationIdRef.current !== conversation._id) {
      conversationIdRef.current = conversation._id;
      hasInitializedRef.current = false;
      isLoadingRef.current = false;
    }
  }, [conversation._id]);

  // Load messages - using refs to prevent duplicate calls
  const loadMessages = useCallback(async (isInitial = false) => {
    // Prevent concurrent or duplicate requests
    if (isLoadingRef.current) return;
    if (isInitial && hasInitializedRef.current) return;
    
    isLoadingRef.current = true;
    if (isInitial) hasInitializedRef.current = true;

    try {
      // Extract provider ID - could be string or object
      const providerId = typeof conversation.providerId === 'string' 
        ? conversation.providerId 
        : (conversation.providerId as any)?._id || conversation.provider?._id;

      const [fetchedMessages, fetchedProvider] = await Promise.all([
        api.getMessages(conversation._id),
        // Use already-populated provider if available
        conversation.provider 
          ? Promise.resolve(conversation.provider)
          : providerId 
            ? api.getProvider(providerId)
            : Promise.resolve(null),
      ]);
      
      setMessages(fetchedMessages);
      setProvider(fetchedProvider);
      
      if (isInitial) {
        setIsLoading(false);
        // Mark as read (fire and forget)
        api.markConversationAsRead(conversation._id).catch(() => {});
      }
      
      scrollToBottom();
    } catch (err) {
      if (isInitial) {
        setError(err instanceof Error ? err.message : 'Failed to load messages');
        setIsLoading(false);
      }
    } finally {
      isLoadingRef.current = false;
    }
  }, [conversation._id, conversation.providerId, conversation.provider, scrollToBottom]);

  // Initial load and polling - only depend on conversation._id
  useEffect(() => {
    loadMessages(true);
    
    // Poll for new messages every 10 seconds
    pollIntervalRef.current = window.setInterval(() => {
      loadMessages(false);
    }, 10000);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [conversation._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Send message
  const handleSend = async (content: string, files: File[]) => {
    try {
      let newMessage: Message;
      
      if (files.length > 0) {
        newMessage = await api.sendMessageWithAttachments(conversation._id, content, files);
      } else {
        newMessage = await api.sendMessage(conversation._id, content);
      }
      
      setMessages(prev => [...prev, newMessage]);
      scrollToBottom();
    } catch (err) {
      throw err; // Let MessageInput handle the error
    }
  };

  // Download file
  const handleDownloadFile = (attachment: MessageAttachment) => {
    const url = api.getFileDownloadUrl(attachment.filename);
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>{t('messages_loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>⚠️</span>
          <p>{error}</p>
          <button onClick={() => loadMessages(true)}>{t('common_try_again')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        {onBack && (
          <button className={styles.backButton} onClick={onBack}>
            ←
          </button>
        )}
        
        <div className={styles.providerInfo}>
          <div className={styles.avatar}>
            {provider?.avatarUrl ? (
              <img src={provider.avatarUrl} alt="" />
            ) : (
              <span>{provider?.name?.[0] || '?'}</span>
            )}
            <span className={`${styles.status} ${provider?.isOnline ? styles.online : styles.offline}`} />
          </div>
          <div className={styles.details}>
            <h2 className={styles.name}>
              {provider?.title} {provider?.name || t('messages_unknown_provider')}
            </h2>
            <span className={styles.specialty}>
              {provider?.specialty}
              {' • '}
              {provider?.isOnline ? (
                <span className={styles.onlineText}>{t('messages_online')}</span>
              ) : (
                <span className={styles.offlineText}>{t('messages_offline')}</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>💬</span>
            <p>{t('messages_start_chatting')}</p>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={message.senderType === 'patient'}
                providerName={message.senderType === 'provider' ? provider?.name : undefined}
                onDownloadFile={handleDownloadFile}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        disabled={conversation.status === 'closed'}
        placeholder={
          conversation.status === 'closed' 
            ? t('messages_conversation_closed')
            : undefined
        }
      />
    </div>
  );
}

