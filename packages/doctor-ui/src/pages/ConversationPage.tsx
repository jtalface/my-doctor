/**
 * Conversation Page
 * 
 * Chat view for a single conversation with a patient.
 * Includes audio calling functionality.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../auth';
import * as api from '../services/api';
import { WebRTCCall, CallState } from '../services/webrtc';
import CallModal from '../components/CallModal';
import styles from './ConversationPage.module.css';

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const { doctor: _doctor } = useAuth();
  const [conversation, setConversation] = useState<api.Conversation | null>(null);
  const [messages, setMessages] = useState<api.Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasLoadedRef = useRef(false);

  // Call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [callInstance, setCallInstance] = useState<WebRTCCall | null>(null);
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!id) return;
    try {
      const [convRes, msgRes] = await Promise.all([
        api.getConversation(id),
        api.getMessages(id),
      ]);
      setConversation(convRes.conversation);
      setMessages(msgRes.messages);
      
      // Mark as read
      if (convRes.conversation.unreadCount > 0) {
        api.markConversationRead(id);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadMessages();
  }, [id, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Poll for new messages
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.getMessages(id);
        if (res.messages.length !== messages.length) {
          setMessages(res.messages);
          api.markConversationRead(id);
        }
      } catch {
        // Ignore polling errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [id, messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await api.sendMessage(id, newMessage.trim());
      setMessages((prev) => [...prev, res.message]);
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // Call handling
  const handleStartCall = async () => {
    if (!id || !WebRTCCall.isSupported()) {
      alert('Audio calls are not supported in this browser. Please use Chrome, Firefox, or Safari.');
      return;
    }

    setIsInitiatingCall(true);

    const call = new WebRTCCall({
      onStateChange: (state: CallState) => {
        console.log('[Call] State changed:', state);
        if (state === 'ended' || state === 'failed') {
          setIsCallActive(false);
          setCallInstance(null);
        }
      },
      onRemoteStream: () => {
        // Handled in CallModal
      },
      onError: (error: string, canFallback: boolean) => {
        console.error('[Call] Error:', error, canFallback);
      },
      onEnded: () => {
        setIsCallActive(false);
        setCallInstance(null);
      },
    });

    setCallInstance(call);
    setIsCallActive(true);
    setIsInitiatingCall(false);

    // Start the call
    await call.initiateCall(id);
  };

  const handleCloseCall = () => {
    setIsCallActive(false);
    setCallInstance(null);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString();
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: api.Message[] }[] = [];
  let currentDate = '';
  messages.forEach((msg) => {
    const msgDate = formatDate(msg.createdAt);
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msgDate, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className={styles.error}>
        <h2>Conversation not found</h2>
        <Link to="/conversations">Back to messages</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Call Modal */}
      {isCallActive && callInstance && (
        <CallModal
          callInstance={callInstance}
          remoteName={conversation.patient?.name || 'Patient'}
          remotePhone={undefined} // TODO: Get patient phone if available
          isIncoming={false}
          onClose={handleCloseCall}
        />
      )}

      {/* Header */}
      <header className={styles.header}>
        <Link to="/conversations" className={styles.backBtn}>
          ← Back
        </Link>
        <div className={styles.patientInfo}>
          <div className={styles.avatar}>
            {conversation.patient?.name?.charAt(0) || 'P'}
          </div>
          <div>
            <h2 className={styles.patientName}>
              {conversation.patient?.name || 'Patient'}
            </h2>
            {conversation.subject && (
              <span className={styles.subject}>{conversation.subject}</span>
            )}
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.callBtn}
            onClick={handleStartCall}
            disabled={isInitiatingCall || isCallActive}
            title="Start audio call"
          >
            📞
          </button>
          <Link 
            to={`/patients/${conversation.patient?._id}`}
            className={styles.viewProfileBtn}
          >
            View Profile
          </Link>
        </div>
      </header>

      {/* Messages */}
      <div className={styles.messages}>
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex}>
            <div className={styles.dateDivider}>
              <span>{group.date}</span>
            </div>
            {group.messages.map((msg) => (
              <div
                key={msg._id}
                className={`${styles.message} ${
                  msg.senderType === 'provider' ? styles.sent : styles.received
                }`}
              >
                <div className={styles.bubble}>
                  <p className={styles.messageContent}>{msg.content}</p>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className={styles.attachments}>
                      {msg.attachments.map((att, i) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.attachment}
                        >
                          📎 {att.originalName}
                        </a>
                      ))}
                    </div>
                  )}
                  <span className={styles.time}>{formatTime(msg.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className={styles.inputArea} onSubmit={handleSend}>
        <textarea
          ref={inputRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
          disabled={isSending}
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={!newMessage.trim() || isSending}
        >
          {isSending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
